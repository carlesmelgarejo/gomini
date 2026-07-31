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
  groupAt,
  isEye,
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
import {
  scoreAreaWithDead,
  computeTerritory,
  komiForSize,
} from "@/lib/go/scoring";
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
  // Avís abans de jugar dins d'un ull propi.
  pendingEye: { row: number; col: number } | null;
  confirmEyeMove: () => void;
  cancelEyeMove: () => void;
  // Mode auto: el motor juga tots dos colors (Negres i Blanques).
  autoPlay: boolean;
  toggleAuto: () => void;
  // Nigiri.
  nigiriEnabled: boolean;
  setNigiriEnabled: (v: boolean) => void;
  nigiriActive: boolean;
  nigiriGuess: 1 | 2;
  nigiriRevealed: boolean;
  machineStones: number;
  nigiriToggleGuess: () => void;
  nigiriReveal: () => void;
  nigiriStart: () => void;
  // Fase de recompte (final de partida): marcar pedres mortes i comptar territori.
  isCounting: boolean;
  resultConfirmed: boolean;
  deadStones: ReadonlySet<number>;
  territory: (Player | null)[] | null;
  captures: { black: number; white: number };
  setSize: (n: number) => void;
  setDifficulty: (d: Difficulty) => void;
  setOpponentMode: (m: OpponentMode) => void;
  requestHint: () => void;
  playAt: (row: number, col: number) => void;
  passTurn: () => void;
  toggleDeadAt: (row: number, col: number) => void;
  finishCounting: () => void;
  resumeCounting: () => void;
  undo: () => void;
  newGame: () => void;
}

