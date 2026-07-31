// Motor de tauler de Go: grups, llibertats, captures, ko i suïcidi.
//
// El tauler es representa com un array pla de `Stone` de mida size*size.
// L'índex d'una intersecció és row * size + col.

import { Player, Stone, Point, Move, opponent } from "./types";
import { vertexToPoint } from "./vertex";

export type Grid = Stone[];

export class IllegalMove extends Error {
  constructor(
    public readonly reason: "occupied" | "ko" | "suicide" | "out-of-bounds",
    message: string,
  ) {
    super(message);
    this.name = "IllegalMove";
  }
}

export const idx = (size: number, row: number, col: number): number =>
  row * size + col;

export const toPoint = (size: number, index: number): Point => ({
  row: Math.floor(index / size),
  col: index % size,
});

export const emptyGrid = (size: number): Grid =>
  new Array(size * size).fill(null);

// Índexs de les interseccions veïnes (ortogonals) d'una posició.
export const neighbors = (size: number, index: number): number[] => {
  const row = Math.floor(index / size);
  const col = index % size;
  const result: number[] = [];
  if (row > 0) result.push(index - size);
  if (row < size - 1) result.push(index + size);
  if (col > 0) result.push(index - 1);
  if (col < size - 1) result.push(index + 1);
  return result;
};

export interface Group {
  stones: number[];
  liberties: number[];
}

// Cadena connexa de pedres del mateix color que conté `start`, amb les seves llibertats.
export const groupAt = (grid: Grid, size: number, start: number): Group => {
  const color = grid[start];
  if (color === null) return { stones: [], liberties: [] };

  const stones: number[] = [];
  const liberties = new Set<number>();
  const seen = new Set<number>([start]);
  const stack = [start];

  while (stack.length > 0) {
    const current = stack.pop()!;
    stones.push(current);
    for (const n of neighbors(size, current)) {
      if (grid[n] === null) {
        liberties.add(n);
      } else if (grid[n] === color && !seen.has(n)) {
        seen.add(n);
        stack.push(n);
      }
    }
  }

  return { stones, liberties: [...liberties] };
};

export const countLiberties = (grid: Grid, size: number, start: number): number =>
  groupAt(grid, size, start).liberties.length;

// Resultat de simular una jugada sobre una graella (sense mutar l'original).
export interface PlacementResult {
  grid: Grid;
  captured: number[]; // índexs de pedres rivals capturades
}

// Col·loca una pedra i retira les cadenes rivals sense llibertats.
// No valida el suïcidi ni el ko: això ho fa `playMove`.
// Exportada perquè l'oponent pugui simular jugades sense mutar l'estat.
export const placeStone = (
  grid: Grid,
  size: number,
  index: number,
  color: Player,
): PlacementResult => {
  const next = grid.slice();
  next[index] = color;

  const enemy = opponent(color);
  const captured: number[] = [];
  const checked = new Set<number>();

  for (const n of neighbors(size, index)) {
    if (next[n] !== enemy || checked.has(n)) continue;
    const group = groupAt(next, size, n);
    group.stones.forEach((s) => checked.add(s));
    if (group.liberties.length === 0) {
      for (const s of group.stones) {
        next[s] = null;
        captured.push(s);
      }
    }
  }

  return { grid: next, captured };
};

// Estat immutable d'una partida en un instant donat.
export interface GameState {
  size: number;
  grid: Grid;
  toMove: Player;
  captures: { black: number; white: number }; // pedres capturades per cada bàndol
  koPoint: number | null; // intersecció prohibida pel ko, o null
  passes: number; // passades consecutives
  ended: boolean;
  lastMove: number | null; // índex de l'última pedra jugada (per ressaltar-la)
  moves: Move[]; // historial ordenat de jugades (per exportar o enviar a KataGo)
}

export const createGame = (size: number): GameState => ({
  size,
  grid: emptyGrid(size),
  toMove: "black",
  captures: { black: 0, white: 0 },
  koPoint: null,
  passes: 0,
  ended: false,
  lastMove: null,
  moves: [],
});

