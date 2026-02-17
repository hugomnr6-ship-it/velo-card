import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fantasy",
  description: "Fantasy cycling — cree ta ligue et gagne",
  openGraph: {
    title: "Fantasy | VeloCard",
    description: "Fantasy cycling — cree ta ligue et gagne",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fantasy | VeloCard",
    description: "Fantasy cycling — cree ta ligue et gagne",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
