"use client";

// Tauler de Go 9x9 dibuixat en SVG: fusta amb gra i relleu 3D, línies, punts
// d'estrella (hoshi), pedres glossy amb ombra i lluïssor, previsualització en
// passar el ratolí, marca de l'última jugada i marcador de pista.

import { useState } from "react";
import { GameState, illegalReason, idx, toPoint } from "@/lib/go/board";
import { Player, Point } from "@/lib/go/types";

interface Props {
  state: GameState;
  isHumanTurn: boolean;
  humanPlayer: Player;
  onPlay: (row: number, col: number) => void;
  hintPoint?: Point | null;
  onIllegal?: (reason: string) => void;
}

const VIEW = 560;
const MARGIN = 40;
const INSET = 7; // marc de fusta al voltant de la superfície de joc
const COLS = "ABCDEFGHJ"; // columnes A–J sense la I (com als vèrtexs GTP)

// Punts d'estrella (hoshi) segons la mida: 3a línia de cada vora + centre.
const starPoints = (size: number): [number, number][] => {
  const edge = 2;
  const far = size - 1 - edge;
  const center = (size - 1) / 2;
  const pts: [number, number][] = [];
  for (const r of [edge, far]) for (const c of [edge, far]) pts.push([r, c]);
  if (size % 2 === 1) pts.push([center, center]);
  // Elimina duplicats (per si el centre coincideix amb una cantonada).
  return pts.filter(
    ([r, c], i) => pts.findIndex(([r2, c2]) => r2 === r && c2 === c) === i,
  );
};

