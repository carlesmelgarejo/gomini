// POST /api/hint — retorna la jugada recomanada per KataGo per a la posició
// actual, amb la seva valoració (winrate, punts i seqüència prevista).
//
// Cos: { moves, komi, size, maxVisits }   Resposta: { vertex, winrate, scoreLead, pv }

import { NextResponse } from "next/server";
import { analyze, KataGoUnavailable, KataMove } from "@/server/katago";

export const runtime = "nodejs";

interface Body {
  moves: KataMove[];
  komi: number;
  size: number;
  maxVisits: number;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invàlid" }, { status: 400 });
  }

  const { moves, komi, size, maxVisits } = body;
  if (!Array.isArray(moves) || !size || !maxVisits) {
    return NextResponse.json({ error: "Paràmetres incorrectes" }, { status: 400 });
  }

  try {
    const r = await analyze({ moves, komi, size, maxVisits });
    return NextResponse.json({
      vertex: r.move,
      winrate: r.winrate,
      scoreLead: r.scoreLead,
      pv: r.pv,
    });
  } catch (err) {
    if (err instanceof KataGoUnavailable) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json({ error: "Error del motor" }, { status: 500 });
  }
}
