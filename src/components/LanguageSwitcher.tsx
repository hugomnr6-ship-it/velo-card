'use client';

import { useTransition } from 'react';
import { locales, localeNames, type Locale } from '@/i18n/config';

export default function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const [isPending, startTransition] = useTransition();

  function switchLocale(locale: Locale) {
    startTransition(() => {
      document.cookie = `locale=${locale};path=/;max-age=31536000`;
      window.location.reload();
    });
  }

  return (
    <div className="flex gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          disabled={isPending || locale === currentLocale}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            locale === currentLocale
              ? 'bg-accent text-bg-primary'
              : 'bg-bg-elevated text-text-secondary hover:text-text-primary'
          }`}
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  );
}
