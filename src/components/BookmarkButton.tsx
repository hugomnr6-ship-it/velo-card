"use client";

import { m } from "framer-motion";
import { useFavorites } from "@/hooks/useFavorites";

interface BookmarkButtonProps {
  entityType: "race" | "route" | "profile";
  entityId: string;
  size?: "sm" | "md";
}

/**
 * Bouton favori réutilisable (coeur toggle).
 * Utilise optimistic updates via useFavorites.
 */
export default function BookmarkButton({
  entityType,
  entityId,
  size = "md",
}: BookmarkButtonProps) {
  const { isFavorited, getFavoriteId, addFavorite, removeFavorite } = useFavorites(entityType);
  const favorited = isFavorited(entityId);
  const favoriteId = getFavoriteId(entityId);

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (favorited && favoriteId) {
      removeFavorite.mutate(favoriteId);
    } else {
      addFavorite.mutate({ entityType, entityId });
    }
  }

  const sizeClass = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconSize = size === "sm" ? 14 : 18;

  return (
    <m.button
      onClick={handleToggle}
      whileTap={{ scale: 0.85 }}
      className={`${sizeClass} flex items-center justify-center rounded-full transition-colors ${
        favorited
          ? "bg-red-500/15 text-red-400"
          : "bg-white/[0.04] text-[#475569] hover:text-[#94A3B8]"
      }`}
      aria-label={favorited ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill={favorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </m.button>
  );
}
