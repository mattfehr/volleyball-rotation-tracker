type Tool = 'none' | 'pen' | 'highlight' | 'eraser';

type Props = {
  currentTool: Tool;
  onToolChange: (tool: Tool) => void;
  onClearStrokes: () => void;
  onUndo: () => void;
};

const drawingTools: { tool: Tool; icon: string; title: string }[] = [
  { tool: 'none', icon: 'near_me', title: 'Select (no drawing)' },
  { tool: 'pen', icon: 'edit', title: 'Pen' },
  { tool: 'highlight', icon: 'ink_highlighter', title: 'Highlight' },
  { tool: 'eraser', icon: 'ink_eraser', title: 'Erase' },
];

export default function ToolPalette({
  currentTool,
  onToolChange,
  onClearStrokes,
  onUndo,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      {/* Drawing tools */}
      <div className="bg-white rounded-xl shadow-xl p-2 border border-[#c2c9bb] flex flex-col gap-1">
        {drawingTools.map(({ tool, icon, title }) => (
          <button
            key={tool}
            title={title}
            onClick={() => onToolChange(tool)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors active:scale-90 ${
              currentTool === tool
                ? 'bg-[#f57c00] text-white shadow-sm'
                : 'text-[#42493e] hover:bg-[#e5eeff]'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </button>
        ))}
        {/* Clear all */}
        <button
          title="Clear all annotations"
          onClick={onClearStrokes}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-[#ef4444] hover:bg-[#ffdad6]/30 transition-colors active:scale-90"
        >
          <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
        </button>
      </div>

      {/* Undo */}
      <div className="bg-white rounded-xl shadow-xl p-2 border border-[#c2c9bb] flex flex-col gap-1">
        <button
          title="Undo last stroke"
          onClick={onUndo}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-[#42493e] hover:bg-[#e5eeff] transition-colors active:scale-90"
        >
          <span className="material-symbols-outlined text-[20px]">undo</span>
        </button>
      </div>
    </div>
  );
}
