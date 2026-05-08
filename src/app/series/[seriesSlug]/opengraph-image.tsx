import { ImageResponse } from "next/og";
import { getSeriesBySlug, SERIES } from "@/lib/data";

export const runtime = "edge";
export const alt = "CardFables Series";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return SERIES.map((s) => ({ seriesSlug: s.id }));
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ seriesSlug: string }>;
}) {
  const { seriesSlug } = await params;
  const series = getSeriesBySlug(seriesSlug);
  const title = series?.title ?? "Series";
  const genre = series?.genre ?? "";
  const color = series?.color ?? "#D4893A";
  const episodeCount = series?.episodes?.length ?? 0;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #F5F0E6 0%, #EDE4D3 50%, #E8D9C0 100%)",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            padding: "6px 24px",
            borderRadius: 20,
            background: color,
            color: "#FFF",
            fontSize: 22,
            marginBottom: 24,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          {genre}
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 900,
            color: "#3B2F1E",
            marginBottom: 16,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 26,
            color: "#7A6B5A",
            marginBottom: 32,
          }}
        >
          {episodeCount} {episodeCount === 1 ? "episode" : "episodes"} on CardFables
        </div>
        <div
          style={{
            display: "flex",
            width: 600,
            height: 4,
            background: color,
            borderRadius: 2,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
