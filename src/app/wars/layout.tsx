import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Guerres de Clubs",
  description: "Competitions hebdomadaires entre clubs",
  openGraph: {
    title: "Guerres de Clubs | VeloCard",
    description: "Competitions hebdomadaires entre clubs",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Guerres de Clubs | VeloCard",
    description: "Competitions hebdomadaires entre clubs",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
