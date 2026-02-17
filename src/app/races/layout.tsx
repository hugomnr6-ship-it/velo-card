import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses",
  description: "Calendrier des courses et resultats",
  openGraph: {
    title: "Courses | VeloCard",
    description: "Calendrier des courses et resultats",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Courses | VeloCard",
    description: "Calendrier des courses et resultats",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