// Munta una posició preparada (per al tutorial) col·locant pedres directament,
// sense processar captures ni alternança. Els arguments són vèrtexs GTP ("E5").
export const buildPosition = (
  size: number,
  black: string[],
  white: string[],
  toMove: Player,
): GameState => {
  const state = createGame(size);
  const grid = state.grid.slice();
  const place = (vertices: string[], color: Player) => {
    for (const v of vertices) {
      const p = vertexToPoint(size, v);
      if (p) grid[idx(size, p.row, p.col)] = color;
    }
  };
  place(black, "black");
  place(white, "white");
  return { ...state, grid, toMove };
};

// Determina si una intersecció buida és un "ull" del color donat: tots els veïns
// ortogonals són del color (o vora) i el color també controla prou diagonals.
// Serveix per avisar quan algú està a punt de jugar dins d'un ull propi.
export const isEye = (
  grid: Grid,
  size: number,
  index: number,
  color: Player,
): boolean => {
  if (grid[index] !== null) return false;
  const orth = neighbors(size, index);
  if (!orth.every((n) => grid[n] === color)) return false;

  const { row, col } = toPoint(size, index);
  const diagonals = [
    [row - 1, col - 1],
    [row - 1, col + 1],
    [row + 1, col - 1],
    [row + 1, col + 1],
  ].filter(([r, c]) => r >= 0 && r < size && c >= 0 && c < size);

  const enemy = opponent(color);
  const enemyDiagonals = diagonals.filter(
    ([r, c]) => grid[r * size + c] === enemy,
  ).length;
  const onEdge = diagonals.length < 4;
  return onEdge ? enemyDiagonals === 0 : enemyDiagonals <= 1;
};

// Comprova si una jugada és legal sense aplicar-la. Retorna null si és legal.
export const illegalReason = (
  state: GameState,
  index: number,
): IllegalMove["reason"] | null => {
  const { grid, size, toMove } = state;
  if (index < 0 || index >= grid.length) return "out-of-bounds";
  if (grid[index] !== null) return "occupied";
  if (index === state.koPoint) return "ko";

  const { grid: trial, captured } = placeStone(grid, size, index, toMove);
  const liberties = countLiberties(trial, size, index);
  if (liberties === 0 && captured.length === 0) return "suicide";
  return null;
};

// Aplica una jugada de col·locació i retorna el nou estat. Llança IllegalMove si no és vàlida.
export const play = (state: GameState, index: number): GameState => {
  const reason = illegalReason(state, index);
  if (reason) throw new IllegalMove(reason, `Jugada il·legal: ${reason}`);

  const { grid, size, toMove } = state;
  const { grid: next, captured } = placeStone(grid, size, index, toMove);

  // Ko simple: si la jugada captura exactament una pedra i el grup nou té
  // una sola pedra amb una sola llibertat, aquella llibertat queda prohibida.
  const playedGroup = groupAt(next, size, index);
  const koPoint =
    captured.length === 1 &&
    playedGroup.stones.length === 1 &&
    playedGroup.liberties.length === 1
      ? captured[0]
      : null;

  const captures = { ...state.captures };
  if (toMove === "black") captures.black += captured.length;
  else captures.white += captured.length;

  return {
    ...state,
    grid: next,
    toMove: opponent(toMove),
    captures,
    koPoint,
    passes: 0,
    ended: false,
    lastMove: index,
    moves: [...state.moves, { type: "play", point: toPoint(size, index) }],
  };
};

// Passa el torn. Dues passades consecutives acaben la partida.
export const pass = (state: GameState): GameState => {
  const passes = state.passes + 1;
  return {
    ...state,
    toMove: opponent(state.toMove),
    koPoint: null,
    passes,
    ended: passes >= 2,
    lastMove: null,
    moves: [...state.moves, { type: "pass" }],
  };
};

// Llista d'índexs on el jugador actual pot jugar legalment.
export const legalMoves = (state: GameState): number[] => {
  const moves: number[] = [];
  for (let i = 0; i < state.grid.length; i++) {
    if (illegalReason(state, i) === null) moves.push(i);
  }
  return moves;
};
