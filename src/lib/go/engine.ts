// Oponent autònom ("la màquina").
//
// `GoEngine` és la interfície comuna que compleix qualsevol oponent. Avui hi
// ha el motor heurístic en TypeScript (client), i demà s'hi pot endollar un
// motor real (GNU Go o KataGo) darrere una API route que parli GTP, o un coach
// LLM via subscripció, sempre respectant aquesta mateixa interfície.

import {
  GameState,
  groupAt,
  neighbors,
  placeStone,
  illegalReason,
  toPoint,
} from "./board";
import { Move, Player, opponent } from "./types";

export interface GoEngine {
  readonly name: string;
  selectMove(state: GameState): Promise<Move>;
}

// Un punt buit és un "ull" del color si tots els veïns ortogonals són d'aquell
// color (o vora) i el color també controla prou diagonals. Evita que el bot
// s'ompli els propis ulls i es suïcidi.
const isEyeFor = (
  state: GameState,
  index: number,
  color: Player,
): boolean => {
  if (state.grid[index] !== null) return false;
  const orth = neighbors(state.size, index);
  if (!orth.every((n) => state.grid[n] === color)) return false;

  const { row, col } = toPoint(state.size, index);
  const size = state.size;
  const diagonals = [
    [row - 1, col - 1],
    [row - 1, col + 1],
    [row + 1, col - 1],
    [row + 1, col + 1],
  ].filter(([r, c]) => r >= 0 && r < size && c >= 0 && c < size);

  const enemy = opponent(color);
  const enemyDiagonals = diagonals.filter(
    ([r, c]) => state.grid[r * size + c] === enemy,
  ).length;
  const onEdge = diagonals.length < 4;
  // Al centre s'admet 1 diagonal enemiga; a la vora/cantonada, cap.
  return onEdge ? enemyDiagonals === 0 : enemyDiagonals <= 1;
};

// Puntuació heurística d'una jugada legal per al jugador que mou.
const evaluate = (state: GameState, index: number): number => {
  const color = state.toMove;
  const { grid, captured } = placeStone(state.grid, state.size, index, color);
  let score = 0;

  // Capturar pedres rivals és el més valuós.
  score += captured.length * 12;

  const own = groupAt(grid, state.size, index);

  // Evitar l'autoatari (quedar amb una sola llibertat sense capturar res).
  if (own.liberties.length === 1 && captured.length === 0) score -= 10;
  // Premiar tenir moltes llibertats (grup sòlid).
  score += Math.min(own.liberties.length, 4);

  // Posar el rival en atari (deixar-li un grup veí amb una sola llibertat).
  const enemy = opponent(color);
  const checkedEnemy = new Set<number>();
  for (const n of neighbors(state.size, index)) {
    if (grid[n] !== enemy || checkedEnemy.has(n)) continue;
    const enemyGroup = groupAt(grid, state.size, n);
    enemyGroup.stones.forEach((s) => checkedEnemy.add(s));
    if (enemyGroup.liberties.length === 1) score += 6;
  }

  // Preferir jugar a prop de pedres existents (contacte / desenvolupament).
  const nearStones = neighbors(state.size, index).filter(
    (n) => state.grid[n] !== null,
  ).length;
  score += nearStones;

  // Lleuger biaix cap al centre a l'inici (millor influència en 9x9).
  const { row, col } = toPoint(state.size, index);
  const center = (state.size - 1) / 2;
  const centrality = 2 - (Math.abs(row - center) + Math.abs(col - center)) / center;
  score += centrality;

  return score;
};

// Motor heurístic simple: tria la jugada legal amb millor puntuació, evitant
// omplir els propis ulls. Passa quan cap jugada millora la posició.
export class HeuristicEngine implements GoEngine {
  readonly name = "Bot heurístic";

  constructor(private readonly randomness = 1.5) {}

  async selectMove(state: GameState): Promise<Move> {
    const color = state.toMove;
    let best: { index: number; score: number } | null = null;

    for (let i = 0; i < state.grid.length; i++) {
      if (illegalReason(state, i) !== null) continue;
      if (isEyeFor(state, i, color)) continue;
      const score = evaluate(state, i) + Math.random() * this.randomness;
      if (!best || score > best.score) best = { index: i, score };
    }

    // Si no hi ha cap jugada raonable, o totes són dolentes, passa.
    if (!best || best.score < 0) return { type: "pass" };
    return { type: "play", point: toPoint(state.size, best.index) };
  }
}
