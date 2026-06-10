import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  useDroppable,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import type { Player } from '../../models/Player';

type Props = {
  players: Player[];
  roster: Player[];
  teamColor: string;
  editingId: string | null;
  onEditPlayer: (player: Player) => void;
  onAddToCourt: (player: Player) => void;
  onRemoveFromCourt: (playerId: string) => void;
  side: 'home' | 'away';
};

// ─── Draggable row sub-components ────────────────────────────────────────────

function CourtRow({
  player,
  teamColor,
  editingId,
  onEditPlayer,
  side,
}: {
  player: Player;
  teamColor: string;
  editingId: string | null;
  onEditPlayer: (player: Player) => void;
  side: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${side}-roster-${player.id}`,
    data: { player, section: 'court' as const },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center justify-between p-2 rounded-lg transition-colors group cursor-grab active:cursor-grabbing select-none ${
        isDragging ? 'opacity-40' : ''
      } ${editingId === player.id ? 'bg-[#e5eeff]' : 'hover:bg-[#e5eeff]'}`}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded text-white flex items-center justify-center font-bold text-[10px] shrink-0"
          style={{ backgroundColor: teamColor }}
        >
          {player.label}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0b1c30] leading-tight truncate">
            {player.name || '—'}
          </p>
          <p className="text-[10px] text-[#42493e]">
            {player.number != null ? `#${player.number} · ` : ''}
            {player.label}
            {player.zone != null ? ` · Z${player.zone}` : ''}
          </p>
        </div>
      </div>
      <span
        className="material-symbols-outlined text-[#72796e] group-hover:text-[#2d5a27] cursor-pointer text-[18px] shrink-0"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onEditPlayer(player); }}
      >
        more_vert
      </span>
    </div>
  );
}

function BenchRow({
  player,
  teamColor,
  onEditPlayer,
  side,
}: {
  player: Player;
  teamColor: string;
  onEditPlayer: (player: Player) => void;
  side: string;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${side}-roster-${player.id}`,
    data: { player, section: 'bench' as const },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center justify-between p-2 bg-[#eff4ff] rounded-lg border border-transparent hover:border-[#c2c9bb] cursor-grab active:cursor-grabbing group select-none ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-full text-white font-bold text-[9px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: teamColor, opacity: 0.6 }}
        >
          {player.number ?? player.label[0]}
        </div>
        <span className="text-xs font-medium text-[#0b1c30]">
          {player.name || player.label}
          {player.number != null ? ` #${player.number}` : ''}
        </span>
      </div>
      <span
        className="material-symbols-outlined text-[16px] text-[#72796e] group-hover:text-[#2d5a27] transition-colors cursor-pointer"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onEditPlayer(player); }}
      >
        more_vert
      </span>
    </div>
  );
}

// ─── Drop zone wrapper ────────────────────────────────────────────────────────

