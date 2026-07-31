// Tipus bàsics del joc de Go.

export type Player = "black" | "white";

// Estat d'una intersecció del tauler.
export type Stone = Player | null;

// Una posició del tauler per fila/columna (0-indexed).
export interface Point {
  row: number;
  col: number;
}

// Una jugada: col·locar una pedra, o passar.
export type Move = { type: "play"; point: Point } | { type: "pass" };

// Resultat de comptar el territori al final de la partida.
export interface Score {
  black: number;
  white: number;
  komi: number;
  winner: Player;
  margin: number;
}

export const opponent = (player: Player): Player =>
  player === "black" ? "white" : "black";
