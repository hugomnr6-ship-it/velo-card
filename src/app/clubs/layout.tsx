import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clubs",
  description: "Rejoins un club et participe aux guerres",
  openGraph: {
    title: "Clubs | VeloCard",
    description: "Rejoins un club et participe aux guerres",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clubs | VeloCard",
    description: "Rejoins un club et participe aux guerres",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
