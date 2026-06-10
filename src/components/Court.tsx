import { useLayoutEffect, useRef, useState } from 'react';
import { DndContext, useDraggable, type DragEndEvent } from '@dnd-kit/core';
import type { Player } from '../models/Player';
import CanvasOverlay, { type Stroke } from './CanvasOverlay';

// ─── Constants ───────────────────────────────────────────────────────────────

export const COURT_LOCAL_W = 900;
export const COURT_LOCAL_H = 900;

const RENDER_W = 340;
const RENDER_HALF_H = 340;
const RENDER_FULL_H = RENDER_HALF_H * 2;
const TOKEN_RATIO = 0.12;
// Token wrapper uses scale(RENDER_W / LOCAL_W); compensate so text renders at target screen px
const SCREEN_TEXT_SCALE = COURT_LOCAL_W / RENDER_W;
const CIRCLE_FONT_SCREEN = 14;
const PILL_FONT_SCREEN = 8;
const PILL_OFFSET_SCREEN = 18;

// ─── Types ───────────────────────────────────────────────────────────────────

export type Props = {
  homePlayers: Player[];
  awayPlayers: Player[];
  homeColor: string;
  awayColor: string;
  setHomePlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  setAwayPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  homeViolatingIds?: string[];
  awayViolatingIds?: string[];
  strokes: Stroke[];
  setStrokes: (strokes: Stroke[]) => void;
  currentTool: 'none' | 'pen' | 'highlight' | 'eraser';
  homeVisible: boolean;
  awayVisible: boolean;
};

// ─── Coordinate mapping ───────────────────────────────────────────────────────
//
// Each team keeps coords in the 900×900 local space so existing logic is intact.
// Render mapping scales local coords to the current render area (half or full):
//   Home (not mirrored): render_x = (x / LOCAL_W) * renderW, render_y = (y / LOCAL_H) * renderH
//   Away (mirrored):     render_x = ((LOCAL_W - x) / LOCAL_W) * renderW,
//                        render_y = ((LOCAL_H - y) / LOCAL_H) * renderH

function mapLocalToRender(
  x: number,
  y: number,
  mirrored: boolean,
  renderW: number,
  renderH: number
) {
  const rx = mirrored
    ? ((COURT_LOCAL_W - x) / COURT_LOCAL_W) * renderW
    : (x / COURT_LOCAL_W) * renderW;
  const ry = mirrored
    ? ((COURT_LOCAL_H - y) / COURT_LOCAL_H) * renderH
    : (y / COURT_LOCAL_H) * renderH;
  return { rx, ry };
}

// ─── Fit-to-circle label ─────────────────────────────────────────────────────

function FitCircleText({ text, maxFontSize }: { text: string; maxFontSize: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const el = textRef.current;
    if (!container || !el) return;

    const minFontSize = Math.round(8 * SCREEN_TEXT_SCALE);
    let size = maxFontSize;
    const maxWidth = container.clientWidth * 0.82;
    const maxHeight = container.clientHeight * 0.82;

    el.style.fontSize = `${size}px`;
    while (size > minFontSize && (el.scrollWidth > maxWidth || el.scrollHeight > maxHeight)) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
    setFontSize(size);
  }, [text, maxFontSize]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center px-1 pointer-events-none"
    >
      <span
        ref={textRef}
        className="text-white font-bold leading-tight text-center"
        style={{ fontSize }}
      >
        {text}
      </span>
    </div>
  );
}

// ─── Draggable token ─────────────────────────────────────────────────────────

type TokenProps = {
  player: Player;
  teamColor: string;
  isViolating: boolean;
  mirrored: boolean;
  renderH: number;
  tokenScale: number;
};

