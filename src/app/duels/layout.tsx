import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Duels 1v1",
  description: "Defie d'autres cyclistes en 1v1 et mise tes ego points",
  openGraph: {
    title: "Duels 1v1 | VeloCard",
    description: "Defie d'autres cyclistes en 1v1 et mise tes ego points",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Duels 1v1 | VeloCard",
    description: "Defie d'autres cyclistes en 1v1 et mise tes ego points",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
