import { NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

const CULTURE_API_URL = "https://api.kcisa.kr/openapi/CNV_060/request";
const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false, trimValues: true });

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

function parsePeriod(value) {
  const source = String(value ?? "");
  const compactDates = [...source.matchAll(/\b(\d{8})\b/g)].map(([, date]) => formatDate(date));
  const separatedDates = [...source.matchAll(/(\d{4})\s*[./-]\s*(\d{1,2})\s*[./-]\s*(\d{1,2})/g)]
    .map(([, year, month, day]) => `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`);
  const dates = compactDates.length ? compactDates : separatedDates;

  return {
    startDate: dates[0] ?? "",
    endDate: dates[1] ?? dates[0] ?? "",
  };
}

function normalizeExhibition(item) {
  const period = parsePeriod(item.eventPeriod ?? item.EVENT_PERIOD ?? item.PERIOD ?? item.period);
  const title = item.TITLE ?? item.title ?? "전시명 정보 없음";
  const locationName = item.EVENT_SITE ?? item.eventSite ?? item.place ?? "장소 정보 없음";
  const sourceId = item.LOCAL_ID ?? item.localId ?? item.seq;
  const fallbackId = [title, locationName, period.startDate, period.endDate].join("|");

  return {
    id: `culture-${encodeURIComponent(sourceId || fallbackId)}`,
    type: "exhibition",
    title,
    imageUrl: item.IMAGE_OBJECT ?? item.imageObject ?? item.thumbnail ?? "",
    description: item.DESCRIPTION ?? item.description ?? "",
    startDate: period.startDate || formatDate(item.startDate),
    endDate: period.endDate || formatDate(item.endDate),
    locationName,
    address: item.EVENT_SITE ?? item.eventSite ?? item.address ?? "",
    latitude: toCoordinate(item.gpsY ?? item.latitude),
    longitude: toCoordinate(item.gpsX ?? item.longitude),
    price: item.CHARGE ?? item.charge ?? item.price ?? "가격 정보 없음",
    contactPoint: item.CONTACT_POINT ?? item.contactPoint ?? "",
    detailUrl: item.URL ?? item.url ?? item.ticketLink ?? "",
    source: "문화포털",
  };
}

function getItems(data) {
  const response = data?.response ?? data;
  const messageBody = response?.msgBody ?? response?.body ?? response?.data;
  const list = messageBody?.perforList ?? messageBody?.item ?? messageBody?.items;
  const items = list?.item ?? list;
  return Array.isArray(items) ? items : items ? [items] : [];
}

export async function GET(request) {
  const apiKey = process.env.CULTURE_PORTAL_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CULTURE_PORTAL_API_KEY 환경변수를 설정해주세요." },
      { status: 500 }
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  if (!isValidDate(startDate) || !isValidDate(endDate) || startDate > endDate) {
    return NextResponse.json({ error: "조회 날짜 범위가 올바르지 않습니다." }, { status: 400 });
  }

  const upstreamUrl = new URL(CULTURE_API_URL);
  upstreamUrl.search = new URLSearchParams({
    serviceKey: getApiKey(apiKey),
    dtype: "전시",
    title: "전시",
    pageNo: "1",
    numOfRows: "100",
  }).toString();

  try {
    const response = await fetch(upstreamUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });
    const body = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        { error: "문화포털 전시 API 요청에 실패했습니다." },
        { status: 502 }
      );
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      data = parser.parse(body);
    }

    const responseHeader = data?.response?.header
      ?? data?.response?.comMsgHeader
      ?? data?.header
      ?? data?.comMsgHeader;
    const returnCode = responseHeader?.resultCode ?? responseHeader?.returnCode;
    if (responseHeader?.successYN === "N" || (returnCode && !["0000", "00"].includes(returnCode))) {
      return NextResponse.json(
        { error: responseHeader?.resultMsg ?? responseHeader?.errMsg ?? "문화포털 전시 API 오류입니다." },
        { status: 502 }
      );
    }

    const normalizedItems = getItems(data).map(normalizeExhibition);
    const uniqueItems = [...new Map(normalizedItems.map((item) => [item.id, item])).values()];
    return NextResponse.json({ items: uniqueItems });
  } catch {
    return NextResponse.json(
      { error: "문화포털 전시 API에 연결하지 못했습니다." },
      { status: 502 }
    );
  }
}