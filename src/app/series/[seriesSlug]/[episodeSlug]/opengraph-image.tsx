import { ImageResponse } from "next/og";
import { getEpisodeBySlugs, getAllEpisodePaths } from "@/lib/data";

export const runtime = "edge";
export const alt = "CardFables Episode";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllEpisodePaths().map(({ seriesSlug, episodeSlug }) => ({
    seriesSlug,
    episodeSlug,
  }));
}

export default async function OGImage({
  params,
}: {
  params: Promise<{ seriesSlug: string; episodeSlug: string }>;
}) {
  const { seriesSlug, episodeSlug } = await params;
  const result = getEpisodeBySlugs(seriesSlug, episodeSlug);
  const episodeTitle = result?.episode.title ?? "Episode";
  const seriesTitle = result?.series.title ?? "Series";
  const episodeNum = result?.episode.id ?? 0;
  const cardNames = result?.episode.cards.map((c) => c.name).join(", ") ?? "";
  const color = result?.series.color ?? "#D4893A";

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
            fontSize: 20,
            marginBottom: 20,
          }}
        >
          {seriesTitle} — Episode {episodeNum}
        </div>
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: "#3B2F1E",
            marginBottom: 20,
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.2,
          }}
        >
          {episodeTitle}
        </div>
        {cardNames && (
          <div
            style={{
              display: "flex",
              fontSize: 24,
              color: "#7A6B5A",
              marginBottom: 32,
            }}
          >
            Featuring: {cardNames}
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "8px 20px",
              borderRadius: 20,
              background: "#D4893A",
              color: "#FFF",
              fontSize: 18,
            }}
          >
            🐣 Junior Fables
          </div>
          <div
            style={{
              display: "flex",
              padding: "8px 20px",
              borderRadius: 20,
              background: "#8B5E3C",
              color: "#FFF",
              fontSize: 18,
            }}
          >
            🔥 Full Fables
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
