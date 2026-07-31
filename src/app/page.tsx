"use client";

import GoBoard from "@/components/GoBoard";
import GamePanel from "@/components/GamePanel";
import { useGoGame } from "@/hooks/useGoGame";

export default function Home() {
  const game = useGoGame("black");

  return (
    <main className="page">
      <div className="board-column">
        <div className="captures-bar">
          <div className="capture-chip">
            <span className="dot dot-black" />
            <b>{game.state.captures.black}</b>
            <span>Negres capturen</span>
          </div>
          <div className="capture-chip">
            <span className="dot dot-white" />
            <b>{game.state.captures.white}</b>
            <span>Blanques capturen</span>
          </div>
        </div>
        <div className="board-wrap">
          <GoBoard
            state={game.state}
            isHumanTurn={game.isHumanTurn}
            humanPlayer={game.humanPlayer}
            onPlay={game.playAt}
            hintPoint={game.hint?.point ?? null}
          />
        </div>
        <div className="board-actions">
          <button
            className="btn btn-primary"
            onClick={game.passTurn}
            disabled={!game.isHumanTurn}
          >
            Passar
          </button>
          <button
            className="btn"
            onClick={game.undo}
            disabled={!game.canUndo}
          >
            Desfer
          </button>
        </div>
      </div>
      <GamePanel game={game} />
    </main>
  );
}
