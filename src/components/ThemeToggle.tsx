"use client";

// Botó per alternar entre tema clar i fosc. La preferència es desa a
// localStorage; el tema inicial l'aplica un script a layout.tsx per evitar
// el parpelleig (flash) en carregar.

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const current =
      (document.documentElement.dataset.theme as Theme) || "dark";
    setTheme(current);
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem("go-theme", next);
    } catch {
      /* localStorage no disponible: no passa res */
    }
    setTheme(next);
  };

  return (
    <button
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === "dark" ? "Canviar a tema clar" : "Canviar a tema fosc"}
      title={theme === "dark" ? "Tema clar" : "Tema fosc"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
