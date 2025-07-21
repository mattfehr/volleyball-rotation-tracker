import {
  DndContext,
  useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Player } from '../models/Player';
import CanvasOverlay, { type Stroke } from './CanvasOverlay'; // NEW

// properties for court
type Props = {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
  violatingIds?: string[];

  // NEW for annotations
  strokes: Stroke[];
  setStrokes: (strokes: Stroke[]) => void;
  currentTool: 'pen' | 'highlight' | 'eraser';
};

// helper component for a draggable player
function DraggablePlayer({
  player,
  isViolating,
}: {
  player: Player;
  isViolating: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: player.id,
  });

  const style = {
    transform: transform
      ? `translate(${transform.x + player.x}px, ${transform.y + player.y}px)`
      : `translate(${player.x}px, ${player.y}px)`,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`absolute w-30 h-30 rounded-full text-white flex flex-col items-center justify-center cursor-move shadow-md
        ${isViolating ? 'bg-red-600 border-4 border-white animate-pulse' : 'bg-blue-600'}`}
    >
      <span className="text-sm font-bold">{player.label}</span>
      <small>{player.name}</small>
    </div>
  );
}

// main court component
export default function Court({
  players,
  setPlayers,
  violatingIds,
  strokes,
  setStrokes,
  currentTool,
}: Props) {
  const handleDragEnd = (event: DragEndEvent) => {
    const { delta, active } = event;

    setPlayers((prev) =>
      prev.map((player) =>
        player.id === active.id
          ? {
              ...player,
              x: player.x + delta.x,
              y: player.y + delta.y,
            }
          : player
      )
    );
  };

  return (
    <div className="w-[900px] h-[900px] relative border-4 border-white mx-auto">
      {/* Court background */}
      <div className="absolute w-full h-full bg-orange-400" />

      {/* Net lines */}
      <div className="absolute top-0 left-0 w-full h-[8px] bg-white z-10" />
      <div className="absolute top-[300px] left-0 w-full h-[4px] bg-white z-10" />

      {/* Annotation Canvas */}
      <CanvasOverlay
        strokes={strokes}
        setStrokes={setStrokes}
        currentTool={currentTool}
      />

      {/* Draggable Players */}
      <DndContext onDragEnd={handleDragEnd}>
        {players.map((player) => (
          <DraggablePlayer
            key={player.id}
            player={player}
            isViolating={!!violatingIds?.includes(player.id)}
          />
        ))}
      </DndContext>
    </div>
  );
}
