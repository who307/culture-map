import { NextResponse } from "next/server";

const TOUR_API_URL = "https://apis.data.go.kr/B551011/KorService2/searchFestival2";

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function formatDate(value) {
  const digits = String(value ?? "").replaceAll(/\D/g, "");
  return digits.length === 8 ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : "";
}

function toCoordinate(value) {
  if (value === undefined || value === null || value === "") return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function getApiKey(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getExternalUrl(value) {
  const source = String(value ?? "").trim();
  const href = source.match(/href=["']([^"']+)["']/i)?.[1] ?? source;
  try {
    const url = new URL(href);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function normalizeEvent(event) {
  const address = [event.addr1, event.addr2].filter(Boolean).join(" ");
  const title = event.title ?? "행사명 정보 없음";
  const officialUrl = getExternalUrl(event.homepage);
  return {
    id: `tour-${event.contentid}`,
    type: "festival",
    title,
    imageUrl: event.firstimage || event.firstimage2 || "",
    description: event.overview ?? "",
    startDate: formatDate(event.eventstartdate),
    endDate: formatDate(event.eventenddate),
    locationName: event.addr1 || event.title || "장소 정보 없음",
    address,
    latitude: toCoordinate(event.mapy),
    longitude: toCoordinate(event.mapx),
    price: event.usetimefestival || "가격 정보 없음",
    contactPoint: event.tel || event.sponsor1tel || "",
    detailUrl: officialUrl || `https://search.naver.com/search.naver?query=${encodeURIComponent(`${title}`.trim())}`,
    detailLinkLabel: officialUrl ? "공식 홈페이지" : "행사 검색",
    source: "한국관광콘텐츠랩",
  };
}

export async function GET(request) {
  const apiKey = process.env.KTO_TOUR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "KTO_TOUR_API_KEY 환경변수를 설정해주세요." },
      { status: 500 }
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (!isValidDate(startDate) || !isValidDate(endDate) || startDate > endDate) {
    return NextResponse.json({ error: "조회 날짜 범위가 올바르지 않습니다." }, { status: 400 });
  }

  const upstreamUrl = new URL(TOUR_API_URL);
  upstreamUrl.search = new URLSearchParams({
    serviceKey: getApiKey(apiKey),
    MobileOS: "ETC",
    MobileApp: "CultureMap",
    eventStartDate: startDate.replaceAll("-", ""),
    eventEndDate: endDate.replaceAll("-", ""),
    pageNo: "1",
    numOfRows: "100",
    _type: "json",
  }).toString();

  try {
    const response = await fetch(upstreamUrl, { next: { revalidate: 3600 } });
    const data = await response.json();
    const result = data?.response;
    if (!response.ok || result?.header?.resultCode !== "0000") {
      return NextResponse.json(
        { error: result?.header?.resultMsg ?? "한국관광콘텐츠랩 행사 API 요청에 실패했습니다." },
        { status: 502 }
      );
    }

    const items = result?.body?.items?.item;
    const events = Array.isArray(items) ? items : items ? [items] : [];
    return NextResponse.json({ items: events.map(normalizeEvent) });
  } catch {
    return NextResponse.json(
      { error: "한국관광콘텐츠랩 행사 API에 연결하지 못했습니다." },
      { status: 502 }
    );
  }
}