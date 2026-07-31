// Conversió entre les coordenades internes (fila/columna, fila 0 = a dalt) i
// els vèrtexs GTP que fa servir KataGo (p. ex. "E5"). En GTP les columnes són
// lletres A..T saltant-se la I, i les files es numeren des de baix (1 = a baix).

import { Point } from "./types";

const COLUMN_LETTERS = "ABCDEFGHJKLMNOPQRST"; // sense la I

export const pointToVertex = (size: number, point: Point): string => {
  const letter = COLUMN_LETTERS[point.col];
  const number = size - point.row; // fila 0 (a dalt) → número més alt
  return `${letter}${number}`;
};

// Retorna null si el vèrtex és "pass" o "resign".
export const vertexToPoint = (size: number, vertex: string): Point | null => {
  const v = vertex.trim().toUpperCase();
  if (v === "PASS" || v === "RESIGN" || v === "") return null;
  const col = COLUMN_LETTERS.indexOf(v[0]);
  const number = parseInt(v.slice(1), 10);
  if (col < 0 || Number.isNaN(number)) return null;
  return { row: size - number, col };
};