function DraggablePlayer({
  player,
  teamColor,
  isViolating,
  mirrored,
  renderH,
  tokenScale,
}: TokenProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: player.id,
  });

  const scaleX = RENDER_W / COURT_LOCAL_W;
  const { rx: baseX, ry: baseY } = mapLocalToRender(
    player.x,
    player.y,
    mirrored,
    RENDER_W,
    renderH
  );

  const liveDx = transform ? transform.x : 0;
  const liveDy = transform ? transform.y : 0;

  const tokenSize = COURT_LOCAL_W * TOKEN_RATIO * tokenScale;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: baseX + liveDx,
    top: baseY + liveDy,
    transform: `translate(-50%, -50%) scale(${scaleX})`,
    transformOrigin: 'center',
    width: tokenSize,
    height: tokenSize,
    zIndex: 10,
  };

  const circleText = player.name || player.label;

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      <div
        className={`player-token w-full h-full rounded-full border-2 border-white shadow-xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing relative
          ${isViolating ? 'ring-4 ring-[#ef4444] animate-pulse' : ''}`}
        style={{ backgroundColor: teamColor }}
      >
        <FitCircleText
          text={circleText}
          maxFontSize={CIRCLE_FONT_SCREEN * SCREEN_TEXT_SCALE}
        />
      </div>
      {player.label && (
        <span
          className="absolute left-1/2 text-white font-bold px-1 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none"
          style={{
            fontSize: PILL_FONT_SCREEN * SCREEN_TEXT_SCALE,
            bottom: -PILL_OFFSET_SCREEN * SCREEN_TEXT_SCALE,
            transform: 'translateX(-50%)',
            backgroundColor: '#0b1c30',
          }}
        >
          {player.label}
        </span>
      )}
    </div>
  );
}

// ─── Main Court ───────────────────────────────────────────────────────────────

export default function Court({
  homePlayers,
  awayPlayers,
  homeColor,
  awayColor,
  setHomePlayers,
  setAwayPlayers,
  homeViolatingIds = [],
  awayViolatingIds = [],
  strokes,
  setStrokes,
  currentTool,
  homeVisible,
  awayVisible,
}: Props) {
  const bothVisible = homeVisible && awayVisible;
  const renderH = bothVisible ? RENDER_HALF_H : RENDER_FULL_H;
  const courtHeight = bothVisible ? RENDER_FULL_H + 4 : RENDER_FULL_H;
  const tokenScale = bothVisible ? 1 : 2;

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta, active } = event;
    const id = active.id as string;

    const scaleX = COURT_LOCAL_W / RENDER_W;
    const scaleY = COURT_LOCAL_H / renderH;

    if (homePlayers.some((p) => p.id === id)) {
      setHomePlayers((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                x: Math.max(0, Math.min(COURT_LOCAL_W, p.x + delta.x * scaleX)),
                y: Math.max(0, Math.min(COURT_LOCAL_H, p.y + delta.y * scaleY)),
              }
            : p
        )
      );
    } else if (awayPlayers.some((p) => p.id === id)) {
      setAwayPlayers((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                x: Math.max(0, Math.min(COURT_LOCAL_W, p.x - delta.x * scaleX)),
                y: Math.max(0, Math.min(COURT_LOCAL_H, p.y - delta.y * scaleY)),
              }
            : p
        )
      );
    }
  };

  const isDrawing = currentTool !== 'none';

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        className="relative rounded-xl shadow-2xl overflow-visible border-4 border-white flex flex-col shrink-0"
        style={{ width: RENDER_W, height: courtHeight }}
      >
        {awayVisible && (
          <div
            className="court-gradient relative overflow-hidden"
            style={{ width: RENDER_W, height: renderH }}
          >
            <div className="absolute top-[60%] left-0 w-full h-[2px] bg-white/40" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-white/10 font-black uppercase tracking-widest text-5xl">
                AWAY
              </span>
            </div>
            {awayPlayers.map((player) => (
              <DraggablePlayer
                key={player.id}
                player={player}
                teamColor={awayColor}
                isViolating={awayViolatingIds.includes(player.id)}
                mirrored={true}
                renderH={renderH}
                tokenScale={tokenScale}
              />
            ))}
          </div>
        )}

        {bothVisible && (
          <div className="h-1 bg-white z-20 shrink-0" style={{ width: RENDER_W }} />
        )}

        {homeVisible && (
          <div
            className="court-gradient relative overflow-hidden"
            style={{ width: RENDER_W, height: renderH }}
          >
            <div className="absolute bottom-[60%] left-0 w-full h-[2px] bg-white/40" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className="text-white/10 font-black uppercase tracking-widest text-5xl">
                HOME
              </span>
            </div>
            {homePlayers.map((player) => (
              <DraggablePlayer
                key={player.id}
                player={player}
                teamColor={homeColor}
                isViolating={homeViolatingIds.includes(player.id)}
                mirrored={false}
                renderH={renderH}
                tokenScale={tokenScale}
              />
            ))}
          </div>
        )}

        <div
          className={`absolute inset-0 z-30 ${isDrawing ? '' : 'pointer-events-none'}`}
          style={{ width: RENDER_W, height: courtHeight }}
        >
          <CanvasOverlay
            strokes={strokes}
            setStrokes={setStrokes}
            currentTool={currentTool}
          />
        </div>
      </div>
    </DndContext>
  );
}
