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
 * Download a data URL as a file
 */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}
