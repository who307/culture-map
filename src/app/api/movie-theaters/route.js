import { NextResponse } from "next/server";
import proj4 from "proj4";

const THEATER_API_URL = "https://apis.data.go.kr/1741000/movie_theaters/info";
// 공공데이터포털이 numOfRows를 100으로 제한해 여러 페이지를 나눠 받음
const PAGE_SIZE = 100;
const CONCURRENCY = 6;
// 인허가 데이터 좌표는 위경도가 아닌 중부원점 TM(EPSG:5174, Bessel 타원체)
const TM_PROJECTION = "+proj=tmerc +lat_0=38 +lon_0=127.0028902777778 +k=1 +x_0=200000 +y_0=500000 +ellps=bessel +units=m +no_defs +towgs84=-115.80,474.99,674.11,1.16,-2.31,-1.63,6.43";

class TheaterApiError extends Error {}

async function fetchPage(serviceKey, pageNo) {
  const upstreamUrl = new URL(THEATER_API_URL);
  upstreamUrl.search = new URLSearchParams({
    serviceKey,
    pageNo: String(pageNo),
    numOfRows: String(PAGE_SIZE),
    type: "json",
    // 영업/정상 상태만 받음 (폐업·휴업·말소 제외)
    "cond[SALS_STTS_CD::EQ]": "01",
  }).toString();

  const response = await fetch(upstreamUrl, { next: { revalidate: 86400 } });
  const body = await response.text();
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    data = null;
  }

  if (!response.ok) {
    const errorCode = data?.OpenAPI_ServiceResponse?.cmmMsgHeader?.errMsg;
    throw new TheaterApiError(errorCode === "SERVICE_KEY_IS_NOT_REGISTERED_ERROR"
      ? "서비스 키가 등록되지 않았습니다. 공공데이터포털의 활용 신청 승인 상태를 확인해주세요."
      : "공공데이터포털 영화관 API 요청에 실패했습니다.");
  }
  if (!data) throw new TheaterApiError("공공데이터포털에서 JSON 응답을 받지 못했습니다.");

  const header = data?.response?.header;
  if (header?.resultCode && !["00", "0"].includes(header.resultCode)) {
    throw new TheaterApiError(header.resultMsg ?? "공공데이터포털 영화관 API 오류입니다.");
  }

  const pageBody = data?.response?.body;
  const items = pageBody?.items?.item ?? [];
  return {
    totalCount: Number(pageBody?.totalCount) || 0,
    items: Array.isArray(items) ? items : [items],
  };
}

async function fetchAllRows(serviceKey) {
  const firstPage = await fetchPage(serviceKey, 1);
  const pageCount = Math.ceil(firstPage.totalCount / PAGE_SIZE);
  const restPages = Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => index + 2);
  const rows = [...firstPage.items];
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < restPages.length) {
      const page = await fetchPage(serviceKey, restPages[nextIndex++]);
      rows.push(...page.items);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, restPages.length) }, worker));
  return rows;
}

function toLatLng(row) {
  const x = Number(row.CRD_INFO_X);
  const y = Number(row.CRD_INFO_Y);
  if (!row.CRD_INFO_X || !row.CRD_INFO_Y || !Number.isFinite(x) || !Number.isFinite(y)) return null;

  const [longitude, latitude] = proj4(TM_PROJECTION, "WGS84", [x, y]);
  return { latitude, longitude };
}

