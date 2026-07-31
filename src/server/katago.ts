// Gestor del motor d'anàlisi de KataGo al servidor.
//
// Arrenca un únic procés `katago analysis` i li envia consultes JSON delimitades
// per línia. Cada consulta demana la millor jugada per a la posició actual amb
// un límit de `maxVisits` (la palanca de dificultat). És stateless: cada petició
// envia la partida sencera, de manera que no hi ha estat a sincronitzar.
//
// Configuració per variables d'entorn:
//   KATAGO_BIN     ruta de l'executable (per defecte "katago")
//   KATAGO_MODEL   ruta del model .bin.gz  (obligatòria)
//   KATAGO_CONFIG  ruta de l'analysis.cfg  (obligatòria)

import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import { createInterface } from "node:readline";

export class KataGoUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "KataGoUnavailable";
  }
}

export type KataMove = [player: "B" | "W", vertex: string];

export interface AnalyzeRequest {
  moves: KataMove[];
  komi: number;
  size: number;
  maxVisits: number;
}

// Valoració de KataGo per a la posició, des del punt de vista del jugador que mou.
export interface AnalyzeResult {
  move: string; // vèrtex ("E5"), "pass" o "resign"
  winrate: number; // 0..1
  scoreLead: number; // punts esperats
  pv: string[]; // seqüència prevista
}

type Pending = {
  resolve: (result: AnalyzeResult) => void;
  reject: (err: Error) => void;
};

let engine: ChildProcessWithoutNullStreams | null = null;
const pending = new Map<string, Pending>();
let counter = 0;

const start = (): ChildProcessWithoutNullStreams => {
  const bin = process.env.KATAGO_BIN || "katago";
  const model = process.env.KATAGO_MODEL;
  const config = process.env.KATAGO_CONFIG;
  if (!model || !config) {
    throw new KataGoUnavailable(
      "KataGo no configurat: falten KATAGO_MODEL i/o KATAGO_CONFIG.",
    );
  }

  console.log(`[katago] iniciant: ${bin} analysis -model ${model}`);
  // Limita els fils que fa servir el backend de CPU perquè no saturi el portàtil.
  const proc = spawn(bin, ["analysis", "-model", model, "-config", config], {
    env: { ...process.env, OMP_NUM_THREADS: "2" },
  });

  proc.on("error", (err) => {
    console.error("[katago] no s'ha pogut iniciar:", err.message);
    engine = null;
    for (const p of pending.values())
      p.reject(new KataGoUnavailable("No s'ha pogut iniciar KataGo."));
    pending.clear();
  });

  proc.on("exit", (code) => {
    console.error(`[katago] el procés s'ha aturat (codi ${code}).`);
    engine = null;
    for (const p of pending.values())
      p.reject(new KataGoUnavailable("El procés de KataGo s'ha aturat."));
    pending.clear();
  });

  // Cada línia de stdout és una resposta JSON a una consulta.
  createInterface({ input: proc.stdout }).on("line", (line) => {
    let data: {
      id?: string;
      moveInfos?: {
        move: string;
        order: number;
        winrate: number;
        scoreLead: number;
        pv: string[];
      }[];
    };
    try {
      data = JSON.parse(line);
    } catch {
      return; // línies que no són JSON (poc habitual)
    }
    if (!data.id) return;
    const waiter = pending.get(data.id);
    if (!waiter) return;
    pending.delete(data.id);

    const best = (data.moveInfos || []).find((m) => m.order === 0);
    waiter.resolve(
      best
        ? {
            move: best.move,
            winrate: best.winrate,
            scoreLead: best.scoreLead,
            pv: best.pv || [],
          }
        : { move: "pass", winrate: 0.5, scoreLead: 0, pv: [] },
    );
  });

  return proc;
};

// Demana a KataGo la millor jugada i la seva valoració per a la posició
// descrita. Llança KataGoUnavailable si el motor no està disponible.
export const analyze = (req: AnalyzeRequest): Promise<AnalyzeResult> => {
  if (!engine) engine = start();

  const id = `q${++counter}`;
  const query = {
    id,
    moves: req.moves,
    rules: "chinese",
    komi: req.komi,
    boardXSize: req.size,
    boardYSize: req.size,
    maxVisits: req.maxVisits,
    analyzeTurns: [req.moves.length],
  };

  return new Promise<AnalyzeResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (pending.delete(id)) {
        reject(new KataGoUnavailable("KataGo no ha respost a temps."));
      }
    }, 20000);

    pending.set(id, {
      resolve: (vertex) => {
        clearTimeout(timer);
        resolve(vertex);
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      },
    });

    engine!.stdin.write(JSON.stringify(query) + "\n");
  });
};
