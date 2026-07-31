"use client";

import { useI18n, LANGS, Lang } from "@/lib/i18n";
import { useIsMobile } from "@/hooks/useIsMobile";

export default function LanguageSelector() {
  const { lang, setLang } = useI18n();
  const isMobile = useIsMobile();
  return (
    <select
      className="lang-select"
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
      aria-label="Idioma / Idioma / Language"
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code}>
          {isMobile ? l.short : l.label}
        </option>
      ))}
    </select>
  );
}
