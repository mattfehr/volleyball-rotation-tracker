import { DndContext, useDraggable, type DragEndEvent } from '@dnd-kit/core';
import type { Player } from '../models/Player';
import CanvasOverlay, { type Stroke } from './CanvasOverlay';

// ─── Constants ───────────────────────────────────────────────────────────────

export const COURT_LOCAL_W = 900;
export const COURT_LOCAL_H = 900;

const RENDER_W = 340;
const RENDER_HALF_H = 340;

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
// Render mapping (per half):
//   Home half (bottom, not mirrored):
//     render_x = (x / LOCAL_W) * RENDER_W
//     render_y = (y / LOCAL_H) * RENDER_HALF_H
//   Away half (top, y-axis mirrored):
//     render_x = ((LOCAL_W - x) / LOCAL_W) * RENDER_W
//     render_y = ((LOCAL_H - y) / LOCAL_H) * RENDER_HALF_H

// ─── Draggable token ─────────────────────────────────────────────────────────

type TokenProps = {
  player: Player;
  teamColor: string;
  isViolating: boolean;
  mirrored: boolean;
};

function DraggablePlayer({ player, teamColor, isViolating, mirrored }: TokenProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: player.id,
  });

  const scaleX = RENDER_W / COURT_LOCAL_W;

  const baseX = mirrored
    ? ((COURT_LOCAL_W - player.x) / COURT_LOCAL_W) * RENDER_W
    : (player.x / COURT_LOCAL_W) * RENDER_W;
  const baseY = mirrored
    ? ((COURT_LOCAL_H - player.y) / COURT_LOCAL_H) * RENDER_HALF_H
    : (player.y / COURT_LOCAL_H) * RENDER_HALF_H;

  // Live drag delta expressed in render pixels → translate directly
  const liveDx = transform ? transform.x : 0;
  const liveDy = transform ? transform.y : 0;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: baseX + liveDx,
    top: baseY + liveDy,
    transform: `translate(-50%, -50%) scale(${scaleX})`,
    transformOrigin: 'center',
    // Undo the scale for the token itself — we only want coord scaling, not size
    width: COURT_LOCAL_W * 0.07,  // ~63px at full local size
    height: COURT_LOCAL_W * 0.07,
    zIndex: 10,
  };

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={style}>
      <div
        className={`player-token w-full h-full rounded-full border-2 border-white shadow-xl flex flex-col items-center justify-center cursor-grab active:cursor-grabbing relative
          ${isViolating ? 'ring-4 ring-[#ef4444] animate-pulse' : ''}`}
        style={{ backgroundColor: teamColor }}
      >
        <span className="text-white font-bold text-[11px] leading-tight text-center">
          {player.label}
        </span>
      </div>
      {player.name && (
        <span
          className="absolute left-1/2 text-white text-[8px] font-bold px-1 py-0.5 rounded shadow-sm whitespace-nowrap pointer-events-none"
          style={{
            bottom: -14,
            transform: 'translateX(-50%)',
            backgroundColor: '#0b1c30',
          }}
        >
          {player.name}
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
  const handleDragEnd = (event: DragEndEvent) => {
    const { delta, active } = event;
    const id = active.id as string;

    const scaleX = COURT_LOCAL_W / RENDER_W;
    const scaleY = COURT_LOCAL_H / RENDER_HALF_H;

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
      // Away is mirrored — flip both axes
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
        style={{ width: RENDER_W, height: RENDER_HALF_H * 2 }}
      >
        {/* ── Away half (top) ── */}
        <div
          className="court-gradient relative overflow-hidden transition-opacity duration-300"
          style={{ width: RENDER_W, height: RENDER_HALF_H, opacity: awayVisible ? 1 : 0.3 }}
        >
          {/* Ten-foot attack line */}
          <div className="absolute top-[60%] left-0 w-full h-[2px] bg-white/40" />
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="text-white/10 font-black uppercase tracking-widest text-5xl">AWAY</span>
          </div>
          {awayVisible &&
            awayPlayers.map((player) => (
              <DraggablePlayer
                key={player.id}
                player={player}
                teamColor={awayColor}
                isViolating={awayViolatingIds.includes(player.id)}
                mirrored={true}
              />
            ))}
        </div>

        {/* Net divider */}
        <div className="h-1 bg-white z-20 shrink-0" style={{ width: RENDER_W }} />

        {/* ── Home half (bottom) ── */}
        <div
          className="court-gradient relative overflow-hidden transition-opacity duration-300"
          style={{ width: RENDER_W, height: RENDER_HALF_H, opacity: homeVisible ? 1 : 0.3 }}
        >
          {/* Ten-foot attack line */}
          <div className="absolute bottom-[60%] left-0 w-full h-[2px] bg-white/40" />
          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="text-white/10 font-black uppercase tracking-widest text-5xl">HOME</span>
          </div>
          {homeVisible &&
            homePlayers.map((player) => (
              <DraggablePlayer
                key={player.id}
                player={player}
                teamColor={homeColor}
                isViolating={homeViolatingIds.includes(player.id)}
                mirrored={false}
              />
            ))}
        </div>

        {/* Annotation canvas — spans the full court height */}
        <div
          className={`absolute inset-0 z-30 ${isDrawing ? '' : 'pointer-events-none'}`}
          style={{ width: RENDER_W, height: RENDER_HALF_H * 2 + 4 }}
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
