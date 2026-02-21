import type { CardTier } from "@/types";

/* Story background colors matching each tier */
export const storyBgColors: Record<CardTier, string> = {
  bronze: "#0d0a04",
  argent: "#06080c",
  platine: "#060a0c",
  diamant: "#040a0d",
  legende: "#0d0b04",
};

export const tierAccentHex: Record<CardTier, string> = {
  bronze: "#cd7f32",
  argent: "#B8A0D8",
  platine: "#E0E8F0",
  diamant: "#B9F2FF",
  legende: "#FFD700",
};

/* Filter out holo overlay elements */
const holoFilter = (node: HTMLElement) =>
  !(node instanceof HTMLElement && node.dataset?.holo === "true");

/**
 * Capture the VeloCard element (#velo-card) as a PNG data URL
 */
export async function captureCard(): Promise<string> {
  const card = document.getElementById("velo-card");
  if (!card) throw new Error("Card element not found");

  const { toPng } = await import("html-to-image");

  try {
    return await toPng(card, {
      pixelRatio: 2.7,
      cacheBust: true,
      fetchRequestInit: { mode: "cors" },
      filter: holoFilter,
    });
  } catch {
    // Fallback without images if CORS fails
    return await toPng(card, {
      pixelRatio: 2.7,
      skipFonts: true,
      filter: (n) => !(n instanceof HTMLImageElement),
    });
  }
}

/**
 * Generate a QR code as data URL
 */
export async function generateQR(userId: string, tier: CardTier): Promise<string> {
  const QRCodeLib = (await import("qrcode")).default;
  return QRCodeLib.toDataURL(`https://velocard.app/card/${userId}`, {
    width: 120,
    margin: 1,
    color: { dark: tierAccentHex[tier], light: "#00000000" },
    errorCorrectionLevel: "M",
  });
}

/**
 * Draw a 1080x1920 story canvas with the card, QR, and branding
 */
export function drawStoryCanvas(
  cardDataUrl: string,
  tier: CardTier,
  qrDataUrl: string,
): Promise<string> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d")!;

    /* Background */
    ctx.fillStyle = storyBgColors[tier];
    ctx.fillRect(0, 0, 1080, 1920);

    /* Radial glow */
    const gradient = ctx.createRadialGradient(540, 800, 0, 540, 800, 700);
    const glowColors: Record<CardTier, string> = {
      bronze: "rgba(217,119,6,0.08)",
      argent: "rgba(148,163,184,0.08)",
      platine: "rgba(224,232,240,0.08)",
      diamant: "rgba(185,242,255,0.1)",
      legende: "rgba(250,204,21,0.1)",
    };
    gradient.addColorStop(0, glowColors[tier]);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    /* Card image */
    const img = new Image();
    img.onload = () => {
      const maxW = 920;
      const scale = Math.min(maxW / img.width, 1);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const x = (1080 - drawW) / 2;
      const y = (1920 - drawH) / 2 - 80;

      ctx.drawImage(img, x, y, drawW, drawH);

      /* QR code */
      const qrImg = new Image();
      qrImg.onload = () => {
        ctx.drawImage(qrImg, (1080 - 140) / 2, 1700, 140, 140);

        ctx.fillStyle = "rgba(255,255,255,0.30)";
        ctx.font = "600 22px system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Scanne pour voir ma carte", 540, 1685);

        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.font = "600 28px system-ui, sans-serif";
        ctx.fillText("velocard.app", 540, 1880);

        resolve(canvas.toDataURL("image/png"));
      };
      qrImg.src = qrDataUrl;
    };
    img.src = cardDataUrl;
  });
}

/**
 * Ajoute un watermark "VeloCard" semi-transparent en bas à droite de l'image.
 * Utilisé pour les users free uniquement.
 */
export function addWatermark(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;

      ctx.drawImage(img, 0, 0);

      // Watermark texte — bas droite, opacité 0.35
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#FFFFFF";
      const fontSize = Math.max(14, Math.round(img.width * 0.04));
      ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText("VeloCard", img.width - fontSize * 0.6, img.height - fontSize * 0.4);
      ctx.restore();

      resolve(canvas.toDataURL("image/png"));
    };
    img.src = dataUrl;
  });
}

/**
 * Share via Web Share API or fallback to download
 */
export async function shareOrDownload(dataUrl: string, filename = "velocard.png") {
  try {
    if (typeof navigator !== "undefined" && navigator.share) {
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], filename, { type: "image/png" });
      await navigator.share({ files: [file] });
      return;
    }
  } catch {
    // Fallback to download
  }
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

/**
 * Convert a data URL to a Blob without using fetch (iOS Safari compatible)
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(",");
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/**
 * Share a Blob to Instagram Story via the native share sheet.
 * Must be called directly from a user gesture (click) to work on iOS.
 */
export async function shareToInstagramStory(blob: Blob) {
  const file = new File([blob], "velocard-story.png", { type: "image/png" });

  if (navigator.share) {
    await navigator.share({ files: [file] });
    return;
  }

  // Fallback desktop: download
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = "velocard-story.png";
  link.href = url;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Download a data URL as a file
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
