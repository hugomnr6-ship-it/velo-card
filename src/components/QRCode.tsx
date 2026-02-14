"use client";

import { useEffect, useRef, useState } from "react";
import QRCodeLib from "qrcode";

interface QRCodeProps {
  url: string;
  size?: number;
  color?: string;
  bgColor?: string;
  /** Use <img> with data URL instead of <canvas> — needed for html-to-image */
  asImage?: boolean;
}

export default function QRCode({
  url,
  size = 120,
  color = "#ffffff",
  bgColor = "transparent",
  asImage = false,
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    const opts = {
      width: size,
      margin: 1,
      color: { dark: color, light: bgColor },
      errorCorrectionLevel: "M" as const,
    };

    if (asImage) {
      QRCodeLib.toDataURL(url, opts).then(setDataUrl);
    } else if (canvasRef.current) {
      QRCodeLib.toCanvas(canvasRef.current, url, opts);
    }
  }, [url, size, color, bgColor, asImage]);

  if (asImage) {
    if (!dataUrl) return <div style={{ width: size, height: size }} />;
    return (
      <img
        src={dataUrl}
        alt="QR Code"
        width={size}
        height={size}
        className="rounded-lg"
      />
    );
  }

  return <canvas ref={canvasRef} className="rounded-lg" />;
}