export default function GoBoard({
  state,
  isHumanTurn,
  humanPlayer,
  onPlay,
  hintPoint,
  onIllegal,
}: Props) {
  const { size, grid } = state;
  const step = (VIEW - 2 * MARGIN) / (size - 1);
  const [hover, setHover] = useState<number | null>(null);

  const coord = (i: number) => MARGIN + i * step;
  // En taulers petits les caselles són més grans; abaixem una mica el radi.
  const stoneR = step * (size <= 7 ? 0.43 : 0.47);

  const handleClick = (index: number) => {
    if (!isHumanTurn) return;
    const reason = illegalReason(state, index);
    if (reason !== null) {
      onIllegal?.(reason);
      return;
    }
    const { row, col } = toPoint(size, index);
    onPlay(row, col);
  };

  const hoverPlayable =
    hover !== null && isHumanTurn && illegalReason(state, hover) === null;

  const surface = VIEW - 2 * INSET;

  return (
    <svg
      className="go-board"
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      role="img"
      aria-label="Tauler de Go 9 per 9"
    >
      <defs>
        <radialGradient id="woodGrad" cx="34%" cy="28%" r="95%">
          <stop offset="0%" stopColor="var(--wood-1)" />
          <stop offset="55%" stopColor="var(--wood-2)" />
          <stop offset="100%" stopColor="var(--wood-3)" />
        </radialGradient>

        {/* Sheen per donar relleu 3D a la superfície */}
        <linearGradient id="woodBevel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.16)" />
          <stop offset="14%" stopColor="rgba(255,255,255,0)" />
          <stop offset="86%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.18)" />
        </linearGradient>

        {/* Gra de la fusta: soroll anisòtrop (línies horitzontals) */}
        <filter id="woodGrain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.011 0.07"
            numOctaves="5"
            seed="14"
            stitchTiles="stitch"
            result="n"
          />
          <feColorMatrix in="n" type="saturate" values="0" />
        </filter>

        {/* Pedra negra (pissarra mat): dom central subtil, sense taca brillant */}
        <radialGradient id="blackStone" cx="50%" cy="44%" r="72%">
          <stop offset="0%" stopColor="#43434a" />
          <stop offset="55%" stopColor="#262629" />
          <stop offset="100%" stopColor="#101013" />
        </radialGradient>
        {/* Pedra blanca (petxina): to càlid i vora subtil */}
        <radialGradient id="whiteStone" cx="34%" cy="26%" r="86%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="48%" stopColor="#f6f3ea" />
          <stop offset="82%" stopColor="#e6e1d3" />
          <stop offset="100%" stopColor="#c4bfae" />
        </radialGradient>

        {/* Reflex de rebot a la part inferior (dona volum) */}
        <radialGradient id="blackRim" cx="50%" cy="78%" r="45%">
          <stop offset="0%" stopColor="rgba(150,160,180,0.5)" />
          <stop offset="100%" stopColor="rgba(150,160,180,0)" />
        </radialGradient>
        <radialGradient id="whiteRim" cx="50%" cy="80%" r="45%">
          <stop offset="0%" stopColor="rgba(120,100,60,0.28)" />
          <stop offset="100%" stopColor="rgba(120,100,60,0)" />
        </radialGradient>

        {/* Lluïssor especular ampla */}
        <radialGradient id="stoneGloss" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.92)" />
          <stop offset="55%" stopColor="rgba(255,255,255,0.14)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>

        {/* Textura fina de gra, renderitzada un cop i reutilitzada com a patró */}
        <filter id="stoneNoise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.45"
            numOctaves="4"
            seed="7"
            result="n"
          />
          <feColorMatrix in="n" type="saturate" values="0" />
        </filter>
        <pattern
          id="stoneTex"
          width="64"
          height="64"
          patternUnits="userSpaceOnUse"
        >
          <rect width="64" height="64" filter="url(#stoneNoise)" />
        </pattern>

        <filter id="stoneShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="2.6" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Marc de fusta (dona gruix i relleu) */}
      <rect x="0" y="0" width={VIEW} height={VIEW} rx="16" fill="var(--wood-frame)" />

      {/* Superfície de joc */}
      <rect
        x={INSET}
        y={INSET}
        width={surface}
        height={surface}
        rx="10"
        fill="url(#woodGrad)"
      />
      <rect
        x={INSET}
        y={INSET}
        width={surface}
        height={surface}
        rx="10"
        filter="url(#woodGrain)"
        opacity="0.14"
        style={{ mixBlendMode: "overlay" }}
      />
      <rect
        x={INSET}
        y={INSET}
        width={surface}
        height={surface}
        rx="10"
        fill="url(#woodBevel)"
      />

      {/* Línies de la graella */}
      <g stroke="var(--board-line)" strokeWidth="1.4" strokeLinecap="round">
        {Array.from({ length: size }, (_, i) => (
          <line
            key={`h${i}`}
            x1={coord(0)}
            y1={coord(i)}
            x2={coord(size - 1)}
            y2={coord(i)}
          />
        ))}
        {Array.from({ length: size }, (_, i) => (
          <line
            key={`v${i}`}
            x1={coord(i)}
            y1={coord(0)}
            x2={coord(i)}
            y2={coord(size - 1)}
          />
        ))}
      </g>

      {/* Punts d'estrella */}
      <g fill="var(--board-line)">
        {starPoints(size).map(([row, col]) => (
          <circle
            key={`s${row}-${col}`}
            cx={coord(col)}
            cy={coord(row)}
            r={3.6}
          />
        ))}
      </g>

      {/* Coordenades: lletres a dalt/baix, números a esquerra/dreta */}
      <g
        fill="var(--board-line)"
        opacity={0.6}
        fontSize={13}
        fontWeight={600}
        textAnchor="middle"
        style={{ pointerEvents: "none" }}
      >
        {Array.from({ length: size }, (_, c) => (
          <g key={`c${c}`}>
            <text x={coord(c)} y={INSET + 17}>{COLS[c]}</text>
            <text x={coord(c)} y={VIEW - INSET - 8}>{COLS[c]}</text>
          </g>
        ))}
        {Array.from({ length: size }, (_, r) => {
          const num = size - r;
          return (
            <g key={`r${r}`}>
              <text x={INSET + 15} y={coord(r)} dominantBaseline="central">
                {num}
              </text>
              <text x={VIEW - INSET - 15} y={coord(r)} dominantBaseline="central">
                {num}
              </text>
            </g>
          );
        })}
      </g>

      {/* Pedres i zones interactives */}
      {grid.map((cell, i) => {
        const { row, col } = toPoint(size, i);
        const cx = coord(col);
        const cy = coord(row);
        const isLast = state.lastMove === i;
        return (
          <g key={i}>
            {cell && (
              <>
                {/* Cos de la pedra */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={stoneR}
                  fill={cell === "black" ? "url(#blackStone)" : "url(#whiteStone)"}
                  stroke={cell === "white" ? "#b7b4aa" : "#000"}
                  strokeWidth={cell === "white" ? 0.8 : 0.4}
                  filter="url(#stoneShadow)"
                />
                {/* Textura de gra */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={stoneR}
                  fill="url(#stoneTex)"
                  opacity={cell === "black" ? 0.3 : 0.2}
                  style={{ mixBlendMode: "overlay" }}
                  pointerEvents="none"
                />
                {/* Reflex de rebot a la part baixa */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={stoneR}
                  fill={cell === "black" ? "url(#blackRim)" : "url(#whiteRim)"}
                  pointerEvents="none"
                />
                {/* Lluïssor especular ampla (difusa a les negres, sense taca rodona) */}
                <ellipse
                  cx={cx - stoneR * 0.26}
                  cy={cy - stoneR * 0.34}
                  rx={stoneR * 0.6}
                  ry={stoneR * 0.46}
                  fill="url(#stoneGloss)"
                  opacity={cell === "black" ? 0 : 0.9}
                  pointerEvents="none"
                />
                {/* Punt de llum nítid: només a les blanques (a les negres cantava) */}
                {cell === "white" && (
                  <ellipse
                    cx={cx - stoneR * 0.34}
                    cy={cy - stoneR * 0.42}
                    rx={stoneR * 0.18}
                    ry={stoneR * 0.13}
                    fill="#ffffff"
                    opacity={0.85}
                    pointerEvents="none"
                  />
                )}
                {isLast && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={stoneR * 0.34}
                    fill="none"
                    stroke={cell === "black" ? "#f4f4f4" : "#2a2a2a"}
                    strokeWidth={2}
                  />
                )}
              </>
            )}

            {hover === i && hoverPlayable && !cell && (
              <circle
                cx={cx}
                cy={cy}
                r={stoneR}
                fill={humanPlayer === "black" ? "#111" : "#fafafa"}
                opacity={0.4}
              />
            )}

            {/* Zona clicable ampla */}
            <rect
              x={cx - step / 2}
              y={cy - step / 2}
              width={step}
              height={step}
              fill="transparent"
              style={{ cursor: isHumanTurn && !cell ? "pointer" : "default" }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((h) => (h === i ? null : h))}
              onClick={() => handleClick(i)}
            />
          </g>
        );
      })}

      {/* Marcador de pista (a sobre de tot perquè sempre es vegi) */}
      {hintPoint && (
        <g pointerEvents="none">
          <circle
            cx={coord(hintPoint.col)}
            cy={coord(hintPoint.row)}
            r={stoneR * 0.94}
            fill="rgba(86,214,125,0.18)"
            stroke="#16150f"
            strokeWidth={5}
            opacity={0.55}
          />
          <circle
            cx={coord(hintPoint.col)}
            cy={coord(hintPoint.row)}
            r={stoneR * 0.94}
            fill="none"
            stroke="#3ddc74"
            strokeWidth={3.5}
            className="hint-marker"
          />
        </g>
      )}
    </svg>
  );
}
