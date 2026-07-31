"use client";

// Panell lateral: mida, oponent, motor, dificultat, resultat, controls i pista.

import Link from "next/link";
import { GoGame, BOARD_SIZES } from "@/hooks/useGoGame";
import { Player } from "@/lib/go/types";
import { Difficulty } from "@/lib/go/remoteEngine";
import { pointToVertex } from "@/lib/go/vertex";
import { useI18n } from "@/lib/i18n";

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "easy", label: "easy" },
  { key: "medium", label: "medium" },
  { key: "hard", label: "hard" },
];

export default function GamePanel({ game }: { game: GoGame }) {
  const { t } = useI18n();
  const { humanPlayer, score, canUndo } = game;
  const isFast = game.opponentMode === "fast";
  const colorName = t(humanPlayer === "black" ? "black" : "white");

  const badgeText = isFast
    ? t("badgeFast")
    : game.engineStatus === "checking"
      ? t("badgeChecking")
      : game.engineStatus === "katago"
        ? t("badgeKatago")
        : t("badgeFallback");
  const badgeCls = isFast ? "engine-fast" : `engine-${game.engineStatus}`;

  return (
    <div className="panel-wrap">
      <Link href="/aprendre" className="learn-btn" data-tip={t("learn")}>
        <svg
          viewBox="0 0 24 24"
          width="24"
          height="24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3 1 9l11 6 9-4.91V17h2V9L12 3z" />
        </svg>
      </Link>
      <aside className="panel">
        <div className="panel-header">
          <h1>
            Go<span>Mini</span>
          </h1>
          <p className="subtitle">{t("subtitle", { color: colorName })}</p>
        </div>

        <div className="difficulty opponent-block">
          <span className="difficulty-label">{t("board")}</span>
          <div className="difficulty-options opponent-options">
            {BOARD_SIZES.map((n) => (
              <button
                key={n}
                className={`chip ${game.size === n ? "chip-on" : ""}`}
                onClick={() => game.setSize(n)}
              >
                {n}×{n}
              </button>
            ))}
          </div>
        </div>

        <div className="difficulty opponent-block">
          <span className="difficulty-label">{t("opponent")}</span>
          <div className="difficulty-options opponent-options">
            <button
              className={`chip ${isFast ? "chip-on" : ""}`}
              onClick={() => game.setOpponentMode("fast")}
              data-tip={t("tipFast")}
            >
              {t("fastBot")}
            </button>
            <button
              className={`chip ${!isFast ? "chip-on" : ""}`}
              onClick={() => game.setOpponentMode("katago")}
              data-tip={t("tipKata")}
            >
              KataGo
            </button>
          </div>
        </div>

        <div className={`engine-badge ${badgeCls}`}>
          <span className="engine-dot" />
          <div>
            <span className="engine-caption">{t("playingWith")}</span>
            <span className="engine-name">{badgeText}</span>
          </div>
        </div>

        {!isFast && (
          <div className="difficulty">
            <span className="difficulty-label">{t("difficultyKatago")}</span>
            <div className="difficulty-options">
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.key}
                  className={`chip ${game.difficulty === d.key ? "chip-on" : ""}`}
                  onClick={() => game.setDifficulty(d.key)}
                >
                  {t(d.label)}
                </button>
              ))}
            </div>
          </div>
        )}

        <TurnIndicator game={game} />

        {score && (
          <div className="result">
            <h2>{t("resultTitle")}</h2>
            <p className="result-winner">
              {t("resultWinner", { color: t(score.winner) })}
            </p>
            <p className="result-detail">
              {t("resultDetail", {
                black: score.black,
                white: score.white.toFixed(1),
                komi: score.komi,
              })}
            </p>
            <p className="result-detail">
              {t("margin", { margin: score.margin.toFixed(1) })}
            </p>
          </div>
        )}

        <HintBox game={game} />

        <div className="controls">
          <button
            className="btn"
            onClick={game.requestHint}
            disabled={!game.isHumanTurn || game.hintLoading}
          >
            {game.hintLoading ? t("hintThinking") : t("hint")}
          </button>
          <button className="btn btn-ghost" onClick={game.newGame}>
            {t("newGame")}
          </button>
        </div>

        <p className="hint">{t("hintNote")}</p>
      </aside>
    </div>
  );
}

function HintBox({ game }: { game: GoGame }) {
  const { t } = useI18n();
  const { hint, state } = game;
  if (!hint) return null;

  const move = hint.point ? pointToVertex(state.size, hint.point) : t("pass");
  const winPct = Math.round(hint.winrate * 100);
  const lead = hint.scoreLead;
  const leadText =
    lead >= 0
      ? t("leadPlus", { n: lead.toFixed(1) })
      : t("leadMinus", { n: lead.toFixed(1) });
  const sequence = hint.sequence
    .slice(0, 5)
    .map((p) => pointToVertex(state.size, p))
    .join(" → ");

  return (
    <div className="hintbox">
      <div className="hintbox-move">
        {t("recommended")}: <strong>{move}</strong>
        <span className="hintbox-badge">{t("onBoardGreen")}</span>
      </div>
      <div className="hintbox-stats">
        <span>
          {t("win")}: <strong>{winPct}%</strong>
        </span>
        <span>{leadText}</span>
      </div>
      {sequence && (
        <div className="hintbox-seq">
          {t("sequence")}: {sequence}
        </div>
      )}
    </div>
  );
}

export function TurnIndicator({
  game,
  compact = false,
}: {
  game: GoGame;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const { state, thinking, humanPlayer, hintLoading } = game;

  if (state.ended) {
    return (
      <div className="turn turn-ended">
        <span>{t("ended")}</span>
      </div>
    );
  }

  const yourTurn = state.toMove === humanPlayer;
  // "Pensant" mentre mou la màquina o mentre es calcula una pista.
  const showThinking = hintLoading || (thinking && !yourTurn);
  if (showThinking) {
    return (
      <div className="turn turn-bot">
        <span className="spinner" />{" "}
        <span>{t(compact ? "thinkingShort" : "thinking")}</span>
      </div>
    );
  }

  const dotColor: Player = state.toMove;
  return (
    <div className={`turn ${yourTurn ? "turn-you" : "turn-bot"}`}>
      <span
        className={`dot ${dotColor === "black" ? "dot-black" : "dot-white"}`}
      />
      <span>{yourTurn ? t("turnYou") : t("turnBot")}</span>
    </div>
  );
}
