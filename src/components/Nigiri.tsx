"use client";

// Cerimònia del nigiri: dos bols sobre el tauler. La màquina té un nombre
// amagat de pedres blanques; toques el teu bol per triar 1 (senar) o 2 (parell)
// pedres negres i prems "Revelar". Si encertes la paritat, jugues amb negres.

import { GoGame } from "@/hooks/useGoGame";
import { useI18n } from "@/lib/i18n";

export default function Nigiri({ game }: { game: GoGame }) {
  const { t } = useI18n();
  if (!game.nigiriActive) return null;

  const { nigiriGuess, nigiriRevealed, machineStones } = game;
  const won = game.humanPlayer === "black";

  return (
    <div className="nigiri-overlay">
      <div className="nigiri-box">
        <p className="nigiri-instr">
          {nigiriRevealed
            ? won
              ? t("nigiriWon")
              : t("nigiriLost")
            : t("nigiriHelp")}
        </p>

        <div className="nigiri-bowls">
          <button
            className="nigiri-bowl bowl-player"
            onClick={game.nigiriToggleGuess}
            disabled={nigiriRevealed}
            aria-label={t("you")}
          >
            <span className="nigiri-bowl-label">{t("you")}</span>
            <span className="nigiri-stones">
              {Array.from({ length: nigiriGuess }, (_, i) => (
                <span key={i} className="nigiri-stone stone-black" />
              ))}
            </span>
          </button>

          <div className="nigiri-bowl bowl-machine">
            <span className="nigiri-bowl-label">{t("machine")}</span>
            {nigiriRevealed ? (
              <span className="nigiri-stones">
                {Array.from({ length: machineStones }, (_, i) => (
                  <span key={i} className="nigiri-stone stone-white" />
                ))}
              </span>
            ) : (
              <button
                className="btn btn-primary nigiri-reveal"
                onClick={game.nigiriReveal}
              >
                {t("reveal")}
              </button>
            )}
          </div>
        </div>

        {nigiriRevealed && (
          <button className="btn btn-primary nigiri-start" onClick={game.nigiriStart}>
            {t("nigiriPlay")}
          </button>
        )}
      </div>
    </div>
  );
}
