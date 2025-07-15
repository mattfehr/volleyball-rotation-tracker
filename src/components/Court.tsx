import {
  DndContext,
  useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { Player } from '../models/Player';

type Props = {
  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;
};

function DraggablePlayer({ player }: { player: Player }) {
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
      className="absolute w-16 h-16 bg-blue-600 rounded-full text-white flex flex-col items-center justify-center cursor-move shadow-md"
    >
      <span className="text-sm font-bold">{player.label}</span>
      <small>{player.name}</small>
    </div>
  );
}

export default function Court({ players, setPlayers }: Props) {
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
    <div className="w-[900px] h-[900px] bg-yellow-500 relative border-4 border-black mx-auto">
      <DndContext onDragEnd={handleDragEnd}>
        {players.map((player) => (
          <DraggablePlayer key={player.id} player={player} />
        ))}
      </DndContext>
    </div>
  );
}
