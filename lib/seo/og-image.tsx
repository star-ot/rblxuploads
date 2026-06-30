import { ImageResponse } from "next/og";

export const ogImageSize = {
  width: 1200,
  height: 630,
};

export const ogImageContentType = "image/png";

interface OgImageOptions {
  badge: string;
  title: string;
  subtitle: string;
  footer?: string;
}

export function createOgImage({ badge, title, subtitle, footer }: OgImageOptions) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#09090b",
          backgroundImage:
            "linear-gradient(#1f1f23 1px, transparent 1px), linear-gradient(90deg, #1f1f23 1px, transparent 1px), radial-gradient(circle at 85% 15%, rgba(59,130,246,0.14) 0%, transparent 45%)",
          backgroundSize: "48px 48px, 48px 48px, 100% 100%",
          color: "#fafafa",
          fontFamily:
            'system-ui, "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif',
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "rgba(59, 130, 246, 0.14)",
              border: "1px solid rgba(59, 130, 246, 0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="5" rx="1" fill="#3b82f6" opacity="0.95" />
              <rect x="8" y="1" width="5" height="5" rx="1" fill="#3b82f6" opacity="0.55" />
              <rect x="1" y="8" width="5" height="5" rx="1" fill="#3b82f6" opacity="0.55" />
              <rect x="8" y="8" width="5" height="5" rx="1" fill="#3b82f6" opacity="0.3" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              color: "#fafafa",
            }}
          >
            {badge}
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 920 }}>
          <div
            style={{
              fontSize: 58,
              fontWeight: 600,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              color: "#fafafa",
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 28,
              lineHeight: 1.35,
              color: "#a1a1aa",
              maxWidth: 820,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #27272a",
            paddingTop: 24,
          }}
        >
          <span style={{ fontSize: 20, color: "#71717a" }}>{footer ?? "uploader.starvsk.dev"}</span>
          <div style={{ display: "flex", gap: 10 }}>
            {["Image", "Audio", "Model", "Mesh"].map((type) => (
              <span
                key={type}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "#a1a1aa",
                  background: "#141417",
                  border: "1px solid #27272a",
                  borderRadius: 6,
                  padding: "6px 12px",
                }}
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    {
      ...ogImageSize,
    },
  );
}
