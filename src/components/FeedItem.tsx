"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface FeedEvent {
  id: string;
  user_id: string;
  event_type: string;
  metadata: Record<string, any>;
  created_at: string;
  profiles?: { username: string; avatar_url: string | null };
  like_count?: number;
  comment_count?: number;
  user_liked?: boolean;
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
  quest_completed: {
    icon: "\uD83C\uDFAF",
    color: "#00F5D4",
    label: (meta, username) =>
      `${username} a complete la quete "${meta.questTitle}"`,
  },
  pack_opened: {
    icon: "\uD83D\uDCE6",
    color: "#A78BFA",
    label: (meta, username) =>
      `${username} a ouvert un pack et obtenu ${meta.bestItemName} (${meta.bestItemRarity})`,
  },
  duel_domination: {
    icon: "\uD83D\uDCA5",
    color: "#FF6B35",
    label: (meta, username) =>
      `${username} a domine son adversaire en duel !`,
  },
  war_won: {
    icon: "\uD83C\uDFF0",
    color: "#FFD700",
    label: (meta, username) =>
      `Le club de ${username} a gagne la guerre !`,
  },
  war_lost: {
    icon: "\uD83D\uDEE1\uFE0F",
    color: "#64748B",
    label: (meta, username) =>
      `Le club de ${username} a perdu la guerre`,
  },
  tournament_won: {
    icon: "\uD83C\uDFC6",
    color: "#FFD700",
    label: (meta, username) =>
      `${username} a remporte le tournoi !`,
  },
  season_reward: {
    icon: "\uD83C\uDFC5",
    color: "#6366F1",
    label: (meta, username) =>
      `${username} a termine #${meta.rank} de la saison`,
  },
  fantasy_league_created: {
    icon: "\u26BD",
    color: "#6366F1",
    label: (meta, username) =>
      `${username} a cree la ligue Fantasy "${meta.leagueName}"`,
  },
  fantasy_league_won: {
    icon: "\uD83C\uDFC6",
    color: "#FFD700",
    label: (meta, username) =>
      `${username} a remporte une ligue Fantasy !`,
  },
  fantasy_transfer: {
    icon: "\uD83D\uDD04",
    color: "#A78BFA",
    label: (meta, username) =>
      `${username} a recrute ${meta.cyclistName} en Fantasy`,
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

function HeartIcon({ filled, size = 14 }: { filled: boolean; size?: number }) {
  return filled ? (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FF6B6B" stroke="#FF6B6B" strokeWidth="2">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  ) : (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
  );
}

function CommentIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
    </svg>
  );
}

export default memo(function FeedItem({ event }: { event: FeedEvent }) {
  const config = eventConfig[event.event_type];
  if (!config) return null;

  const username = event.profiles?.username || "Cycliste";
  const avatarUrl = event.profiles?.avatar_url;
  const [liked, setLiked] = useState(event.user_liked ?? false);
  const [likeCount, setLikeCount] = useState(event.like_count ?? 0);
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/feed/${event.id}/like`, { method: 'POST' });
      return res.json();
    },
    onMutate: () => {
      setLiked(!liked);
      setLikeCount(liked ? likeCount - 1 : likeCount + 1);
    },
    onError: () => {
      setLiked(liked);
      setLikeCount(likeCount);
    },
  });

  return (
    <div className="flex items-start gap-3 px-1 py-2">
      {/* Avatar */}
      <Link href={`/profile/${event.user_id}`} className="flex-shrink-0">
        {avatarUrl ? (
          <img
            src={`/api/img?url=${encodeURIComponent(avatarUrl)}`}
            alt={`Photo de profil de ${username}`}
            className="h-8 w-8 rounded-full border border-white/10 object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-white/50" aria-label={username}>
            {username.charAt(0).toUpperCase()}
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-xs leading-relaxed text-white/60">
          <span className="mr-1.5" style={{ color: config.color }} aria-hidden="true">
            {config.icon}
          </span>
          {config.label(event.metadata, username)}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <p className="text-[10px] text-white/25">
            {timeAgo(event.created_at)}
          </p>
          <button
            onClick={() => likeMutation.mutate()}
            className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition-colors"
            aria-label={liked ? 'Retirer le like' : 'Liker'}
          >
            <HeartIcon filled={liked} size={12} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <span className="flex items-center gap-1 text-[10px] text-white/25">
            <CommentIcon size={12} />
            {(event.comment_count ?? 0) > 0 && <span>{event.comment_count}</span>}
          </span>
        </div>
      </div>
    </div>
  );
});
