"use client";

// Hook que orquestra la partida: estat del tauler, torn de la persona, resposta
// automàtica de la màquina (KataGo, amb reserva a un bot heurístic si el motor
// no està disponible), desfer i compte final. Les regles viuen al motor (lib/go).

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  GameState,
  createGame,
  illegalReason,
  idx,
  play,
  pass,
} from "@/lib/go/board";
import { HeuristicEngine } from "@/lib/go/engine";
import {
  KataGoEngine,
  VISITS,
  Difficulty,
  fetchHint,
  Hint,
} from "@/lib/go/remoteEngine";
import { scoreArea, komiForSize } from "@/lib/go/scoring";
import { Move, Player, Score } from "@/lib/go/types";

const DEFAULT_SIZE = 9;
export const BOARD_SIZES = [7, 9] as const;
// Visits per a la pista. Moderat per no carregar gaire la CPU del portàtil.
const HINT_VISITS = 64;
// Clau on es desa la partida en curs (per continuar després d'un refresc).
const STORAGE_KEY = "go-game-v1";

export type EngineStatus = "checking" | "katago" | "fallback";
export type OpponentMode = "fast" | "katago";

export interface GoGame {
  state: GameState;
  humanPlayer: Player;
  thinking: boolean;
  score: Score | null;
  canUndo: boolean;
  isHumanTurn: boolean;
  size: number;
  difficulty: Difficulty;
  engineStatus: EngineStatus;
  opponentMode: OpponentMode;
  hint: Hint | null;
  hintLoading: boolean;
  setSize: (n: number) => void;
  setDifficulty: (d: Difficulty) => void;
  setOpponentMode: (m: OpponentMode) => void;
  requestHint: () => void;
  playAt: (row: number, col: number) => void;
  passTurn: () => void;
  undo: () => void;
  newGame: () => void;
}

