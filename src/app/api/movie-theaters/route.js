import { NextResponse } from "next/server";

const THEATER_API_URL = "https://apis.data.go.kr/1741000/movie_theaters/info";

export async function GET(request) {
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

  const searchParams = new URL(request.url).searchParams;
  const pageNo = Math.max(1, Number(searchParams.get("pageNo")) || 1);
  const numOfRows = Math.min(1000, Math.max(1, Number(searchParams.get("numOfRows")) || 1000));
  const upstreamUrl = new URL(THEATER_API_URL);
  upstreamUrl.search = new URLSearchParams({
    serviceKey: decodedServiceKey,
    pageNo: String(pageNo),
    numOfRows: String(numOfRows),
    type: "json",
  }).toString();

  try {
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
      const message = errorCode === "SERVICE_KEY_IS_NOT_REGISTERED_ERROR"
        ? "서비스 키가 등록되지 않았습니다. 공공데이터포털의 활용 신청 승인 상태를 확인해주세요."
        : "공공데이터포털 영화관 API 요청에 실패했습니다.";
      return NextResponse.json(
        { error: message, errorCode },
        { status: 502 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "공공데이터포털에서 JSON 응답을 받지 못했습니다." },
        { status: 502 }
      );
    }

    const header = data?.response?.header;
    if (header?.resultCode && !["00", "0"].includes(header.resultCode)) {
      return NextResponse.json(
        { error: header.resultMsg ?? "공공데이터포털 영화관 API 오류입니다." },
        { status: 502 }
      );
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "공공데이터포털 영화관 API에 연결하지 못했습니다." },
      { status: 502 }
    );
  }
}