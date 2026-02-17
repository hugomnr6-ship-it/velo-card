import type { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: "VeloCard — Ta carte FIFA cyclisme",
  description:
    "Transforme tes sorties velo en carte FIFA avec 6 stats. Parcours, meteo, classements, duels. L'app gratuite pour les cyclistes amateurs.",
  openGraph: {
    title: "VeloCard — Ta carte FIFA cyclisme",
    description:
      "6 stats, 5 tiers, des duels, des classements. Connecte ton Strava et decouvre ta carte.",
    images: ["/api/og"],
    url: "https://velocard.app",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VeloCard — Ta carte FIFA cyclisme",
    description: "Transforme tes sorties velo en carte FIFA.",
    images: ["/api/og"],
  },
  alternates: {
    canonical: "https://velocard.app",
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'VeloCard',
  description: 'Le FIFA Ultimate Team du cyclisme réel',
  url: 'https://velocard.app',
  applicationCategory: 'SportsApplication',
  operatingSystem: 'Web',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingClient />
    </>
  );
}
