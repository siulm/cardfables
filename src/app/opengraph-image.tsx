import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "CardFables — Original Stories Inspired by Card Artwork";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
            alignItems: "center",
            justifyContent: "center",
            width: 120,
            height: 120,
            borderRadius: 24,
            background: "#D4893A",
            marginBottom: 32,
            fontSize: 64,
          }}
        >
          📖
        </div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "#3B2F1E",
            marginBottom: 16,
          }}
        >
          CardFables
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#7A6B5A",
            maxWidth: 700,
            textAlign: "center",
          }}
        >
          Original stories inspired by card artwork
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "8px 20px",
              borderRadius: 20,
              background: "#D4893A",
              color: "#FFF",
              fontSize: 20,
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
              fontSize: 20,
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
