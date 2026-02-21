import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boutique",
  description: "Achète des skins pour personnaliser ta VeloCard",
  openGraph: {
    title: "Boutique | VeloCard",
    description: "Achète des skins pour personnaliser ta VeloCard",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Boutique | VeloCard",
    description: "Achète des skins pour personnaliser ta VeloCard",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
