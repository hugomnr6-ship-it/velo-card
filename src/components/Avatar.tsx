import Image from "next/image";
import type { CSSProperties } from "react";

export function Avatar({
  src,
  alt,
  size = 40,
  className = "",
  style,
}: {
  src: string | null | undefined;
  alt: string;
  size?: number;
  className?: string;
  style?: CSSProperties;
}) {
  if (!src) {
    return (
      <div
        className={`rounded-full bg-[#22223A] ${className}`}
        style={{ width: size, height: size, ...style }}
        role="img"
        aria-label={alt}
      />
    );
  }

  const imgSrc = src.startsWith("/api/img")
    ? src
    : `/api/img?url=${encodeURIComponent(src)}`;

  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={style}
      loading="lazy"
    />
  );
}
