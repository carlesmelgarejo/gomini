"use client";

// Tutorial interactiu: mostra lliçons amb una posició preparada i valida la
// jugada de l'aprenent amb el mateix motor de regles del joc.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import GoBoard from "./GoBoard";
import {
  GameState,
  buildPosition,
  groupAt,
  idx,
  play,
} from "@/lib/go/board";
import { pointToVertex } from "@/lib/go/vertex";
import { opponent, Player } from "@/lib/go/types";
import { LESSONS, Lesson } from "@/lib/go/lessons";

const SIZE = 9;
// A totes les lliçons l'aprenent juga amb negres.
const LEARNER: Player = "black";

type Feedback = { kind: "success" | "error"; text: string } | null;

const reasonMessage = (reason: string): string => {
  if (reason === "occupied") return "Aquí ja hi ha una pedra.";
  if (reason === "ko") return "Prohibit pel ko: no pots recapturar de seguida.";
  if (reason === "suicide")
    return "Això seria suïcidi: la teva pedra quedaria sense llibertats.";
  return "Aquesta jugada no és possible aquí.";
};

const countStones = (state: GameState, color: Player): number =>
  state.grid.filter((c) => c === color).length;

const hasGroupInAtari = (state: GameState, color: Player): boolean => {
  for (let i = 0; i < state.grid.length; i++) {
    if (state.grid[i] !== color) continue;
    if (groupAt(state.grid, state.size, i).liberties.length === 1) return true;
  }
  return false;
};

// Nombre de cadenes diferents d'un color que estan en atari (1 llibertat).
const countGroupsInAtari = (state: GameState, color: Player): number => {
  const seen = new Set<number>();
  let count = 0;
  for (let i = 0; i < state.grid.length; i++) {
    if (state.grid[i] !== color || seen.has(i)) continue;
    const group = groupAt(state.grid, state.size, i);
    group.stones.forEach((s) => seen.add(s));
    if (group.liberties.length === 1) count++;
  }
  return count;
};

const goalMet = (
  lesson: Lesson,
  before: GameState,
  after: GameState,
  vertex: string,
): boolean => {
  const enemy = opponent(LEARNER);
  if (lesson.goal === "capture")
    return countStones(after, enemy) < countStones(before, enemy);
  if (lesson.goal === "atari") return hasGroupInAtari(after, enemy);
  if (lesson.goal === "doubleAtari")
    return countGroupsInAtari(after, enemy) >= 2;
  return lesson.accept.includes(vertex);
};

export default function Tutorial() {
  const [index, setIndex] = useState(0);
  const lesson = LESSONS[index];

  const base = useMemo(
    () => buildPosition(SIZE, lesson.black, lesson.white, LEARNER),
    [lesson],
  );
  const [board, setBoard] = useState<GameState>(base);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    setBoard(base);
    setSolved(false);
    setFeedback(null);
  }, [base]);

  const handlePlay = (row: number, col: number) => {
    if (solved) return;
    const vertex = pointToVertex(SIZE, { row, col });

    if (lesson.avoid && lesson.avoid.vertex === vertex) {
      setFeedback({ kind: "error", text: lesson.avoid.message });
      return;
    }

    const next = play(board, idx(SIZE, row, col));
    if (goalMet(lesson, board, next, vertex)) {
      setBoard(next);
      setSolved(true);
      setFeedback({ kind: "success", text: lesson.success });
    } else {
      setFeedback({
        kind: "error",
        text: lesson.wrong || "Aquesta no és la jugada. Torna-ho a provar.",
      });
    }
  };

  const retry = () => {
    setBoard(base);
    setSolved(false);
    setFeedback(null);
  };

  const isLast = index === LESSONS.length - 1;

  return (
    <main className="tutorial">
      <div className="tutorial-board">
        <GoBoard
          state={board}
          isHumanTurn={!solved}
          humanPlayer={LEARNER}
          onPlay={handlePlay}
          onIllegal={(reason) =>
            setFeedback({ kind: "error", text: reasonMessage(reason) })
          }
        />
      </div>

      <aside className="tutorial-panel panel">
        <div className="tutorial-top">
          <Link href="/" className="tutorial-back">
            ← Tornar al joc
          </Link>
          <span className="tutorial-progress">
            Lliçó {index + 1} de {LESSONS.length}
          </span>
        </div>

        <h1 className="tutorial-title">{lesson.title}</h1>
        <p className="tutorial-intro">{lesson.intro}</p>

        <div className="tutorial-task">
          <span className="tutorial-task-label">La teva tasca</span>
          {lesson.task}
        </div>

        {feedback && (
          <div className={`tutorial-feedback feedback-${feedback.kind}`}>
            {feedback.text}
          </div>
        )}

        <div className="tutorial-controls">
          <button
            className="btn"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
          >
            Anterior
          </button>
          <button className="btn" onClick={retry}>
            Reintentar
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setIndex((i) => Math.min(LESSONS.length - 1, i + 1))}
            disabled={isLast}
          >
            {solved ? "Següent →" : "Ometre →"}
          </button>
        </div>
      </aside>
    </main>
  );
}
