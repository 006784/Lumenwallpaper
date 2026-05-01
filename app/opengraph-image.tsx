import { ImageResponse } from "next/og";

export const alt = "Lumen";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#f4f0e8",
          color: "#070704",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          padding: 56,
          width: "100%",
        }}
      >
        <div
          style={{
            background: "#070704",
            borderRadius: 32,
            color: "#f4f0e8",
            display: "flex",
            flexDirection: "column",
            height: "100%",
            justifyContent: "space-between",
            overflow: "hidden",
            padding: 56,
            position: "relative",
            width: "100%",
          }}
        >
          <div
            style={{
              background: "#e33b36",
              height: 22,
              left: 56,
              position: "absolute",
              right: 56,
              top: 56,
            }}
          />
          <div
            style={{
              alignItems: "center",
              display: "flex",
              gap: 28,
              marginTop: 54,
            }}
          >
            <div
              style={{
                alignItems: "center",
                background: "#f4f0e8",
                borderRadius: 24,
                color: "#070704",
                display: "flex",
                fontSize: 68,
                fontWeight: 800,
                height: 118,
                justifyContent: "center",
                width: 118,
              }}
            >
              L
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 92, fontWeight: 800, lineHeight: 0.9 }}>
                Lumen
              </div>
              <div
                style={{
                  color: "rgba(244,240,232,0.76)",
                  fontSize: 28,
                  letterSpacing: 8,
                  textTransform: "uppercase",
                }}
              >
                Wallpaper Archive
              </div>
            </div>
          </div>
          <div
            style={{
              color: "rgba(244,240,232,0.82)",
              display: "flex",
              fontSize: 42,
              lineHeight: 1.18,
              maxWidth: 880,
            }}
          >
            Film-inspired wallpapers curated for desktop, mobile, and motion
            screens.
          </div>
          <div
            style={{
              alignItems: "center",
              color: "#e33b36",
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              gap: 14,
              letterSpacing: 5,
              textTransform: "uppercase",
            }}
          >
            <span>Explore</span>
            <span>Download</span>
            <span>Curate</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
