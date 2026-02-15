"use client";

import Link from "next/link";

interface FeedEvent {
  id: string;
  user_id: string;
  event_type: string;
  metadata: Record<string, any>;
  created_at: string;
  profiles?: { username: string; avatar_url: string | null };
}

const eventConfig: Record<string, { icon: string; color: string; label: (meta: any, username: string) => string }> = {
  tier_up: {
    icon: "\u2B06",
    color: "#00F5D4",
    label: (meta, username) =>
      `${username} est passe ${meta.previousTier} → ${meta.newTier}`,
  },
  totw_selected: {
    icon: "\u2B50",
    color: "#FFD700",
    label: (meta, username) =>
      `${username} est dans l'Echappee (${meta.category})`,
  },
  streak_milestone: {
    icon: "\uD83D\uDD25",
    color: "#FF6B35",
    label: (meta, username) =>
      `${username} : ${meta.weeks} semaines d'affilee !`,
  },
  badge_earned: {
    icon: "\uD83C\uDFC5",
    color: "#A78BFA",
    label: (meta, username) =>
      `${username} a debloque "${meta.badgeName}"`,
  },
  duel_won: {
    icon: "\u2694\uFE0F",
    color: "#6366F1",
    label: (meta, username) =>
      `${username} a gagne un duel (${meta.category})`,
  },
  race_result: {
    icon: "\uD83C\uDFC1",
    color: "#00D4FF",
    label: (meta, username) =>
      `${username} a termine ${meta.position}e dans une course`,
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "a l'instant";
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return `il y a ${Math.floor(days / 7)}sem`;
}

export default function FeedItem({ event }: { event: FeedEvent }) {
  const config = eventConfig[event.event_type];
  if (!config) return null;

  const username = event.profiles?.username || "Cycliste";
  const avatarUrl = event.profiles?.avatar_url;

  return (
    <div className="flex items-start gap-3 px-1 py-2">
      {/* Avatar */}
      <Link href={`/profile/${event.user_id}`} className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={`/api/img?url=${encodeURIComponent(avatarUrl)}`}
            alt=""
            className="h-8 w-8 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-white/50">
            {username.charAt(0).toUpperCase()}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-relaxed text-white/60">
          <span className="mr-1.5" style={{ color: config.color }}>
            {config.icon}
          </span>
          {config.label(event.metadata, username)}
        </p>
        <p className="mt-0.5 text-[10px] text-white/25">
          {timeAgo(event.created_at)}
        </p>
      </div>
    </div>
  );
}
