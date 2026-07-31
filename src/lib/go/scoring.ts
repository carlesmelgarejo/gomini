// Compte de la partida per àrea (estil xinès): punts = pedres pròpies al
// tauler + territori envoltat només pel teu color. El komi compensa Blanc
// per jugar segon. S'assumeix que totes les pedres del tauler són vives
// (no es negocien pedres mortes en aquesta versió).

import { Grid } from "./board";
import { neighbors } from "./board";
import { Player, Score } from "./types";

// Komi habitual per a Go 9x9 amb compte per àrea.
export const DEFAULT_KOMI = 7;

// Komi segons la mida del tauler (compte per àrea). El 7x7 en necessita més.
export const komiForSize = (size: number): number => {
  if (size <= 7) return 9;
  return DEFAULT_KOMI;
};

// Recorre una regió buida connexa i determina quins colors la toquen.
const exploreTerritory = (
  grid: Grid,
  size: number,
  start: number,
  visited: boolean[],
): { region: number[]; borders: Set<Player> } => {
  const region: number[] = [];
  const borders = new Set<Player>();
  const stack = [start];
  visited[start] = true;

  while (stack.length > 0) {
    const current = stack.pop()!;
    region.push(current);
    for (const n of neighbors(size, current)) {
      const cell = grid[n];
      if (cell === null) {
        if (!visited[n]) {
          visited[n] = true;
          stack.push(n);
        }
      } else {
        borders.add(cell);
      }
    }
  }

  return { region, borders };
};

// Retorna una còpia de la graella amb les pedres mortes retirades (buides).
// Si no hi ha pedres mortes, retorna la mateixa graella sense copiar.
const withoutDead = (grid: Grid, dead?: ReadonlySet<number>): Grid => {
  if (!dead || dead.size === 0) return grid;
  const next = grid.slice();
  for (const i of dead) next[i] = null;
  return next;
};

// Mapa de propietat del territori: per a cada intersecció buida retorna el color
// que l'envolta ("black" | "white") o null si és una pedra viva o un punt neutral
// (dame, que toca els dos colors). Les pedres mortes es tracten com a buides, de
// manera que el seu lloc compta com a territori del color contrari.
export const computeTerritory = (
  grid: Grid,
  size: number,
  dead?: ReadonlySet<number>,
): (Player | null)[] => {
  const effective = withoutDead(grid, dead);
  const owners = new Array<Player | null>(grid.length).fill(null);
  const visited = new Array<boolean>(grid.length).fill(false);

  for (let i = 0; i < effective.length; i++) {
    if (effective[i] !== null || visited[i]) continue;
    const { region, borders } = exploreTerritory(effective, size, i, visited);
    if (borders.size === 1) {
      const owner = [...borders][0];
      for (const idx of region) owners[idx] = owner;
    }
  }

  return owners;
};

// Compte per àrea tractant les pedres mortes com a capturades: es retiren de la
// graella (el seu lloc passa a ser territori del rival) abans de comptar.
export const scoreAreaWithDead = (
  grid: Grid,
  size: number,
  komi = DEFAULT_KOMI,
  dead?: ReadonlySet<number>,
): Score => scoreArea(withoutDead(grid, dead), size, komi);

export const scoreArea = (
  grid: Grid,
  size: number,
  komi = DEFAULT_KOMI,
): Score => {
  let black = 0;
  let white = 0;

  for (const cell of grid) {
    if (cell === "black") black++;
    else if (cell === "white") white++;
  }

  const visited = new Array<boolean>(grid.length).fill(false);
  for (let i = 0; i < grid.length; i++) {
    if (grid[i] !== null || visited[i]) continue;
    const { region, borders } = exploreTerritory(grid, size, i, visited);
    // Un territori compta només si el toca un únic color.
    if (borders.size === 1) {
      const owner = [...borders][0];
      if (owner === "black") black += region.length;
      else white += region.length;
    }
  }

  const whiteTotal = white + komi;
  const winner: Player = black > whiteTotal ? "black" : "white";
  const margin = Math.abs(black - whiteTotal);

  return { black, white: whiteTotal, komi, winner, margin };
};
