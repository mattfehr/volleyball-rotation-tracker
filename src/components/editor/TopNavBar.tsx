type Props = {
  rotationTitle: string;
  onTitleChange: (title: string) => void;
  homeVisible: boolean;
  awayVisible: boolean;
  onToggleHome: () => void;
  onToggleAway: () => void;
  onPdfExport: () => void;
  onSave: () => void;
  onExit: () => void;
};

export default function TopNavBar({
  rotationTitle,
  onTitleChange,
  homeVisible,
  awayVisible,
  onToggleHome,
  onToggleAway,
  onPdfExport,
  onSave,
  onExit,
}: Props) {
  return (
    <header className="bg-[#2d5a27] shadow-md flex items-center justify-between w-full px-6 py-3 z-50 shrink-0">
      {/* Brand + title + nav */}
      <div className="flex items-center gap-6 min-w-0">
        <span className="font-[\'Hanken_Grotesk\'] font-extrabold text-xl text-[#f57c00] tracking-tight select-none shrink-0">
          VolleyTactics Pro
        </span>
        <input
          type="text"
          value={rotationTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Untitled Rotation"
          className="bg-transparent text-white font-semibold text-lg outline-none border-b border-transparent focus:border-white/40 w-48 max-w-[16rem] min-w-0 transition-colors shrink"
        />
        <nav className="hidden md:flex gap-6 shrink-0">
          <button
            onClick={onExit}
            className="text-white/70 hover:text-white font-semibold text-sm transition-colors"
          >
            Library
          </button>
          <span className="text-[#f57c00] border-b-2 border-[#f57c00] font-bold text-sm cursor-default">
            Editor
          </span>
        </nav>
      </div>

      {/* Centered visibility toggles */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
        <div className="bg-white/10 p-1 rounded-full flex items-center gap-1">
          <button
            onClick={onToggleHome}
            disabled={homeVisible && !awayVisible}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              homeVisible && !awayVisible
                ? 'bg-[#f57c00] text-white shadow-sm opacity-50 cursor-not-allowed'
                : homeVisible
                  ? 'bg-[#f57c00] text-white shadow-sm'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {homeVisible ? 'visibility' : 'visibility_off'}
            </span>
            Home
          </button>
          <button
            onClick={onToggleAway}
            disabled={awayVisible && !homeVisible}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              awayVisible && !homeVisible
                ? 'bg-[#f57c00] text-white shadow-sm opacity-50 cursor-not-allowed'
                : awayVisible
                  ? 'bg-[#f57c00] text-white shadow-sm'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">
              {awayVisible ? 'visibility' : 'visibility_off'}
            </span>
            Away
          </button>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onPdfExport}
          title="Export PDF"
          className="text-white hover:bg-white/10 p-2 rounded-lg transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[22px]">picture_as_pdf</span>
        </button>
        <div className="h-6 w-px bg-white/20" />
        <button
          onClick={onSave}
          className="bg-[#f57c00] text-white px-4 py-1.5 rounded-lg font-semibold text-sm active:scale-95 transition-transform hover:bg-[#e65100]"
        >
          Save
        </button>
      </div>
    </header>
  );
}
