"use client";

// Panell lateral: qui mou, pedres capturades, estat de la màquina, controls i
// resultat final quan la partida acaba.

import Link from "next/link";
import { GoGame, EngineStatus, BOARD_SIZES } from "@/hooks/useGoGame";
import { Player } from "@/lib/go/types";
import { Difficulty } from "@/lib/go/remoteEngine";
import { pointToVertex } from "@/lib/go/vertex";

const label = (p: Player) => (p === "black" ? "Negres" : "Blanques");

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: "easy", label: "Fàcil" },
  { key: "medium", label: "Mitjà" },
  { key: "hard", label: "Difícil" },
];

const ENGINE_BADGE: Record<EngineStatus, { text: string; cls: string }> = {
  checking: { text: "Comprovant KataGo…", cls: "engine-checking" },
  katago: { text: "KataGo (motor de Go)", cls: "engine-katago" },
  fallback: { text: "Bot heurístic (reserva)", cls: "engine-fallback" },
};

export default function GamePanel({ game }: { game: GoGame }) {
  const { humanPlayer, score, canUndo } = game;
  const botPlayer: Player = humanPlayer === "black" ? "white" : "black";
  const isFast = game.opponentMode === "fast";

  const badge = isFast
    ? { text: "Bot ràpid (instantani)", cls: "engine-fast" }
    : ENGINE_BADGE[game.engineStatus];

  return (
    <aside className="panel">
      <div className="panel-header">
        <h1>GoMini</h1>
        <p className="subtitle">Tu ({label(humanPlayer)}) contra la màquina</p>
        <Link href="/aprendre" className="learn-link">
          <span className="learn-icon">📖</span>
          Aprendre a jugar
          <span className="learn-arrow">→</span>
        </Link>
      </div>

      <div className="difficulty opponent-block">
        <span className="difficulty-label">Tauler</span>
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
        <span className="difficulty-label">Oponent</span>
        <div className="difficulty-options opponent-options">
          <button
            className={`chip ${isFast ? "chip-on" : ""}`}
            onClick={() => game.setOpponentMode("fast")}
            data-tip="Oponent senzill integrat a l'app: respon a l'instant i no consumeix recursos. Nivell principiant."
          >
            Bot ràpid
          </button>
          <button
            className={`chip ${!isFast ? "chip-on" : ""}`}
            onClick={() => game.setOpponentMode("katago")}
            data-tip="Motor de Go professional (IA). Juga molt fort, amb dificultat ajustable. S'engega sota demanda."
          >
            KataGo
          </button>
        </div>
      </div>

      <div className={`engine-badge ${badge.cls}`}>
        <span className="engine-dot" />
        <div>
          <span className="engine-caption">Jugant amb</span>
          <span className="engine-name">{badge.text}</span>
        </div>
      </div>

      {!isFast && (
        <div className="difficulty">
          <span className="difficulty-label">Dificultat (KataGo)</span>
          <div className="difficulty-options">
            {DIFFICULTIES.map((d) => (
              <button
                key={d.key}
                className={`chip ${game.difficulty === d.key ? "chip-on" : ""}`}
                onClick={() => game.setDifficulty(d.key)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <TurnIndicator game={game} botPlayer={botPlayer} />

      {score && (
        <div className="result">
          <h2>Fi de la partida</h2>
          <p className="result-winner">
            Guanyen les {label(score.winner)}
          </p>
          <p className="result-detail">
            Negres {score.black} · Blanques {score.white.toFixed(1)}{" "}
            <span className="komi">(komi {score.komi})</span>
          </p>
          <p className="result-detail">Marge: {score.margin.toFixed(1)} punts</p>
        </div>
      )}

      <HintBox game={game} />

      <div className="controls">
        <button
          className="btn"
          onClick={game.requestHint}
          disabled={!game.isHumanTurn || game.hintLoading}
        >
          {game.hintLoading ? "Pensant la pista…" : "Pista"}
        </button>
        <button className="btn btn-ghost" onClick={game.newGame}>
          Nova partida
        </button>
      </div>

      <p className="hint">
        Dues passades seguides acaben la partida i es compta el territori.
      </p>
    </aside>
  );
}

function HintBox({ game }: { game: GoGame }) {
  const { hint, state } = game;
  if (!hint) return null;

  const move = hint.point ? pointToVertex(state.size, hint.point) : "passar";
  const winPct = Math.round(hint.winrate * 100);
  const lead = hint.scoreLead;
  const leadText =
    lead >= 0
      ? `vas +${lead.toFixed(1)} punts`
      : `vas ${lead.toFixed(1)} punts`;
  const sequence = hint.sequence
    .slice(0, 5)
    .map((p) => pointToVertex(state.size, p))
    .join(" → ");

  return (
    <div className="hintbox">
      <div className="hintbox-move">
        Jugada recomanada: <strong>{move}</strong>
        <span className="hintbox-badge">verd al tauler</span>
      </div>
      <div className="hintbox-stats">
        <span>Guanyar: <strong>{winPct}%</strong></span>
        <span>{leadText}</span>
      </div>
      {sequence && (
        <div className="hintbox-seq">
          Seqüència prevista: {sequence}
        </div>
      )}
    </div>
  );
}

function TurnIndicator({
  game,
  botPlayer,
}: {
  game: GoGame;
  botPlayer: Player;
}) {
  const { state, thinking } = game;
  if (state.ended) {
    return <div className="turn turn-ended">Partida acabada</div>;
  }
  if (thinking) {
    return (
      <div className="turn turn-bot">
        <span className="spinner" /> La màquina està pensant…
      </div>
    );
  }
  const yourTurn = state.toMove === game.humanPlayer;
  return (
    <div className={`turn ${yourTurn ? "turn-you" : "turn-bot"}`}>
      <span className={`dot ${state.toMove === "black" ? "dot-black" : "dot-white"}`} />
      {yourTurn ? "És el teu torn" : "Torn de la màquina"}
    </div>
  );
}
