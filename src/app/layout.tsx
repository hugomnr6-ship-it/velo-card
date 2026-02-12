import type { Metadata } from "next";
import Providers from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "VeloCard - Ta carte de cycliste",
  description: "Génère ta carte de stats vélo depuis Strava",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-neutral-950 text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