export const useGoGame = (initialHuman: Player = "black"): GoGame => {
  const [humanPlayer, setHumanPlayer] = useState<Player>(initialHuman);
  const [state, setState] = useState<GameState>(() => createGame(DEFAULT_SIZE));
  const [history, setHistory] = useState<GameState[]>([]);
  const [thinking, setThinking] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [engineStatus, setEngineStatus] = useState<EngineStatus>("checking");
  // Per defecte, el bot ràpid: instantani i sense càrrega. KataGo, sota demanda.
  const [opponentMode, setOpponentMode] = useState<OpponentMode>("fast");
  const [hint, setHint] = useState<Hint | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  // Mode auto: el motor juga tots dos colors.
  const [autoPlay, setAutoPlay] = useState(false);
  // Jugada dins d'un ull propi pendent de confirmació (avís).
  const [pendingEye, setPendingEye] = useState<{ row: number; col: number } | null>(
    null,
  );
  // Nigiri: cerimònia per triar colors a l'inici (si està activat als ajustos).
  const [nigiriEnabled, setNigiriEnabledRaw] = useState(false);
  const [nigiriActive, setNigiriActive] = useState(false);
  const [nigiriGuess, setNigiriGuess] = useState<1 | 2>(1); // 1 = senar, 2 = parell
  const [nigiriRevealed, setNigiriRevealed] = useState(false);
  const [machineStones, setMachineStones] = useState(0);
  // Pedres marcades com a mortes durant el recompte (índexs a la graella).
  const [deadStones, setDeadStones] = useState<Set<number>>(() => new Set());
  // El resultat s'ha confirmat (s'ha finalitzat el recompte).
  const [resultConfirmed, setResultConfirmed] = useState(false);

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

  const isHumanTurn =
    !autoPlay &&
    !nigiriActive &&
    state.toMove === humanPlayer &&
    !state.ended;

  const toggleAuto = useCallback(() => setAutoPlay((v) => !v), []);

  const pushHistory = useCallback((prev: GameState) => {
    setHistory((h) => [...h, prev]);
  }, []);

  const playAt = useCallback(
    (row: number, col: number) => {
      if (!isHumanTurn || thinking || nigiriActive) return;
      const index = idx(state.size, row, col);
      if (illegalReason(state, index) !== null) return;
      // Avís abans de jugar dins d'un ull propi (sol ser una mala jugada).
      if (isEye(state.grid, state.size, index, humanPlayer)) {
        setPendingEye({ row, col });
        return;
      }
      pushHistory(state);
      setState(play(state, index));
    },
    [isHumanTurn, thinking, nigiriActive, humanPlayer, state, pushHistory],
  );

  const confirmEyeMove = useCallback(() => {
    if (!pendingEye) return;
    const index = idx(state.size, pendingEye.row, pendingEye.col);
    setPendingEye(null);
    if (illegalReason(state, index) !== null) return;
    pushHistory(state);
    setState(play(state, index));
  }, [pendingEye, state, pushHistory]);

  const cancelEyeMove = useCallback(() => setPendingEye(null), []);

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

  const resetCounting = useCallback(() => {
    setDeadStones(new Set());
    setResultConfirmed(false);
  }, []);

  // Inicia la cerimònia del nigiri: la màquina "agafa" un grapat amagat.
  const startNigiri = useCallback(() => {
    setMachineStones(Math.floor(Math.random() * 12) + 1);
    setNigiriGuess(1);
    setNigiriRevealed(false);
    setNigiriActive(true);
    setHumanPlayer("black");
  }, []);

  const newGame = useCallback(() => {
    setHistory([]);
    setState((cur) => createGame(cur.size));
    setThinking(false);
    busy.current = false;
    resetCounting();
    if (nigiriEnabled) startNigiri();
    else setHumanPlayer("black");
  }, [resetCounting, nigiriEnabled, startNigiri]);

  // Canvia la mida del tauler i comença una partida nova.
  const setSize = useCallback(
    (n: number) => {
      setHistory([]);
      setState(createGame(n));
      setThinking(false);
      busy.current = false;
      resetCounting();
      if (nigiriEnabled) startNigiri();
      else setHumanPlayer("black");
    },
    [resetCounting, nigiriEnabled, startNigiri],
  );

  const nigiriToggleGuess = useCallback(() => {
    setNigiriGuess((g) => (g === 1 ? 2 : 1));
  }, []);

  const nigiriReveal = useCallback(() => {
    setNigiriRevealed(true);
    const guessedOdd = nigiriGuess === 1;
    const correct = (machineStones % 2 === 1) === guessedOdd;
    setHumanPlayer(correct ? "black" : "white");
  }, [nigiriGuess, machineStones]);

  const nigiriStart = useCallback(() => setNigiriActive(false), []);

  // En desactivar el nigiri, tanca la cerimònia en curs i torna al mode normal.
  const setNigiriEnabled = useCallback((v: boolean) => {
    setNigiriEnabledRaw(v);
    if (!v) {
      setNigiriActive(false);
      setNigiriRevealed(false);
      setHumanPlayer("black");
    }
  }, []);

  // Marca (o revifa) el grup de pedres tocat com a mort. Només durant el recompte.
  const toggleDeadAt = useCallback(
    (row: number, col: number) => {
      if (!state.ended || resultConfirmed) return;
      const index = idx(state.size, row, col);
      const group = groupAt(state.grid, state.size, index);
      if (group.stones.length === 0) return;
      setDeadStones((prev) => {
        const next = new Set(prev);
        const anyDead = group.stones.some((s) => next.has(s));
        for (const s of group.stones) {
          if (anyDead) next.delete(s);
          else next.add(s);
        }
        return next;
      });
    },
    [state.ended, state.grid, state.size, resultConfirmed],
  );

  const finishCounting = useCallback(() => setResultConfirmed(true), []);
  const resumeCounting = useCallback(() => setResultConfirmed(false), []);

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
          if (data.humanPlayer === "black" || data.humanPlayer === "white") {
            setHumanPlayer(data.humanPlayer);
          }
          if (typeof data.nigiriEnabled === "boolean") {
            setNigiriEnabledRaw(data.nigiriEnabled);
          }
          if (Array.isArray(data.deadStones)) {
            setDeadStones(new Set<number>(data.deadStones));
          }
          if (typeof data.resultConfirmed === "boolean") {
            setResultConfirmed(data.resultConfirmed);
          }
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
        JSON.stringify({
          state,
          history,
          difficulty,
          opponentMode,
          humanPlayer,
          nigiriEnabled,
          deadStones: [...deadStones],
          resultConfirmed,
        }),
      );
    } catch {
      /* si no es pot desar, no passa res */
    }
  }, [
    state,
    history,
    difficulty,
    opponentMode,
    humanPlayer,
    nigiriEnabled,
    deadStones,
    resultConfirmed,
  ]);

  // Si la partida deixa d'estar acabada (p. ex. en desfer), surt del recompte.
  useEffect(() => {
    if (!state.ended) resetCounting();
  }, [state.ended, resetCounting]);

  // La pista i l'avís d'ull només valen per a la posició actual: es netegen a
  // cada canvi d'estat.
  useEffect(() => {
    setHint(null);
    setPendingEye(null);
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

  // Quan li toca a la màquina (o en mode auto, per als dos colors), calcula i
  // aplica la seva jugada.
  useEffect(() => {
    const botTurn =
      !state.ended &&
      !nigiriActive &&
      (autoPlay || state.toMove !== humanPlayer);
    // Si no toca moure la màquina, assegura que l'indicador "pensant" queda
    // apagat (es reinicia quan torna a ser el teu torn).
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
      // En mode auto, un retard perquè les jugades siguin fàcils de seguir.
      if (autoPlay) await new Promise((r) => setTimeout(r, 3500));
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
  }, [state, humanPlayer, selectBotMove, autoPlay, nigiriActive]);

  const score = useMemo<Score | null>(
    () =>
      state.ended
        ? scoreAreaWithDead(
            state.grid,
            state.size,
            komiForSize(state.size),
            deadStones,
          )
        : null,
    [state.ended, state.grid, state.size, deadStones],
  );

  // Mapa de territori, només durant la fase de recompte / partida acabada.
  const territory = useMemo<(Player | null)[] | null>(
    () =>
      state.ended
        ? computeTerritory(state.grid, state.size, deadStones)
        : null,
    [state.ended, state.grid, state.size, deadStones],
  );

  // Captures visibles: les del joc més les pedres mortes (compten per al rival).
  const captures = useMemo(() => {
    const total = { ...state.captures };
    for (const i of deadStones) {
      const color = state.grid[i];
      if (color === "black") total.white += 1;
      else if (color === "white") total.black += 1;
    }
    return total;
  }, [state.captures, state.grid, deadStones]);

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
    pendingEye,
    confirmEyeMove,
    cancelEyeMove,
    autoPlay,
    toggleAuto,
    nigiriEnabled,
    setNigiriEnabled,
    nigiriActive,
    nigiriGuess,
    nigiriRevealed,
    machineStones,
    nigiriToggleGuess,
    nigiriReveal,
    nigiriStart,
    isCounting: state.ended && !resultConfirmed,
    resultConfirmed,
    deadStones,
    territory,
    captures,
    setSize,
    setDifficulty,
    setOpponentMode,
    requestHint,
    playAt,
    passTurn,
    toggleDeadAt,
    finishCounting,
    resumeCounting,
    undo,
    newGame,
  };
};
