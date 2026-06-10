import { useLayoutEffect, useRef, useState } from 'react';
import { DndContext, useDraggable, type DragEndEvent } from '@dnd-kit/core';
import type { Player } from '../models/Player';
import CanvasOverlay, { type Stroke } from './CanvasOverlay';

// ─── Constants ───────────────────────────────────────────────────────────────

export const COURT_LOCAL_W = 900;
export const COURT_LOCAL_H = 900;

// Regulation: half-court 29.5' × 29.5' (9 m × 9 m); full court 29.5' × 59' (9 m × 18 m)
// Dual view: each half rendered at HALF_RENDER_BASE; single view scales 2× to fill the canvas
const HALF_RENDER_BASE = 290;
const FULL_RENDER_H = HALF_RENDER_BASE * 2;
const SINGLE_RENDER_SIZE = FULL_RENDER_H;
const ATTACK_LINE_FROM_NET = '33.333%'; // 3 m / 9 m from the net
const TOKEN_RATIO = 0.12;
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
// Each team keeps coords in the 900×900 local space (9 m × 9 m half-court).
// Mapped to a square render half (halfSize × halfSize):
//   Home (not mirrored): render_x = (x / LOCAL_W) * halfSize, render_y = (y / LOCAL_H) * halfSize
//   Away (mirrored):     render_x = ((LOCAL_W - x) / LOCAL_W) * halfSize,
//                        render_y = ((LOCAL_H - y) / LOCAL_H) * halfSize

function mapLocalToRender(
  x: number,
  y: number,
  mirrored: boolean,
  halfSize: number
) {
  const rx = mirrored
    ? ((COURT_LOCAL_W - x) / COURT_LOCAL_W) * halfSize
    : (x / COURT_LOCAL_W) * halfSize;
  const ry = mirrored
    ? ((COURT_LOCAL_H - y) / COURT_LOCAL_H) * halfSize
    : (y / COURT_LOCAL_H) * halfSize;
  return { rx, ry };
}

// ─── Fit-to-circle label ─────────────────────────────────────────────────────

function FitCircleText({
  text,
  maxFontSize,
  minFontSize,
}: {
  text: string;
  maxFontSize: number;
  minFontSize: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [fontSize, setFontSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const el = textRef.current;
    if (!container || !el) return;

    let size = maxFontSize;
    const maxWidth = container.clientWidth * 0.82;
    const maxHeight = container.clientHeight * 0.82;

    el.style.fontSize = `${size}px`;
    while (size > minFontSize && (el.scrollWidth > maxWidth || el.scrollHeight > maxHeight)) {
      size -= 1;
      el.style.fontSize = `${size}px`;
    }
    setFontSize(size);
  }, [text, maxFontSize, minFontSize]);

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
  halfSize: number;
};

function DraggablePlayer({
  player,
  teamColor,
  isViolating,
  mirrored,
  halfSize,
}: TokenProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: player.id,
  });

  const coordScale = halfSize / COURT_LOCAL_W;
  const textScale = COURT_LOCAL_W / halfSize;
  const { rx: baseX, ry: baseY } = mapLocalToRender(player.x, player.y, mirrored, halfSize);

  const liveDx = transform ? transform.x : 0;
  const liveDy = transform ? transform.y : 0;

  const tokenSize = COURT_LOCAL_W * TOKEN_RATIO;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: baseX + liveDx,
    top: baseY + liveDy,
    transform: `translate(-50%, -50%) scale(${coordScale})`,
    transformOrigin: 'center',
    width: tokenSize,
    height: tokenSize,
    zIndex: 10,
  };

  const circleText = player.name || player.label;
  const maxFontSize = CIRCLE_FONT_SCREEN * textScale;
  const minFontSize = Math.round(8 * textScale);

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      <div
        className={`player-token w-full h-full rounded-full border-2 border-white shadow-xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing relative
          ${isViolating ? 'ring-4 ring-[#ef4444] animate-pulse' : ''}`}
        style={{ backgroundColor: teamColor }}
      >
        <FitCircleText text={circleText} maxFontSize={maxFontSize} minFontSize={minFontSize} />
      </div>
      {player.label && (
        <span
          className="absolute left-1/2 text-white font-bold px-1 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none"
          style={{
            fontSize: PILL_FONT_SCREEN * textScale,
            bottom: -PILL_OFFSET_SCREEN * textScale,
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
  const halfSize = bothVisible ? HALF_RENDER_BASE : SINGLE_RENDER_SIZE;
  const courtWidth = halfSize;
  const courtHeight = bothVisible ? FULL_RENDER_H : SINGLE_RENDER_SIZE;

  const handleDragEnd = (event: DragEndEvent) => {
    const { delta, active } = event;
    const id = active.id as string;

    const scaleX = COURT_LOCAL_W / halfSize;
    const scaleY = COURT_LOCAL_H / halfSize;

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
  const watermarkSize = bothVisible ? 'text-5xl' : 'text-8xl';

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div
        className="relative rounded-xl shadow-2xl overflow-visible border-4 border-white flex flex-col shrink-0 transition-[width,height] duration-300 ease-out"
        style={{ width: courtWidth, height: courtHeight }}
      >
        {awayVisible && (
          <div
            className="court-gradient relative overflow-hidden"
            style={{ width: halfSize, height: halfSize }}
          >
            <div
              className="absolute left-0 w-full h-[2px] bg-white/40"
              style={{ bottom: ATTACK_LINE_FROM_NET }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span
                className={`text-white/10 font-black uppercase tracking-widest ${watermarkSize}`}
              >
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
                halfSize={halfSize}
              />
            ))}
          </div>
        )}

        {homeVisible && (
          <div
            className="court-gradient relative overflow-hidden"
            style={{ width: halfSize, height: halfSize }}
          >
            <div
              className="absolute left-0 w-full h-[2px] bg-white/40"
              style={{ top: ATTACK_LINE_FROM_NET }}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span
                className={`text-white/10 font-black uppercase tracking-widest ${watermarkSize}`}
              >
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
                halfSize={halfSize}
              />
            ))}
          </div>
        )}

        {bothVisible && (
          <div
            className="absolute left-0 w-full h-1 bg-white z-20 pointer-events-none"
            style={{ top: HALF_RENDER_BASE, transform: 'translateY(-50%)' }}
          />
        )}

        <div
          className={`absolute inset-0 z-30 ${isDrawing ? '' : 'pointer-events-none'}`}
          style={{ width: courtWidth, height: courtHeight }}
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
