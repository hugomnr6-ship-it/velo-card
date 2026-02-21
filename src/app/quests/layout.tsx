import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quêtes",
  description: "Micro-objectifs quotidiens et hebdomadaires",
  openGraph: {
    title: "Quêtes | VeloCard",
    description: "Micro-objectifs quotidiens et hebdomadaires",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Quêtes | VeloCard",
    description: "Micro-objectifs quotidiens et hebdomadaires",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
