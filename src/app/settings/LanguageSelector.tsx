"use client";

import { useTransition } from "react";

const LANGUAGES = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
];

export default function LanguageSelector({ currentLocale }: { currentLocale: string }) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (locale: string) => {
    startTransition(() => {
      document.cookie = "locale=" + locale + ";path=/;max-age=31536000";
      window.location.reload();
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="language-select" className="text-sm font-medium text-[var(--text)]">
        Langue / Language
      </label>
      <select
        id="language-select"
        value={currentLocale}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isPending}
        className="px-3 py-2 rounded-lg bg-[var(--bg-card)] text-[var(--text)] border border-[var(--border)] disabled:opacity-50"
        aria-label="Select language"
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
}
