import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Classement",
  description: "Classement regional et national des cyclistes",
  openGraph: {
    title: "Classement | VeloCard",
    description: "Classement regional et national des cyclistes",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Classement | VeloCard",
    description: "Classement regional et national des cyclistes",
    images: ["/og-image.png"],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
