import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Badges",
  description: "Collection de badges et succes",
  openGraph: {
    title: "Badges | VeloCard",
    description: "Collection de badges et succes",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Badges | VeloCard",
    description: "Collection de badges et succes",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
