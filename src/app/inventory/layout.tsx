import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventaire",
  description: "Tes skins et items",
  openGraph: {
    title: "Inventaire | VeloCard",
    description: "Tes skins et items",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inventaire | VeloCard",
    description: "Tes skins et items",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
