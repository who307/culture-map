import { NextResponse } from "next/server";

const KOBIS_API_URL = "https://www.kobis.or.kr/kobisopenapi/webservice/rest/boxoffice";

function getKoreanToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()).replaceAll("-", "");
}

function getPreviousDate(date) {
  const parsedDate = new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T00:00:00Z`);
  parsedDate.setUTCDate(parsedDate.getUTCDate() - 1);
  return parsedDate.toISOString().slice(0, 10).replaceAll("-", "");
}

function getLatestSunday(date) {
  const parsedDate = new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}T00:00:00Z`);
  parsedDate.setUTCDate(parsedDate.getUTCDate() - parsedDate.getUTCDay());
  return parsedDate.toISOString().slice(0, 10).replaceAll("-", "");
}

function normalizeMovie(movie, type, showRange) {
  return {
    id: `kobis-${movie.movieCd}-${type}`,
    movieCd: movie.movieCd,
    type: "movie",
    title: movie.movieNm,
    rank: Number(movie.rank),
    popularityRank: Number(movie.rank),
    rankChange: Number(movie.rankInten),
    audienceCount: Number(movie.audiCnt),
    cumulativeAudience: Number(movie.audiAcc),
    salesAmount: Number(movie.salesAmt),
    cumulativeSales: Number(movie.salesAcc),
    salesShare: Number(movie.salesShare),
    screenCount: Number(movie.scrnCnt),
    screeningCount: Number(movie.showCnt),
    openDate: movie.openDt,
    showRange,
    boxOfficeType: type,
  };
}

export async function GET(request) {
  const apiKey = process.env.KOBIS_API_KEY ?? process.env.KOBIS_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "KOBIS_API_KEY 환경변수를 설정해주세요." },
      { status: 500 }
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const requestedDate = (searchParams.get("targetDt") ?? "").replaceAll("-", "");
  const type = searchParams.get("type") === "weekend" ? "weekend" : "daily";
  if (!/^\d{8}$/.test(requestedDate)) {
    return NextResponse.json({ error: "조회 날짜 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const targetDate = type === "weekend" ? getLatestSunday(requestedDate) : requestedDate;
  const requestDates = [targetDate];
  if (type === "daily" && requestedDate === getKoreanToday()) {
    requestDates.push(getPreviousDate(requestedDate));
  }

  try {
    for (const targetDt of requestDates) {
      const endpoint = type === "weekend" ? "searchWeeklyBoxOfficeList.json" : "searchDailyBoxOfficeList.json";
      const upstreamUrl = new URL(`${KOBIS_API_URL}/${endpoint}`);
      const params = { key: apiKey, targetDt };
      if (type === "weekend") params.weekGb = "1";
      upstreamUrl.search = new URLSearchParams(params).toString();

      const response = await fetch(upstreamUrl, { next: { revalidate: 3600 } });
      const data = await response.json();
      const result = data?.boxOfficeResult;
      if (!response.ok || data?.faultInfo || !result) {
        return NextResponse.json(
          { error: data?.faultInfo?.message ?? "KOBIS 박스오피스 요청에 실패했습니다." },
          { status: 502 }
        );
      }

      const list = type === "weekend" ? result.weeklyBoxOfficeList : result.dailyBoxOfficeList;
      if (list?.length || targetDt === requestDates.at(-1)) {
        return NextResponse.json({
          boxOfficeType: result.boxofficeType,
          showRange: result.showRange,
          items: (list ?? []).map((movie) => normalizeMovie(movie, type, result.showRange)),
        });
      }
    }
  } catch {
    return NextResponse.json(
      { error: "KOBIS 박스오피스 API에 연결하지 못했습니다." },
      { status: 502 }
    );
  }

  return NextResponse.json({ items: [] });
}