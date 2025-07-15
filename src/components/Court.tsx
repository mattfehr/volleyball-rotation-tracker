import {
  DndContext,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';

function DraggablePlayer() {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: 'player-1',
  });

  const style = {
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className="w-16 h-16 bg-blue-600 rounded-full text-white flex flex-col items-center justify-center cursor-move shadow-md"
    >
      <span className="text-lg font-bold">S</span>
      <small>Alex</small>
    </div>
  );
}

export default function Court() {
  return (
    <div className="w-full max-w-2xl h-[500px] bg-green-200 relative border-4 border-black mx-auto flex items-center justify-center">
      <DndContext>
        <DraggablePlayer />
      </DndContext>
    </div>
  );
}
