import type { Metadata, Viewport } from "next";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSelector from "@/components/LanguageSelector";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "GoMini — go.elclic.net",
  description: "Joc de Go en tauler petit (7×7 i 9×9) per jugar contra la màquina.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// Aplica el tema desat abans de pintar per evitar el parpelleig.
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem("go-theme") || "dark";
    document.documentElement.dataset.theme = t;
  } catch (e) {
    document.documentElement.dataset.theme = "dark";
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ca" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <I18nProvider>
          <div className="top-controls">
            <LanguageSelector />
            <ThemeToggle />
          </div>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
