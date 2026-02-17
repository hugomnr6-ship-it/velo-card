import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tournois",
  description: "Competitions et tournois de cyclisme",
  openGraph: {
    title: "Tournois | VeloCard",
    description: "Competitions et tournois de cyclisme",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tournois | VeloCard",
    description: "Competitions et tournois de cyclisme",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
