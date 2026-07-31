"use client";

// Tutorial interactiu: mostra lliçons amb una posició preparada i valida la
// jugada de l'aprenent amb el mateix motor de regles del joc. Textos localitzats.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import GoBoard from "./GoBoard";
import { GameState, buildPosition, groupAt, idx, play } from "@/lib/go/board";
import { pointToVertex } from "@/lib/go/vertex";
import { opponent, Player } from "@/lib/go/types";
import { LESSONS, Lesson } from "@/lib/go/lessons";
import { useI18n } from "@/lib/i18n";

const SIZE = 9;
const LEARNER: Player = "black"; // a totes les lliçons l'aprenent juga negres

type Feedback = { kind: "success" | "error"; text: string } | null;

const countStones = (state: GameState, color: Player): number =>
  state.grid.filter((c) => c === color).length;

const hasGroupInAtari = (state: GameState, color: Player): boolean => {
  for (let i = 0; i < state.grid.length; i++) {
    if (state.grid[i] !== color) continue;
    if (groupAt(state.grid, state.size, i).liberties.length === 1) return true;
  }
  return false;
};

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
  const { t, lang } = useI18n();
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

  const reasonText = (reason: string): string => {
    if (reason === "occupied") return t("reasonOccupied");
    if (reason === "ko") return t("reasonKo");
    if (reason === "suicide") return t("reasonSuicide");
    return t("reasonOther");
  };

  const handlePlay = (row: number, col: number) => {
    if (solved) return;
    const vertex = pointToVertex(SIZE, { row, col });

    if (lesson.avoid && lesson.avoid.vertex === vertex) {
      setFeedback({ kind: "error", text: lesson.avoid.message[lang] });
      return;
    }

    const next = play(board, idx(SIZE, row, col));
    if (goalMet(lesson, board, next, vertex)) {
      setBoard(next);
      setSolved(true);
      setFeedback({ kind: "success", text: lesson.success[lang] });
    } else {
      setFeedback({
        kind: "error",
        text: lesson.wrong ? lesson.wrong[lang] : t("wrongDefault"),
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
            setFeedback({ kind: "error", text: reasonText(reason) })
          }
        />
      </div>

      <aside className="tutorial-panel panel">
        <div className="tutorial-top">
          <Link href="/" className="tutorial-back">
            ← {t("tutBack")}
          </Link>
          <span className="tutorial-progress">
            {t("tutProgress", { n: index + 1, total: LESSONS.length })}
          </span>
        </div>

        <h1 className="tutorial-title">{lesson.title[lang]}</h1>
        <p className="tutorial-intro">{lesson.intro[lang]}</p>

        <div className="tutorial-task">
          <span className="tutorial-task-label">{t("tutTask")}</span>
          {lesson.task[lang]}
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
            {t("tutPrev")}
          </button>
          <button className="btn" onClick={retry}>
            {t("tutRetry")}
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setIndex((i) => Math.min(LESSONS.length - 1, i + 1))}
            disabled={isLast}
          >
            {solved ? t("tutNext") : t("tutSkip")}
          </button>
        </div>
      </aside>
    </main>
  );
}
