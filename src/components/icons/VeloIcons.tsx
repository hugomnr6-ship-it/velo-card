"use client";

/* ════════════════════════════════════════════
   VeloCard — Custom SVG Icon Library
   Premium icons, no iPhone emojis.
   ════════════════════════════════════════════ */

import type { CSSProperties, ReactElement } from "react";

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
  style?: CSSProperties;
}

const d = { size: 16, color: "currentColor" };

/* ═══ STAT CATEGORY ICONS ═══ */

export function IconStar({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} style={style}>
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

export function IconLightning({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} style={style}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export function IconMountain({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M8 3l4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

export function IconTarget({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" className={className} style={style}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" fill={color} />
    </svg>
  );
}

export function IconWind({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  );
}

export function IconMuscle({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} style={style}>
      <path d="M3 18.5V13a2 2 0 0 1 2-2h.5a1.5 1.5 0 0 1 1.5 1.5v1a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2.5A3.5 3.5 0 0 1 13.5 7H14a3 3 0 0 1 3 3v1h1a2 2 0 0 1 2 2v5.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}

export function IconFire({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} style={style}>
      <path d="M12 2c.5 4-3.5 6-3.5 10a5.5 5.5 0 0 0 11 0c0-4.5-3-6.5-4.5-8.5C14 5 13 7 12 2zm0 14a2 2 0 0 1-2-2c0-1.5 2-2.5 2-4 0 1.5 2 2.5 2 4a2 2 0 0 1-2 2z" />
    </svg>
  );
}

/* ═══ ACTIVITY ICONS ═══ */

export function IconCycling({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" fill={color} />
      <path d="M12 17.5V14l-3.5 3.5" />
      <path d="M12 14l4-5-2.5-1" />
      <path d="M5.5 17.5l6-9" />
    </svg>
  );
}

export function IconRoad({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M4 19L8 5" />
      <path d="M16 5l4 14" />
      <path d="M12 7v2" />
      <path d="M12 13v2" />
      <path d="M12 19v2" />
    </svg>
  );
}

export function IconCalendar({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
    </svg>
  );
}

export function IconTimer({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 2.5" />
      <path d="M10 2h4" />
    </svg>
  );
}

/* ═══ COMPETITIVE ICONS ═══ */

export function IconTrophy({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} style={style}>
      <path d="M6 9H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m12 5h3a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3M6 4h12v7a6 6 0 0 1-12 0V4z" fill="none" stroke={color} strokeWidth="2" />
      <path d="M9 21h6M12 17v4" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function IconSwords({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M9.5 17.5L21 6V3h-3L6.5 14.5" />
      <path d="M11 19l-6-6" />
      <path d="M8 16l-4 4" />
    </svg>
  );
}

export function IconShield({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export function IconFlag({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22v-7" />
    </svg>
  );
}

/* ═══ MEDALS ═══ */

export function IconMedalGold({ size = d.size, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
      <circle cx="12" cy="15" r="6" fill="#FFD700" />
      <path d="M8 2l4 8 4-8" fill="none" stroke="#FFD700" strokeWidth="2" />
      <text x="12" y="18" textAnchor="middle" fill="#1A0E02" fontSize="8" fontWeight="800" fontFamily="JetBrains Mono">1</text>
    </svg>
  );
}

export function IconMedalSilver({ size = d.size, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
      <circle cx="12" cy="15" r="6" fill="#C0C8D4" />
      <path d="M8 2l4 8 4-8" fill="none" stroke="#C0C8D4" strokeWidth="2" />
      <text x="12" y="18" textAnchor="middle" fill="#10121E" fontSize="8" fontWeight="800" fontFamily="JetBrains Mono">2</text>
    </svg>
  );
}

export function IconMedalBronze({ size = d.size, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
      <circle cx="12" cy="15" r="6" fill="#CD7F32" />
      <path d="M8 2l4 8 4-8" fill="none" stroke="#CD7F32" strokeWidth="2" />
      <text x="12" y="18" textAnchor="middle" fill="#1A1208" fontSize="8" fontWeight="800" fontFamily="JetBrains Mono">3</text>
    </svg>
  );
}

/* ═══ TIER ICONS ═══ */

export function IconDiamond({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} style={style}>
      <path d="M6 3h12l4 7-10 12L2 10l4-7z" />
      <path d="M2 10h20" stroke="rgba(255,255,255,0.2)" strokeWidth="1" fill="none" />
    </svg>
  );
}

export function IconCrown({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} style={style}>
      <path d="M2 20h20L19 8l-4 5-3-7-3 7L5 8l-3 12z" />
      <rect x="2" y="18" width="20" height="3" rx="1" fill={color} />
    </svg>
  );
}

/* ═══ UI ICONS ═══ */

export function IconChartUp({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M3 20l5-5 4 4 9-12" />
      <path d="M17 7h4v4" />
    </svg>
  );
}

export function IconChartDown({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M3 4l5 5 4-4 9 12" />
      <path d="M17 17h4v-4" />
    </svg>
  );
}

export function IconArrowUp({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  );
}

export function IconArrowDown({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M12 5v14" />
      <path d="M19 12l-7 7-7-7" />
    </svg>
  );
}

export function IconCheck({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function IconX({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export function IconInfo({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <circle cx="12" cy="8" r="0.5" fill={color} />
    </svg>
  );
}

export function IconCelebration({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" className={className} style={style}>
      <path d="M3 21l5-16 5 5-3 8" fill={color} opacity="0.2" />
      <path d="M3 21l5-16 5 5-3 8z" />
      <path d="M14 8l2-2" />
      <path d="M18 4l1.5 1.5" />
      <path d="M20 10l2 0" />
      <path d="M16 14l0 2" />
    </svg>
  );
}

/* ═══ BADGE-SPECIFIC ICONS ═══ */

export function IconRocket({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

export function IconBolt({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className} style={style}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export function IconGoat({ size = d.size, color = d.color, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className} style={style}>
      <path d="M4 10c0-4 3-8 8-8s8 4 8 8" />
      <path d="M4 10c-1-3 0-6 2-7" />
      <path d="M20 10c1-3 0-6-2-7" />
      <circle cx="9" cy="12" r="1" fill={color} />
      <circle cx="15" cy="12" r="1" fill={color} />
      <path d="M10 16c1 1 3 1 4 0" />
      <path d="M6 20c2-2 4-3 6-3s4 1 6 3" />
    </svg>
  );
}

/* ═══ CATEGORY ICON MAPPING ═══ */

export const STAT_ICONS: Record<string, (props: IconProps) => ReactElement> = {
  ovr: IconStar,
  pac: IconLightning,
  mon: IconMountain,
  val: IconTarget,
  spr: IconWind,
  end: IconMuscle,
  res: IconFire,
  progression: IconChartUp,
  weekly_km: IconCycling,
  weekly_dplus: IconMountain,
  weekly_rides: IconCalendar,
};

export const BADGE_ICONS: Record<string, (props: IconProps) => ReactElement> = {
  complet: IconTrophy,
  chevre: IconGoat,
  aero: IconRocket,
  diesel: IconFire,
  flandrien: IconShield,
  grimpeur: IconMountain,
  puncheur: IconLightning,
  explosif: IconBolt,
  technicien: IconTarget,
};

export const SPECIAL_ICONS: Record<string, (props: IconProps) => ReactElement> = {
  totw: IconStar,
  in_form: IconFire,
  legend_moment: IconTrophy,
};

export const TIER_ICONS: Record<string, (props: IconProps) => ReactElement> = {
  bronze: IconMedalBronze,
  argent: IconMedalSilver,
  platine: IconDiamond,
  diamant: IconDiamond,
  legende: IconCrown,
};
