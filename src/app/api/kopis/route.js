import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

const KOPIS_API_URL = "http://www.kopis.or.kr/openApi/restful/pblprfr";
const KOPIS_FACILITY_API_URL = "http://www.kopis.or.kr/openApi/restful/prfplc";
const CATEGORY_GENRES = {
  concert: ["CCCD"],// 대중음악
  musical: ["GGGA"],
};
const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true });

function toCoordinate(value) {
  if (value === undefined || value === null || value === "") return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function normalizeLocationName(value) {
  const locationName = String(value ?? "").trim();
  const duplicateSuffix = locationName.match(/^(.*?)\s*\(([^()]*)\)$/);
  if (duplicateSuffix && duplicateSuffix[1].trim() === duplicateSuffix[2].trim()) {
    return duplicateSuffix[1].trim();
  }
  return locationName;
}

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function normalizePerformance(performance, type) {
  const relations = performance.relates?.relate;
  const reservation = (Array.isArray(relations) ? relations : relations ? [relations] : [])
    .find((relation) => relation.relateurl) ?? null;

  return {
    id: `kopis-${performance.mt20id}`,
    type,
    title: performance.prfnm ?? "제목 정보 없음",
    imageUrl: performance.poster ?? "",
    description: performance.sty ?? performance.genrenm ?? "",
    startDate: performance.prfpdfrom?.replaceAll(".", "-") ?? "",
    endDate: performance.prfpdto?.replaceAll(".", "-") ?? "",
    locationName: normalizeLocationName(performance.fcltynm) || "장소 정보 없음",
    address: performance.adres ?? performance.area ?? "",
    latitude: toCoordinate(performance.la),
    longitude: toCoordinate(performance.lo),
    contactPoint: performance.telno ?? "",
    price: performance.pcseguidance || "가격 정보 없음",
    reservationSite: reservation?.relatenm ?? "",
    reservationUrl: reservation?.relateurl ?? "",
    detailUrl: `https://www.kopis.or.kr/por/db/pblprfr/pblprfrView.do?mt20Id=${encodeURIComponent(performance.mt20id ?? "")}`,
    source: "KOPIS",
  };
}

async function fetchGenrePerformances(apiKey, startDate, endDate, genre) {
  const upstreamUrl = new URL(KOPIS_API_URL);
  const params = new URLSearchParams({
    service: apiKey,
    stdate: startDate.replaceAll("-", ""),
    eddate: endDate.replaceAll("-", ""),
    cpage: "1",
    rows: "100",
  });
  if (genre) params.set("shcate", genre);
  upstreamUrl.search = params.toString();

  const response = await fetch(upstreamUrl, { next: { revalidate: 3600 } });
  const body = await response.text();
  if (!response.ok) throw new Error("KOPIS 공연목록 요청에 실패했습니다.");

  let data;
  try {
    data = parser.parse(body);
  } catch {
    throw new Error("KOPIS에서 올바른 XML 응답을 받지 못했습니다.");
  }

  const errorResponse = data?.error ?? data?.result;
  const apiError = errorResponse?.msg ?? errorResponse?.err ?? data?.msg ?? data?.err;
  if (apiError) throw new Error(`KOPIS 오류: ${apiError}`);
  if (!Object.prototype.hasOwnProperty.call(data ?? {}, "dbs")) {
    throw new Error("KOPIS 응답 형식이 올바르지 않습니다.");
  }

  const performances = data?.dbs?.db;
  const items = Array.isArray(performances) ? performances : performances ? [performances] : [];
  const apiFailure = items.find((item) => item.returncode && !["00", "01"].includes(item.returncode));
  if (apiFailure) {
    throw new Error(`KOPIS 오류: ${apiFailure.errmsg ?? apiFailure.returncode}`);
  }

  return items.filter((performance) => performance.mt20id);
}

async function fetchPerformanceDetail(apiKey, performanceId) {
  const detailUrl = new URL(`${KOPIS_API_URL}/${encodeURIComponent(performanceId)}`);
  detailUrl.search = new URLSearchParams({ service: apiKey }).toString();
  const response = await fetch(detailUrl, { next: { revalidate: 86400 } });
  if (!response.ok) return null;

  const data = parser.parse(await response.text());
  const detail = data?.dbs?.db;
  return detail && !Array.isArray(detail) ? detail : null;
}

async function fetchFacilityDetail(apiKey, facilityId) {
  const facilityUrl = new URL(`${KOPIS_FACILITY_API_URL}/${encodeURIComponent(facilityId)}`);
  facilityUrl.search = new URLSearchParams({ service: apiKey }).toString();
  const response = await fetch(facilityUrl, { next: { revalidate: 2592000 } });
  if (!response.ok) return null;

  const data = parser.parse(await response.text());
  const facility = data?.dbs?.db;
  return facility && !Array.isArray(facility) ? facility : null;
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index]);
    }
  }));

  return results;
}

export async function GET(request) {
  const apiKey = process.env.KOPIS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "KOPIS_API_KEY 환경변수를 설정해주세요." },
      { status: 500 }
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const category = searchParams.get("category");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const includeCoordinates = searchParams.get("includeCoordinates") === "true";

  if (!CATEGORY_GENRES[category]) {
    return NextResponse.json({ error: "지원하지 않는 KOPIS 카테고리입니다." }, { status: 400 });
  }
  if (!isValidDate(startDate) || !isValidDate(endDate) || startDate > endDate) {
    return NextResponse.json({ error: "조회 날짜 범위가 올바르지 않습니다." }, { status: 400 });
  }

  try {
    let performances;
    if (category === "musical") {
      performances = await fetchGenrePerformances(apiKey, startDate, endDate, CATEGORY_GENRES.musical[0]);
      if (performances.length === 0) {
        performances = (await fetchGenrePerformances(apiKey, startDate, endDate))
          .filter((performance) => performance.genrenm === "뮤지컬");
      }
    } else {
      const results = await Promise.all(
        CATEGORY_GENRES[category].map((genre) =>
          fetchGenrePerformances(apiKey, startDate, endDate, genre)
        )
      );
      performances = [...new Map(results.flat().map((item) => [item.mt20id, item])).values()];
    }

    const items = await mapWithConcurrency(performances, 5, async (performance) => {
      let detail = null;
      try {
        detail = await fetchPerformanceDetail(apiKey, performance.mt20id);
      } catch {
        detail = null;
      }

      let facility = null;
      if (includeCoordinates && detail?.mt10id) {
        try {
          facility = await fetchFacilityDetail(apiKey, detail.mt10id);
        } catch {
          facility = null;
        }
      }

      return normalizePerformance({ ...performance, ...detail, ...facility }, category);
    });
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "KOPIS API 요청에 실패했습니다." },
      { status: 502 }
    );
  }
}