function DroppableZone({
  id,
  children,
}: {
  id: string;
  children: (isOver: boolean) => React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return <div ref={setNodeRef}>{children(isOver)}</div>;
}

// ─── DragOverlay ghosts ───────────────────────────────────────────────────────

function CourtRowGhost({ player, teamColor }: { player: Player; teamColor: string }) {
  return (
    <div
      className="flex items-center justify-between p-2 rounded-lg bg-[#e5eeff] shadow-xl opacity-90"
      style={{ width: 256 }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded text-white flex items-center justify-center font-bold text-[10px] shrink-0"
          style={{ backgroundColor: teamColor }}
        >
          {player.label}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#0b1c30] leading-tight">{player.name || '—'}</p>
          <p className="text-[10px] text-[#42493e]">
            {player.number != null ? `#${player.number} · ` : ''}
            {player.label}
            {player.zone != null ? ` · Z${player.zone}` : ''}
          </p>
        </div>
      </div>
      <span className="material-symbols-outlined text-[#72796e] text-[18px] shrink-0">
        more_vert
      </span>
    </div>
  );
}

function BenchRowGhost({ player, teamColor }: { player: Player; teamColor: string }) {
  return (
    <div
      className="flex items-center justify-between p-2 bg-[#eff4ff] rounded-lg border border-[#c2c9bb] shadow-xl opacity-90"
      style={{ width: 256 }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded-full text-white font-bold text-[9px] flex items-center justify-center shrink-0"
          style={{ backgroundColor: teamColor, opacity: 0.6 }}
        >
          {player.number ?? player.label[0]}
        </div>
        <span className="text-xs font-medium text-[#0b1c30]">
          {player.name || player.label}
          {player.number != null ? ` #${player.number}` : ''}
        </span>
      </div>
      <span className="material-symbols-outlined text-[16px] text-[#72796e]">more_vert</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RosterList({
  players,
  roster,
  teamColor,
  editingId,
  onEditPlayer,
  onAddToCourt,
  onRemoveFromCourt,
  side,
}: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const onCourtIds = new Set(players.map((p) => p.id));
  const bench = roster.filter((p) => !onCourtIds.has(p.id));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const courtDropId = `${side}-court-drop`;
  const benchDropId = `${side}-bench-drop`;

  const draggingPlayer = draggingId ? roster.find((p) => p.id === draggingId) ?? null : null;
  const draggingIsOnCourt = draggingPlayer ? onCourtIds.has(draggingPlayer.id) : false;

  const handleDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { player: Player } | undefined;
    if (data) setDraggingId(data.player.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = event;
    if (!over) return;

    const data = active.data.current as { player: Player; section: 'court' | 'bench' } | undefined;
    if (!data) return;

    const { player, section } = data;
    if (over.id === courtDropId && section === 'bench') {
      onAddToCourt(player);
    } else if (over.id === benchDropId && section === 'court') {
      onRemoveFromCourt(player.id);
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* On-court roster */}
        <p className="px-4 py-2 text-[10px] font-semibold text-[#72796e] uppercase tracking-wider">
          On Court
        </p>

        <DroppableZone id={courtDropId}>
          {(isOver) => (
            <div
              className={`px-2 space-y-1 min-h-8 rounded-lg transition-colors ${
                isOver ? 'bg-[#e5eeff]/60 ring-1 ring-inset ring-[#2d5a27]/30' : ''
              }`}
            >
              {players.length === 0 && !isOver && (
                <p className="px-2 text-xs text-[#72796e] italic">No players on court</p>
              )}
              {players.map((player) => (
                <CourtRow
                  key={player.id}
                  player={player}
                  teamColor={teamColor}
                  editingId={editingId}
                  onEditPlayer={onEditPlayer}
                  side={side}
                />
              ))}
            </div>
          )}
        </DroppableZone>

        {/* Bench */}
        <div className="border-t border-[#c2c9bb]/30 mt-1">
          <div className="px-4 py-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold text-[#72796e] uppercase tracking-wider">
              Bench
            </p>
            <span className="text-[10px] bg-[#e5eeff] px-2 py-0.5 rounded font-bold text-[#42493e]">
              {bench.length}/{roster.length}
            </span>
          </div>

          <DroppableZone id={benchDropId}>
            {(isOver) => (
              <div
                className={`px-2 pb-2 space-y-1.5 min-h-8 rounded-lg transition-colors ${
                  isOver ? 'bg-[#eff4ff] ring-1 ring-inset ring-[#2d5a27]/30' : ''
                }`}
              >
                {bench.length === 0 && !isOver && (
                  <p className="px-2 pb-1 text-xs text-[#72796e] italic">No one on the bench</p>
                )}
                {bench.map((player) => (
                  <BenchRow
                    key={player.id}
                    player={player}
                    teamColor={teamColor}
                    onEditPlayer={onEditPlayer}
                    side={side}
                  />
                ))}
              </div>
            )}
          </DroppableZone>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {draggingPlayer ? (
          draggingIsOnCourt ? (
            <CourtRowGhost player={draggingPlayer} teamColor={teamColor} />
          ) : (
            <BenchRowGhost player={draggingPlayer} teamColor={teamColor} />
          )
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