// "메가박스중앙(주) 대전중앙로지점 8관" → "메가박스 대전중앙로지점", "CGV연남 1관(4DX)" → "CGV연남"
function cleanTheaterName(name) {
  return String(name ?? "")
    .replace(/롯데컬처웍스\(주\)\s*/, "")
    .replace(/메가박스\s*중앙/, "메가박스")
    .replace(/\(주\)|주식회사/g, " ")
    .replace(/\(\s*(?:컴포트)?\s*제?\d+\s*(?:상영)?관\s*\)$/, "")
    .replace(/\s*(?:컴포트|COMFORT|제)?\s*\d+\s*(?:상영)?관(?:\s*\([^)]*\))?$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

// 상영관(1관, 2관…)마다 따로 등록되어 있어 건물 주소가 같은 행을 한 극장으로 묶음
function getBuildingAddress(row) {
  return String(row.ROAD_NM_ADDR || row.LOTNO_ADDR || "")
    .split(",")[0]
    .replace(/\s*\(.*$/, "")
    .trim();
}

// 지도에는 주요 멀티플렉스만 표시. 관 이름에만 브랜드가 드러나는 곳(코엑스 "MEGA｜MX4D관" 등)도 있어
// 극장에 속한 모든 상영관 이름을 함께 검사
const THEATER_BRANDS = [
  { label: "CGV", pattern: /cgv|씨지브이/i },
  { label: "롯데시네마", pattern: /롯데시네마|롯데컬처웍스/ },
  // 돌비 시네마·부티크는 국내에서 메가박스만 쓰는 상영관 이름
  { label: "메가박스", pattern: /메가박스|megabox|MX4D|MEGA｜|돌비\s*시네마|dolby\s*cinema|부티크/i },
  { label: "씨네Q", pattern: /씨네큐|씨네q|cine\s*q/i },
];

function findTheaterBrand(rows) {
  const names = rows.map((row) => row.BPLC_NM ?? "").join(" | ");
  return THEATER_BRANDS.find(({ pattern }) => pattern.test(names)) ?? null;
}

function pickTheaterName(rows) {
  const counts = new Map();
  for (const row of rows) {
    const name = cleanTheaterName(row.BPLC_NM);
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  // 가장 많이 쓰인 이름, 같으면 짧은 이름
  const [best] = [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].length - right[0].length);
  return best?.[0] ?? String(rows[0].BPLC_NM ?? "").trim();
}

function getDistanceKm(left, right) {
  const toRadian = Math.PI / 180;
  const latDelta = (right.latitude - left.latitude) * toRadian;
  const lngDelta = (right.longitude - left.longitude) * toRadian;
  const haversine = Math.sin(latDelta / 2) ** 2
    + Math.cos(left.latitude * toRadian) * Math.cos(right.latitude * toRadian) * Math.sin(lngDelta / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(haversine));
}

// 같은 극장이 도로명·지번 등 다른 주소로 따로 등록된 경우가 있어, 이름이 같고 500m 안이면 하나로 합침
function mergeSameTheaters(theaters) {
  const merged = [];
  for (const theater of theaters) {
    const same = merged.find((item) => item.title === theater.title
      && item.latitude !== null && theater.latitude !== null
      && getDistanceKm(item, theater) < 0.5);
    if (same) {
      same.screenCount += theater.screenCount;
      same.contactPoint ||= theater.contactPoint;
    } else {
      merged.push(theater);
    }
  }
  return merged;
}

function normalizeTheater(rows, brand) {
  const pickedName = pickTheaterName(rows);
  const coordinates = rows.map(toLatLng).find(Boolean);
  const address = rows.find((row) => row.ROAD_NM_ADDR)?.ROAD_NM_ADDR ?? rows[0].LOTNO_ADDR ?? "";
  // "코엑스 르 리클라이너"처럼 이름에 브랜드가 없으면 앞에 붙여 상영시간표 검색도 정확하게 하고,
  // 지점명 없이 "롯데시네마"만 있으면 주소의 시·군·구를 붙여 구분
  const brandedName = brand.pattern.test(pickedName) ? pickedName : `${brand.label} ${pickedName}`;
  const name = brandedName === brand.label ? `${brand.label} ${address.split(" ")[1] ?? ""}`.trim() : brandedName;

  return {
    // 관리번호는 지자체(개방자치단체) 안에서만 고유해 지자체 코드와 묶어 씀
    id: `theater-${rows[0].OPN_ATMY_GRP_CD}-${rows[0].MNG_NO}`,
    // 지도에서 영화 카테고리 색·필터를 그대로 쓰기 위해 movie 타입으로 내려줌
    type: "movie",
    title: name,
    locationName: name,
    address,
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
    contactPoint: rows.find((row) => row.TELNO)?.TELNO ?? "",
    brand: brand.label,
    screenCount: rows.length,
    // 공공 API에는 극장별 상영 정보가 없어 네이버 상영시간표 검색으로 연결
    detailUrl: `https://search.naver.com/search.naver?query=${encodeURIComponent(`${name} 상영시간표`)}`,
    detailLinkLabel: "상영시간표",
    source: "행정안전부",
  };
}

export async function GET() {
  const serviceKey = process.env.MOVIE_THEATERS_SERVICE_KEY;
  if (!serviceKey) {
    return NextResponse.json(
      { error: "MOVIE_THEATERS_SERVICE_KEY 환경변수를 설정해주세요." },
      { status: 500 }
    );
  }

  let decodedServiceKey = serviceKey;
  try {
    decodedServiceKey = decodeURIComponent(serviceKey);
  } catch {
    decodedServiceKey = serviceKey;
  }

  try {
    const rows = await fetchAllRows(decodedServiceKey);
    const theaters = new Map();
    for (const row of rows) {
      const key = getBuildingAddress(row);
      if (!key) continue;
      if (!theaters.has(key)) theaters.set(key, []);
      theaters.get(key).push(row);
    }

    const items = mergeSameTheaters([...theaters.values()].flatMap((theaterRows) => {
      const brand = findTheaterBrand(theaterRows);
      return brand ? [normalizeTheater(theaterRows, brand)] : [];
    }));
    return NextResponse.json({ items, totalCount: items.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof TheaterApiError ? error.message : "공공데이터포털 영화관 API에 연결하지 못했습니다." },
      { status: 502 }
    );
  }
}
