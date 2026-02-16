import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
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
          background: "#0A0A0F",
          fontFamily: "sans-serif",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(99,102,241,0.15) 0%, transparent 60%)",
          }}
        />

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            color: "white",
            marginBottom: 16,
          }}
        >
          Velo
          <span style={{ color: "#6366F1" }}>Card</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 32,
            color: "#94A3B8",
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Ta carte FIFA cyclisme
        </div>

        {/* Demo cards row */}
        <div
          style={{
            display: "flex",
            gap: 24,
            marginTop: 48,
            alignItems: "flex-end",
          }}
        >
          {/* Bronze card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 160,
              height: 220,
              background: "linear-gradient(170deg, #1A1208, #241A0D)",
              borderRadius: 16,
              border: "1px solid rgba(232,168,84,0.3)",
              transform: "scale(0.9)",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: "#E8A854", letterSpacing: 2 }}>
              BRONZE
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: "#E8A854", marginTop: 8 }}>45</div>
            <div style={{ fontSize: 9, color: "rgba(232,168,84,0.5)", letterSpacing: 3 }}>OVR</div>
          </div>

          {/* Platine card (center, bigger) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 180,
              height: 250,
              background: "linear-gradient(170deg, #101820, #1A2838)",
              borderRadius: 16,
              border: "1px solid rgba(224,232,240,0.25)",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: "#E0E8F0", letterSpacing: 2 }}>
              PLATINE
            </div>
            <div style={{ fontSize: 56, fontWeight: 900, color: "#E0E8F0", marginTop: 8 }}>71</div>
            <div style={{ fontSize: 9, color: "rgba(224,232,240,0.5)", letterSpacing: 3 }}>OVR</div>
          </div>

          {/* Diamant card */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 160,
              height: 220,
              background: "linear-gradient(170deg, #051525, #0A2540)",
              borderRadius: 16,
              border: "1px solid rgba(0,212,255,0.3)",
              transform: "scale(0.9)",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: "#00D4FF", letterSpacing: 2 }}>
              DIAMANT
            </div>
            <div style={{ fontSize: 48, fontWeight: 900, color: "#00D4FF", marginTop: 8 }}>82</div>
            <div style={{ fontSize: 9, color: "rgba(0,212,255,0.5)", letterSpacing: 3 }}>OVR</div>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            marginTop: 40,
            fontSize: 20,
            color: "#475569",
          }}
        >
          6 stats · 5 tiers · Duels · Classements
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
