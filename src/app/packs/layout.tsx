import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Packs",
  description: "Ouvre des packs et decouvre tes items",
  openGraph: {
    title: "Packs | VeloCard",
    description: "Ouvre des packs et decouvre tes items",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Packs | VeloCard",
    description: "Ouvre des packs et decouvre tes items",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
