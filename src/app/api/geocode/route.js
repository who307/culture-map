import { NextResponse } from "next/server";

const PHOTON_API_URL = "https://photon.komoot.io/api/";

export async function GET(request) {
  const query = new URL(request.url).searchParams.get("query")?.trim();
  if (!query || query.length < 3 || query.length > 240) {
    return NextResponse.json({ coordinates: null }, { status: 400 });
  }

  const upstreamUrl = new URL(PHOTON_API_URL);
  upstreamUrl.search = new URLSearchParams({ q: query, limit: "3", lang: "en" }).toString();

  try {
    const response = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/geo+json, application/json",
        "User-Agent": "CultureMap/1.0 (culture discovery map)",
      },
      next: { revalidate: 2592000 },
    });
    if (!response.ok) {
      return NextResponse.json({ coordinates: null }, { status: 502 });
    }

    const data = await response.json();
    const feature = data?.features?.find((result) => {
      const [longitude, latitude] = result?.geometry?.coordinates ?? [];
      return result?.properties?.countrycode?.toLowerCase() === "kr"
        && Number.isFinite(longitude)
        && Number.isFinite(latitude)
        && longitude >= 124
        && longitude <= 132
        && latitude >= 33
        && latitude <= 39.5;
    });
    if (!feature) return NextResponse.json({ coordinates: null });

    const [longitude, latitude] = feature.geometry.coordinates;
    return NextResponse.json({ coordinates: { latitude, longitude } });
  } catch {
    return NextResponse.json({ coordinates: null }, { status: 502 });
  }
}