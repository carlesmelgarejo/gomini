// POST /api/move — rep la partida en curs i retorna la jugada de KataGo.
//
// Cos esperat: { moves: [["B","E5"], ...], komi, size, maxVisits }
// Resposta:    { vertex: "E4" | "pass" | "resign" }
// Si KataGo no està disponible, retorna 503 perquè el client pugui recórrer al
// bot de reserva.

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
    const result = await analyze({ moves, komi, size, maxVisits });
    console.log(`[katago] jugada: ${result.move} (visits=${maxVisits})`);
    return NextResponse.json({ vertex: result.move });
  } catch (err) {
    if (err instanceof KataGoUnavailable) {
      console.warn("[katago] no disponible:", err.message);
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("[katago] error:", err);
    return NextResponse.json({ error: "Error del motor" }, { status: 500 });
  }
}
