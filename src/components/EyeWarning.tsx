"use client";

// Avís abans de jugar dins d'un ull propi (jugada normalment dolenta).

import { GoGame } from "@/hooks/useGoGame";
import { useI18n } from "@/lib/i18n";

export default function EyeWarning({ game }: { game: GoGame }) {
  const { t } = useI18n();
  if (!game.pendingEye) return null;

  return (
    <div className="eye-overlay">
      <div className="eye-box">
        <p className="eye-text">⚠️ {t("eyeWarn")}</p>
        <div className="eye-actions">
          <button className="btn" onClick={game.cancelEyeMove}>
            {t("no")}
          </button>
          <button className="btn btn-primary" onClick={game.confirmEyeMove}>
            {t("yes")}
          </button>
        </div>
      </div>
    </div>
  );
}