export const useGoGame = (humanPlayer: Player = "black"): GoGame => {
  const [state, setState] = useState<GameState>(() => createGame(DEFAULT_SIZE));
  const [history, setHistory] = useState<GameState[]>([]);
  const [thinking, setThinking] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [engineStatus, setEngineStatus] = useState<EngineStatus>("checking");
  // Per defecte, el bot ràpid: instantani i sense càrrega. KataGo, sota demanda.
  const [opponentMode, setOpponentMode] = useState<OpponentMode>("fast");
  const [hint, setHint] = useState<Hint | null>(null);
  const [hintLoading, setHintLoading] = useState(false);

  // La dificultat es llegeix en viu des del motor de KataGo.
  const difficultyRef = useRef(difficulty);
  difficultyRef.current = difficulty;

  const katago = useMemo(
    () => new KataGoEngine(() => VISITS[difficultyRef.current]),
    [],
  );
  const heuristic = useMemo(() => new HeuristicEngine(), []);

  // Evita disparar dues jugades de la màquina alhora (StrictMode / re-renders).
  const busy = useRef(false);

  const isHumanTurn = state.toMove === humanPlayer && !state.ended;

  const pushHistory = useCallback((prev: GameState) => {
    setHistory((h) => [...h, prev]);
  }, []);

  const playAt = useCallback(
    (row: number, col: number) => {
      if (!isHumanTurn || thinking) return;
      const index = idx(state.size, row, col);
      if (illegalReason(state, index) !== null) return;
      pushHistory(state);
      setState(play(state, index));
    },
    [isHumanTurn, thinking, state, pushHistory],
  );

  const passTurn = useCallback(() => {
    if (!isHumanTurn || thinking) return;
    pushHistory(state);
    setState(pass(state));
  }, [isHumanTurn, thinking, state, pushHistory]);

  const undo = useCallback(() => {
    if (thinking || history.length === 0) return;
    setHistory((h) => {
      const next = [...h];
      let target = next.pop()!;
      while (next.length > 0 && target.toMove !== humanPlayer) {
        target = next.pop()!;
      }
      setState(target);
      return next;
    });
  }, [thinking, history.length, humanPlayer]);

  const newGame = useCallback(() => {
    setHistory([]);
    setState((cur) => createGame(cur.size));
    setThinking(false);
    busy.current = false;
  }, []);

  // Canvia la mida del tauler i comença una partida nova.
  const setSize = useCallback((n: number) => {
    setHistory([]);
    setState(createGame(n));
    setThinking(false);
    busy.current = false;
  }, []);

  // Restaura la partida desada en carregar (es fa en un efecte, no a l'estat
  // inicial, per no trencar la hidratació del servidor).
  const hydrated = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (
          (BOARD_SIZES as readonly number[]).includes(data?.state?.size) &&
          Array.isArray(data.state.grid)
        ) {
          setState(data.state);
          setHistory(Array.isArray(data.history) ? data.history : []);
          if (data.difficulty) setDifficulty(data.difficulty);
          if (data.opponentMode) setOpponentMode(data.opponentMode);
        }
      }
    } catch {
      /* localStorage no disponible o dades corruptes: comença de nou */
    }
    hydrated.current = true;
  }, []);

  // Desa la partida a cada canvi (només després d'haver restaurat).
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ state, history, difficulty, opponentMode }),
      );
    } catch {
      /* si no es pot desar, no passa res */
    }
  }, [state, history, difficulty, opponentMode]);

  // La pista només val per a la posició actual: es neteja a cada canvi d'estat.
  useEffect(() => {
    setHint(null);
  }, [state]);

  const requestHint = useCallback(async () => {
    if (!isHumanTurn || hintLoading) return;
    setHintLoading(true);
    try {
      setHint(await fetchHint(state, HINT_VISITS));
    } catch {
      setHint(null);
    } finally {
      setHintLoading(false);
    }
  }, [isHumanTurn, hintLoading, state]);

  // Només quan es tria KataGo: comprova que està disponible (i l'escalfa).
  // En mode "bot ràpid" no s'arrenca res, així no consumeix CPU ni RAM.
  useEffect(() => {
    if (opponentMode !== "katago") return;
    let active = true;
    setEngineStatus("checking");
    fetch("/api/engine")
      .then((r) => r.json())
      .then((d: { available: boolean }) => {
        if (active) setEngineStatus(d.available ? "katago" : "fallback");
      })
      .catch(() => {
        if (active) setEngineStatus("fallback");
      });
    return () => {
      active = false;
    };
  }, [opponentMode]);

  // Tria la jugada de la màquina segons el mode: bot ràpid o KataGo (amb reserva).
  const selectBotMove = useCallback(
    async (current: GameState): Promise<Move> => {
      if (opponentMode === "fast") return heuristic.selectMove(current);
      try {
        const move = await katago.selectMove(current);
        setEngineStatus("katago");
        return move;
      } catch {
        setEngineStatus("fallback");
        return heuristic.selectMove(current);
      }
    },
    [opponentMode, katago, heuristic],
  );

  // Quan li toca a la màquina, calcula i aplica la seva jugada.
  useEffect(() => {
    const botTurn = state.toMove !== humanPlayer && !state.ended;
    // Si no és el torn de la màquina, assegura que l'indicador "pensant" queda
    // apagat (garanteix que es reinicia quan torna a ser el teu torn).
    if (!botTurn) {
      busy.current = false;
      setThinking(false);
      return;
    }
    if (busy.current) return;

    busy.current = true;
    setThinking(true);
    let cancelled = false;

    (async () => {
      const move = await selectBotMove(state);
      if (cancelled) return;
      busy.current = false;
      setState((cur) => {
        if (move.type === "pass") return pass(cur);
        const index = idx(cur.size, move.point.row, move.point.col);
        if (illegalReason(cur, index) !== null) return pass(cur);
        return play(cur, index);
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [state, humanPlayer, selectBotMove]);

  const score = useMemo<Score | null>(
    () =>
      state.ended
        ? scoreArea(state.grid, state.size, komiForSize(state.size))
        : null,
    [state.ended, state.grid, state.size],
  );

  return {
    state,
    humanPlayer,
    thinking,
    score,
    canUndo: history.length > 0 && !thinking,
    isHumanTurn,
    size: state.size,
    difficulty,
    engineStatus,
    opponentMode,
    hint,
    hintLoading,
    setSize,
    setDifficulty,
    setOpponentMode,
    requestHint,
    playAt,
    passTurn,
    undo,
    newGame,
  };
};
