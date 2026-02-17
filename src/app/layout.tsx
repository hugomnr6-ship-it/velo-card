import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Providers from "@/components/Providers";
import "./globals.css";

import '@fontsource/space-grotesk/400.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';

export const metadata: Metadata = {
  title: {
    default: "VeloCard - Ta carte de cycliste",
    template: "%s | VeloCard",
  },
  description: "Ta carte de stats velo style FIFA — genere depuis Strava. Duels, classement, quetes.",
  manifest: "/manifest.json",
  themeColor: "#0B1120",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VeloCard",
  },
  openGraph: {
    title: "VeloCard - Ta carte de cycliste",
    description: "Ta carte de stats velo style FIFA — genere depuis Strava",
    type: "website",
    url: "https://velocard.app",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    siteName: "VeloCard",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "VeloCard - Ta carte de cycliste",
    description: "Ta carte de stats velo style FIFA — genere depuis Strava",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "https://velocard.app",
    languages: {
      fr: "https://velocard.app",
      en: "https://velocard.app/en",
    },
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-bg-primary font-['Inter'] text-text-primary antialiased">
        <a href="#main-content" className="skip-link">
          {locale === 'fr' ? 'Aller au contenu principal' : 'Skip to main content'}
        </a>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <div id="main-content">
              {children}
            </div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
