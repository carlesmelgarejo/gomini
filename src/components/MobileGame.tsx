"use client";

// Disposició per a mòbil: barra superior amb hamburguesa + títol, fila d'accions
// (torn/resultat + botons rodons), captures, tauler i botons Passar/Desfer. La
// configuració (mida, oponent, dificultat…) va dins d'un calaix (drawer).

import { useState } from "react";
import Link from "next/link";
import GoBoard from "./GoBoard";
import { TurnIndicator } from "./GamePanel";
import { GoGame, BOARD_SIZES } from "@/hooks/useGoGame";
import { Difficulty } from "@/lib/go/remoteEngine";
import { useI18n } from "@/lib/i18n";

const DIFFS: Difficulty[] = ["easy", "medium", "hard"];

const HamburgerIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

const WandIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="currentColor"
    aria-hidden="true"
  >
    {/* vareta */}
    <rect
      x="2.5"
      y="14.4"
      width="15.5"
      height="3.2"
      rx="1.6"
      transform="rotate(-45 10.25 16)"
    />
    {/* espurnes */}
    <path d="M5 2.2 6.1 4.6 8.5 5.7 6.1 6.8 5 9.2 3.9 6.8 1.5 5.7 3.9 4.6Z" />
    <path d="M12.5 1.5 13.1 2.9 14.5 3.5 13.1 4.1 12.5 5.5 11.9 4.1 10.5 3.5 11.9 2.9Z" />
    <path d="M18.5 11.5 19.6 13.9 22 15 19.6 16.1 18.5 18.5 17.4 16.1 15 15 17.4 13.9Z" />
  </svg>
);

const NewIcon = () => (
  <svg viewBox="0 0 24 24" width="30" height="28" aria-hidden="true">
    {/* segell amb vores ondulades */}
    <path
      fill="currentColor"
      d="M3.5 5.6 q2 2 4 0 t4 0 t4 0 t4 0 v-2.1 h-16 z"
    />
    <path
      fill="currentColor"
      d="M3.5 18.4 q2 -2 4 0 t4 0 t4 0 t4 0 v2.1 h-16 z"
    />
    <text
      x="12"
      y="14.6"
      textAnchor="middle"
      fontSize="7.6"
      fontWeight="800"
      fontFamily="system-ui, sans-serif"
      fill="currentColor"
    >
      NEW
    </text>
  </svg>
);

const CapIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3 1 9l11 6 9-4.91V17h2V9L12 3z" />
  </svg>
);

const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export default function MobileGame({ game }: { game: GoGame }) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const isFast = game.opponentMode === "fast";
  const colorName = t(game.humanPlayer === "black" ? "black" : "white");

  return (
    <main className="mobile-game">
      <header className="mobile-topbar">
        <button
          className="icon-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="Menú"
        >
          <HamburgerIcon />
        </button>
        <div className="mobile-title">
          Go<span>Mini</span>
        </div>
        <span className="topbar-spacer" />
      </header>

      <div className="mobile-actions">
        <div className="mobile-turn-slot">
          <TurnIndicator game={game} compact />
        </div>
        <div className="round-actions">
          <button
            className="round-btn"
            onClick={game.requestHint}
            disabled={!game.isHumanTurn || game.hintLoading}
            aria-label={t("hint")}
          >
            <WandIcon />
          </button>
          <button
            className="round-btn"
            onClick={game.newGame}
            aria-label={t("newGame")}
          >
            <NewIcon />
          </button>
          <Link href="/aprendre" className="round-btn" aria-label={t("learn")}>
            <CapIcon />
          </Link>
        </div>
      </div>

      {game.score && (
        <div className="result mobile-result">
          <p className="result-winner">
            {t("resultWinner", { color: t(game.score.winner) })}
          </p>
          <p className="result-detail">
            {t("resultDetail", {
              black: game.score.black,
              white: game.score.white.toFixed(1),
              komi: game.score.komi,
            })}{" "}
            · {t("margin", { margin: game.score.margin.toFixed(1) })}
          </p>
        </div>
      )}

      <div className="captures-bar">
        <div className="capture-chip">
          <span className="dot dot-black" />
          <b>{game.state.captures.black}</b>
          <span>{t("blackCaptures")}</span>
        </div>
        <div className="capture-chip">
          <span className="dot dot-white" />
          <b>{game.state.captures.white}</b>
          <span>{t("whiteCaptures")}</span>
        </div>
      </div>

      <div className="board-wrap">
        <GoBoard
          state={game.state}
          isHumanTurn={game.isHumanTurn}
          humanPlayer={game.humanPlayer}
          onPlay={game.playAt}
          hintPoint={game.hint?.point ?? null}
        />
      </div>

      <div className="board-actions">
        <button
          className="btn btn-primary"
          onClick={game.passTurn}
          disabled={!game.isHumanTurn}
        >
          {t("pass")}
        </button>
        <button className="btn" onClick={game.undo} disabled={!game.canUndo}>
          {t("undo")}
        </button>
      </div>

      {menuOpen && (
        <div className="drawer-backdrop" onClick={() => setMenuOpen(false)} />
      )}
      <aside className={`drawer ${menuOpen ? "drawer-open" : ""}`}>
        <div className="drawer-head">
          <strong>{t("subtitle", { color: colorName })}</strong>
          <button
            className="icon-btn"
            onClick={() => setMenuOpen(false)}
            aria-label="Tancar"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="difficulty">
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
            >
              {t("fastBot")}
            </button>
            <button
              className={`chip ${!isFast ? "chip-on" : ""}`}
              onClick={() => game.setOpponentMode("katago")}
            >
              KataGo
            </button>
          </div>
        </div>

        <MobileEngineBadge game={game} />

        {!isFast && (
          <div className="difficulty">
            <span className="difficulty-label">{t("difficultyKatago")}</span>
            <div className="difficulty-options">
              {DIFFS.map((d) => (
                <button
                  key={d}
                  className={`chip ${game.difficulty === d ? "chip-on" : ""}`}
                  onClick={() => game.setDifficulty(d)}
                >
                  {t(d)}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="hint">{t("hintNote")}</p>
      </aside>
    </main>
  );
}

function MobileEngineBadge({ game }: { game: GoGame }) {
  const { t } = useI18n();
  const isFast = game.opponentMode === "fast";
  const text = isFast
    ? t("badgeFast")
    : game.engineStatus === "checking"
      ? t("badgeChecking")
      : game.engineStatus === "katago"
        ? t("badgeKatago")
        : t("badgeFallback");
  const cls = isFast ? "engine-fast" : `engine-${game.engineStatus}`;
  return (
    <div className={`engine-badge ${cls}`}>
      <span className="engine-dot" />
      <div>
        <span className="engine-caption">{t("playingWith")}</span>
        <span className="engine-name">{text}</span>
      </div>
    </div>
  );
}
