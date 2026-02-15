"use client";

import { toPng } from "html-to-image";
import QRCodeLib from "qrcode";
import type { CardTier } from "@/types";

/* Story background colors matching each tier */
const storyBgColors: Record<CardTier, string> = {
  bronze: "#0d0a04",
  argent: "#06080c",
  platine: "#060a0c",
  diamant: "#040a0d",
  legende: "#0d0b04",
};

const tierAccentHex: Record<CardTier, string> = {
  bronze: "#cd7f32",
  argent: "#B8A0D8",
  platine: "#E0E8F0",
  diamant: "#B9F2FF",
  legende: "#FFD700",
};

interface DownloadButtonProps {
  tier: CardTier;
  userId: string;
}

export default function DownloadButton({ tier, userId }: DownloadButtonProps) {
  async function handleDownload() {
    const card = document.getElementById("velo-card");
    if (!card) return;

    try {
      /* 1. First capture just the card as a PNG data URL */
      /* Filter out holographic overlay elements (data-holo="true") */
      const holoFilter = (node: HTMLElement) =>
        !(node instanceof HTMLElement && node.dataset?.holo === "true");

      const [cardDataUrl, qrDataUrl] = await Promise.all([
        toPng(card, {
          pixelRatio: 2.7,
          cacheBust: true,
          fetchRequestInit: { mode: "cors" },
          filter: holoFilter,
        }),
        QRCodeLib.toDataURL(`https://velocard.app/card/${userId}`, {
          width: 120,
          margin: 1,
          color: { dark: tierAccentHex[tier], light: "#00000000" },
          errorCorrectionLevel: "M",
        }),
      ]);

      /* 2. Draw it onto a 1080x1920 canvas */
      const storyDataUrl = await drawStoryCanvas(cardDataUrl, tier, qrDataUrl);
      await shareOrDownload(storyDataUrl);
    } catch (err) {
      console.error("Export error:", err);
      /* Fallback: retry without images if CORS fails */
      try {
        const [cardDataUrl, qrDataUrl] = await Promise.all([
          toPng(card, {
            pixelRatio: 2.7,
            skipFonts: true,
            filter: (n) => !(n instanceof HTMLImageElement),
          }),
          QRCodeLib.toDataURL(`https://velocard.app/card/${userId}`, {
            width: 120,
            margin: 1,
            color: { dark: tierAccentHex[tier], light: "#00000000" },
            errorCorrectionLevel: "M",
          }),
        ]);
        const storyDataUrl = await drawStoryCanvas(cardDataUrl, tier, qrDataUrl);
        await shareOrDownload(storyDataUrl);
      } catch (err2) {
        console.error("Fallback export also failed:", err2);
      }
    }
  }

  function drawStoryCanvas(
    cardDataUrl: string,
    tier: CardTier,
    qrDataUrl: string,
  ): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d")!;

      /* Background gradient */
      const bgColor = storyBgColors[tier];
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, 1080, 1920);

      /* Radial glow in center */
      const gradient = ctx.createRadialGradient(540, 800, 0, 540, 800, 700);
      if (tier === "bronze") {
        gradient.addColorStop(0, "rgba(217,119,6,0.08)");
      } else if (tier === "argent") {
        gradient.addColorStop(0, "rgba(148,163,184,0.08)");
      } else if (tier === "platine") {
        gradient.addColorStop(0, "rgba(224,232,240,0.08)");
      } else if (tier === "diamant") {
        gradient.addColorStop(0, "rgba(185,242,255,0.1)");
      } else {
        gradient.addColorStop(0, "rgba(250,204,21,0.1)");
      }
      gradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1080, 1920);

      /* Draw card image centered */
      const img = new Image();
      img.onload = () => {
        const cardW = img.width;
        const cardH = img.height;

        /* Scale card to fit nicely in story (max ~900px wide) */
        const maxW = 920;
        const scale = Math.min(maxW / cardW, 1);
        const drawW = cardW * scale;
        const drawH = cardH * scale;
        const x = (1080 - drawW) / 2;
        const y = (1920 - drawH) / 2 - 80;

        ctx.drawImage(img, x, y, drawW, drawH);

        /* QR code at bottom */
        const qrImg = new Image();
        qrImg.onload = () => {
          const qrSize = 140;
          ctx.drawImage(qrImg, (1080 - qrSize) / 2, 1700, qrSize, qrSize);

          /* CTA text above QR */
          ctx.fillStyle = "rgba(255,255,255,0.30)";
          ctx.font = "600 22px system-ui, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText("Scanne pour voir ma carte", 540, 1685);

          /* Watermark */
          ctx.fillStyle = "rgba(255,255,255,0.12)";
          ctx.font = "600 28px system-ui, sans-serif";
          ctx.letterSpacing = "4px";
          ctx.fillText("velocard.app", 540, 1880);

          resolve(canvas.toDataURL("image/png"));
        };
        qrImg.src = qrDataUrl;
      };
      img.src = cardDataUrl;
    });
  }

  async function shareOrDownload(dataUrl: string) {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "velocard-story.png", { type: "image/png" });
        await navigator.share({ files: [file] });
        return;
      }
    } catch {
      // Fallback to download
    }
    const link = document.createElement("a");
    link.download = "velocard-story.png";
    link.href = dataUrl;
    link.click();
  }

  return (
    <button
      onClick={handleDownload}
      className="mt-6 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90"
    >
      Partager pour Instagram
    </button>
  );
}
