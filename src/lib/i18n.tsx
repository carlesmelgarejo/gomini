"use client";

// i18n mínim, sense dependències: diccionari per idioma, context i hook useI18n.
// L'idioma es desa a localStorage. t("clau.punt", {var}) resol rutes amb punts
// i substitueix {var} pels valors passats.

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Lang = "ca" | "es" | "en";
export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "ca", label: "Català", short: "CA" },
  { code: "es", label: "Castellano", short: "ES" },
  { code: "en", label: "English", short: "EN" },
];

const STORAGE_KEY = "go-lang";

type Dict = Record<string, unknown>;

const dict: Record<Lang, Dict> = {
  ca: {
    subtitle: "Tu ({color}) contra la màquina",
    black: "Negres",
    white: "Blanques",
    learn: "Aprendre a jugar",
    board: "Tauler",
    opponent: "Oponent",
    fastBot: "Bot ràpid",
    tipFast:
      "Oponent senzill integrat a l'app: respon a l'instant i no consumeix recursos. Nivell principiant.",
    tipKata:
      "Motor de Go professional (IA). Juga molt fort, amb dificultat ajustable. S'engega sota demanda.",
    playingWith: "Jugant amb",
    badgeFast: "Bot ràpid (instantani)",
    badgeChecking: "Comprovant KataGo…",
    badgeKatago: "KataGo (motor de Go)",
    badgeFallback: "Bot heurístic (reserva)",
    difficultyKatago: "Dificultat (KataGo)",
    easy: "Fàcil",
    medium: "Mitjà",
    hard: "Difícil",
    turnYou: "És el teu torn",
    turnBot: "Torn de la màquina",
    ended: "Partida acabada",
    thinking: "La màquina està pensant…",
    thinkingShort: "Pensant…",
    resultTitle: "Fi de la partida",
    resultWinner: "Guanyen les {color}",
    resultDetail: "Negres {black} · Blanques {white} (komi {komi})",
    margin: "Marge: {margin} punts",
    pass: "Passar",
    hint: "Pista",
    hintThinking: "Pensant la pista…",
    undo: "Desfer",
    newGame: "Nova partida",
    hintNote: "Dues passades seguides acaben la partida i es compta el territori.",
    recommended: "Jugada recomanada",
    onBoardGreen: "verd al tauler",
    win: "Guanyar",
    leadPlus: "vas +{n} punts",
    leadMinus: "vas {n} punts",
    sequence: "Seqüència prevista",
    blackCaptures: "Negres capturen",
    whiteCaptures: "Blanques capturen",
    tutBack: "Tornar al joc",
    tutProgress: "Lliçó {n} de {total}",
    tutTask: "La teva tasca",
    tutPrev: "Anterior",
    tutRetry: "Reintentar",
    tutNext: "Següent →",
    tutSkip: "Ometre →",
    reasonOccupied: "Aquí ja hi ha una pedra.",
    reasonKo: "Prohibit pel ko: no pots recapturar de seguida.",
    reasonSuicide: "Això seria suïcidi: la teva pedra quedaria sense llibertats.",
    reasonOther: "Aquesta jugada no és possible aquí.",
    wrongDefault: "Aquesta no és la jugada. Torna-ho a provar.",
  },
  es: {
    subtitle: "Tú ({color}) contra la máquina",
    black: "Negras",
    white: "Blancas",
    learn: "Aprender a jugar",
    board: "Tablero",
    opponent: "Oponente",
    fastBot: "Bot rápido",
    tipFast:
      "Oponente sencillo integrado en la app: responde al instante y no consume recursos. Nivel principiante.",
    tipKata:
      "Motor de Go profesional (IA). Juega muy fuerte, con dificultad ajustable. Se inicia bajo demanda.",
    playingWith: "Jugando con",
    badgeFast: "Bot rápido (instantáneo)",
    badgeChecking: "Comprobando KataGo…",
    badgeKatago: "KataGo (motor de Go)",
    badgeFallback: "Bot heurístico (reserva)",
    difficultyKatago: "Dificultad (KataGo)",
    easy: "Fácil",
    medium: "Medio",
    hard: "Difícil",
    turnYou: "Es tu turno",
    turnBot: "Turno de la máquina",
    ended: "Partida terminada",
    thinking: "La máquina está pensando…",
    thinkingShort: "Pensando…",
    resultTitle: "Fin de la partida",
    resultWinner: "Ganan las {color}",
    resultDetail: "Negras {black} · Blancas {white} (komi {komi})",
    margin: "Margen: {margin} puntos",
    pass: "Pasar",
    hint: "Pista",
    hintThinking: "Pensando la pista…",
    undo: "Deshacer",
    newGame: "Nueva partida",
    hintNote: "Dos pases seguidos terminan la partida y se cuenta el territorio.",
    recommended: "Jugada recomendada",
    onBoardGreen: "verde en el tablero",
    win: "Ganar",
    leadPlus: "vas +{n} puntos",
    leadMinus: "vas {n} puntos",
    sequence: "Secuencia prevista",
    blackCaptures: "Negras capturan",
    whiteCaptures: "Blancas capturan",
    tutBack: "Volver al juego",
    tutProgress: "Lección {n} de {total}",
    tutTask: "Tu tarea",
    tutPrev: "Anterior",
    tutRetry: "Reintentar",
    tutNext: "Siguiente →",
    tutSkip: "Omitir →",
    reasonOccupied: "Aquí ya hay una piedra.",
    reasonKo: "Prohibido por el ko: no puedes recapturar de inmediato.",
    reasonSuicide: "Esto sería suicidio: tu piedra quedaría sin libertades.",
    reasonOther: "Esta jugada no es posible aquí.",
    wrongDefault: "Esta no es la jugada. Inténtalo de nuevo.",
  },
  en: {
    subtitle: "You ({color}) vs the machine",
    black: "Black",
    white: "White",
    learn: "Learn to play",
    board: "Board",
    opponent: "Opponent",
    fastBot: "Fast bot",
    tipFast:
      "Simple built-in opponent: replies instantly and uses no resources. Beginner level.",
    tipKata:
      "Professional Go engine (AI). Plays very strongly, with adjustable difficulty. Starts on demand.",
    playingWith: "Playing against",
    badgeFast: "Fast bot (instant)",
    badgeChecking: "Checking KataGo…",
    badgeKatago: "KataGo (Go engine)",
    badgeFallback: "Heuristic bot (fallback)",
    difficultyKatago: "Difficulty (KataGo)",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    turnYou: "Your turn",
    turnBot: "Machine's turn",
    ended: "Game over",
    thinking: "The machine is thinking…",
    thinkingShort: "Thinking…",
    resultTitle: "Game over",
    resultWinner: "{color} wins",
    resultDetail: "Black {black} · White {white} (komi {komi})",
    margin: "Margin: {margin} points",
    pass: "Pass",
    hint: "Hint",
    hintThinking: "Thinking hint…",
    undo: "Undo",
    newGame: "New game",
    hintNote: "Two passes in a row end the game and the territory is counted.",
    recommended: "Recommended move",
    onBoardGreen: "green on the board",
    win: "Win",
    leadPlus: "you're +{n} points",
    leadMinus: "you're {n} points",
    sequence: "Expected sequence",
    blackCaptures: "Black captured",
    whiteCaptures: "White captured",
    tutBack: "Back to game",
    tutProgress: "Lesson {n} of {total}",
    tutTask: "Your task",
    tutPrev: "Previous",
    tutRetry: "Retry",
    tutNext: "Next →",
    tutSkip: "Skip →",
    reasonOccupied: "There's already a stone here.",
    reasonKo: "Forbidden by ko: you can't recapture immediately.",
    reasonSuicide: "That would be suicide: your stone would have no liberties.",
    reasonOther: "That move isn't possible here.",
    wrongDefault: "That's not the move. Try again.",
  },
};

const interpolate = (text: string, vars?: Record<string, string | number>) =>
  vars
    ? text.replace(/\{(\w+)\}/g, (_, k) =>
        vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
      )
    : text;

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ca");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Lang | null;
      if (saved && dict[saved]) setLangState(saved);
    } catch {
      /* localStorage no disponible */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* res */
    }
    document.documentElement.lang = l;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const value = (dict[lang][key] ?? dict.ca[key] ?? key) as string;
      return interpolate(value, vars);
    },
    [lang],
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n s'ha d'usar dins d'I18nProvider");
  return ctx;
}
