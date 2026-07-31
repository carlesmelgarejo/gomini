"use client";

// Oponent KataGo (client): recull l'historial de la partida, el converteix al
// format de KataGo i el demana a l'API route. Compleix la mateixa interfície
// GoEngine que el bot heurístic, de manera que és intercanviable.

import { GameState } from "./board";
import { Move, Point } from "./types";
import { komiForSize } from "./scoring";
import { pointToVertex, vertexToPoint } from "./vertex";
import { GoEngine } from "./engine";

export type Difficulty = "easy" | "medium" | "hard";

// La força es controla amb el nombre de "visits" de KataGo: menys visits =
// joc més fluix i ràpid; més visits = més fort.
export const VISITS: Record<Difficulty, number> = {
  easy: 8,
  medium: 80,
  hard: 600,
};

type KataMove = ["B" | "W", string];

// L'historial alterna sempre Negre/Blanc (fins i tot les passades), així que el
// color surt de la paritat de l'índex.
export const toKataMoves = (state: GameState): KataMove[] =>
  state.moves.map((move, i) => {
    const player: "B" | "W" = i % 2 === 0 ? "B" : "W";
    const vertex =
      move.type === "pass" ? "pass" : pointToVertex(state.size, move.point);
    return [player, vertex];
  });

// Pista de KataGo per al jugador que ha de moure.
export interface Hint {
  point: Point | null; // jugada recomanada (null si recomana passar)
  winrate: number; // 0..1
  scoreLead: number; // punts esperats
  sequence: Point[]; // seqüència prevista (les següents jugades)
}

export const fetchHint = async (
  state: GameState,
  visits: number,
): Promise<Hint> => {
  const res = await fetch("/api/hint", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      moves: toKataMoves(state),
      komi: komiForSize(state.size),
      size: state.size,
      maxVisits: visits,
    }),
  });
  if (!res.ok) throw new Error(`Pista no disponible (${res.status})`);

  const data = (await res.json()) as {
    vertex: string;
    winrate: number;
    scoreLead: number;
    pv: string[];
  };
  const toP = (v: string) => vertexToPoint(state.size, v);
  return {
    point: toP(data.vertex),
    winrate: data.winrate,
    scoreLead: data.scoreLead,
    sequence: (data.pv || []).map(toP).filter((p): p is Point => p !== null),
  };
};

export class KataGoEngine implements GoEngine {
  readonly name = "KataGo";

  constructor(private readonly getVisits: () => number) {}

  async selectMove(state: GameState): Promise<Move> {
    const res = await fetch("/api/move", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        moves: toKataMoves(state),
        komi: komiForSize(state.size),
        size: state.size,
        maxVisits: this.getVisits(),
      }),
    });

    if (!res.ok) throw new Error(`KataGo no disponible (${res.status})`);

    const { vertex } = (await res.json()) as { vertex: string };
    const point = vertexToPoint(state.size, vertex);
    return point ? { type: "play", point } : { type: "pass" };
  }
}
