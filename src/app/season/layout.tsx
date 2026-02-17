import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saison",
  description: "Classement saisonnier et recompenses",
  openGraph: {
    title: "Saison | VeloCard",
    description: "Classement saisonnier et recompenses",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Saison | VeloCard",
    description: "Classement saisonnier et recompenses",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
