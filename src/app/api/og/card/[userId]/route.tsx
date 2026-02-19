import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { validate as isUuid } from "uuid";

export const runtime = "edge";

const tierColors: Record<string, string> = {
  bronze: "#CD7F32",
  argent: "#C0C8D4",
  platine: "#E5E4E2",
  diamant: "#00D4FF",
  legende: "#FFD700",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  if (!isUuid(userId)) {
    return new Response("Invalid userId", { status: 400 });
  }

  // Fetch user data
  const [{ data: profile }, { data: stats }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", userId)
      .single(),
    supabaseAdmin
      .from("user_stats")
      .select("ovr, tier, pac, end, mon, spr, res, val")
      .eq("user_id", userId)
      .single(),
  ]);

  if (!profile || !stats) {
    return new Response("User not found", { status: 404 });
  }

  const accentColor = tierColors[stats.tier] || "#00F5D4";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0B1120 0%, #111827 50%, #0B1120 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 460,
            height: 540,
            borderRadius: 24,
            border: `2px solid ${accentColor}40`,
            background: "linear-gradient(180deg, #111827 0%, #0B1120 100%)",
            boxShadow: `0 0 60px ${accentColor}20`,
            padding: 40,
          }}
        >
          {/* Username */}
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#F8FAFC",
              marginBottom: 16,
            }}
          >
            {profile.username}
          </div>

          {/* OVR */}
          <div
            style={{
              fontSize: 80,
              fontWeight: 900,
              color: accentColor,
              lineHeight: 1,
            }}
          >
            {stats.ovr}
          </div>

          {/* Tier */}
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: accentColor,
              letterSpacing: 4,
              textTransform: "uppercase",
              marginTop: 8,
            }}
          >
            {stats.tier}
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: 24,
              marginTop: 32,
            }}
          >
            {[
              { label: "PAC", value: stats.pac },
              { label: "END", value: stats.end },
              { label: "MON", value: stats.mon },
              { label: "SPR", value: stats.spr },
              { label: "RES", value: stats.res },
              { label: "VAL", value: stats.val },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#94A3B8",
                    letterSpacing: 2,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: "#F8FAFC",
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: 30,
            right: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#00F5D4",
            }}
          >
            VeloCard
          </div>
          <div
            style={{
              fontSize: 14,
              color: "#94A3B8",
            }}
          >
            velocard.app
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
