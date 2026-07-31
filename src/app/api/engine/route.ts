// GET /api/engine — comprova si KataGo està disponible fent una anàlisi mínima.
// L'app ho crida en carregar per mostrar quin motor jugarà. De passada, això
// arrenca i "escalfa" el procés de KataGo.

import { NextResponse } from "next/server";
import { analyze, KataGoUnavailable } from "@/server/katago";

export const runtime = "nodejs";

export async function GET() {
  try {
    await analyze({ moves: [], komi: 7, size: 9, maxVisits: 2 });
    return NextResponse.json({ available: true });
  } catch (err) {
    const reason = err instanceof KataGoUnavailable ? err.message : "error";
    return NextResponse.json({ available: false, reason });
  }
}
