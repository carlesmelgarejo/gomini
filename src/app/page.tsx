"use client";

import GoBoard from "@/components/GoBoard";
import GamePanel from "@/components/GamePanel";
import MobileGame from "@/components/MobileGame";
import Nigiri from "@/components/Nigiri";
import EyeWarning from "@/components/EyeWarning";
import { useGoGame } from "@/hooks/useGoGame";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const game = useGoGame("black");
  const { t } = useI18n();
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileGame game={game} />;
  }

  return (
    <main className="page">
      <div className="board-column">
        <div className="captures-bar">
          <div className="capture-chip">
            <span className="dot dot-black" />
            <b>{game.captures.black}</b>
            <span>{t("blackCaptures")}</span>
          </div>
          <div className="capture-chip">
            <span className="dot dot-white" />
            <b>{game.captures.white}</b>
            <span>{t("whiteCaptures")}</span>
          </div>
        </div>
        <div className="board-wrap">
          <GoBoard
            state={game.state}
            isHumanTurn={game.isHumanTurn}
            humanPlayer={game.humanPlayer}
            onPlay={game.playAt}
            hintPoint={game.hint?.point ?? null}
            territory={game.territory}
            deadStones={game.deadStones}
            counting={game.isCounting}
            onToggleDead={game.toggleDeadAt}
          />
          <Nigiri game={game} />
          <EyeWarning game={game} />
        </div>
        <div className="board-actions">
          {game.state.ended ? (
            game.isCounting ? (
              <button className="btn btn-primary" onClick={game.finishCounting}>
                {t("finishCounting")}
              </button>
            ) : (
              <button className="btn" onClick={game.resumeCounting}>
                {t("resumeCounting")}
              </button>
            )
          ) : (
            <>
              <button
                className="btn btn-primary"
                onClick={game.passTurn}
                disabled={!game.isHumanTurn}
              >
                {t("pass")}
              </button>
              <button
                className="btn"
                onClick={game.undo}
                disabled={!game.canUndo}
              >
                {t("undo")}
              </button>
            </>
          )}
        </div>
      </div>
      <GamePanel game={game} />
    </main>
  );
}
