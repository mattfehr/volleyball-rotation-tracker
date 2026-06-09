import type { Player } from '../../models/Player';

type Props = {
  players: Player[];               // on-court players for the current view
  roster: Player[];                // all roster members
  teamColor: string;
  /** The currently edited player (highlights that row) */
  editingId: string | null;
  onEditPlayer: (player: Player) => void;
  /** Put a bench player onto court */
  onAddToCourt: (player: Player) => void;
  onRotateFromPrevious: () => void;
  onCopyFromOpposite: () => void;
  canCopyFromOpposite: boolean;
  copyLabel: string;
  side: 'home' | 'away';
};

export default function RosterList({
  players,
  roster,
  teamColor,
  editingId,
  onEditPlayer,
  onAddToCourt,
  onRotateFromPrevious,
  onCopyFromOpposite,
  canCopyFromOpposite,
  copyLabel,
}: Props) {
  const onCourtIds = new Set(players.map((p) => p.id));
  const bench = roster.filter((p) => !onCourtIds.has(p.id));

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar">
      {/* On-court roster */}
      <p className="px-4 py-2 text-[10px] font-semibold text-[#72796e] uppercase tracking-wider">
        On Court
      </p>

      {players.length === 0 && (
        <p className="px-4 text-xs text-[#72796e] italic">No players on court</p>
      )}

      <div className="px-2 space-y-1">
        {players.map((player) => (
          <div
            key={player.id}
            className={`flex items-center justify-between p-2 rounded-lg transition-colors group cursor-default ${
              editingId === player.id ? 'bg-[#e5eeff]' : 'hover:bg-[#e5eeff]'
            }`}
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
              onClick={() => onEditPlayer(player)}
            >
              more_vert
            </span>
          </div>
        ))}
      </div>

      {/* Tactical utilities */}
      <div className="px-2 py-3 space-y-1.5 border-t border-[#c2c9bb]/30 mt-2">
        <button
          onClick={onRotateFromPrevious}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#42493e] hover:bg-[#e5eeff] transition-colors border border-[#c2c9bb]/30"
        >
          <span className="material-symbols-outlined text-[18px]">published_with_changes</span>
          Rotate From Previous Row
        </button>
        <button
          onClick={onCopyFromOpposite}
          disabled={!canCopyFromOpposite}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#42493e] hover:bg-[#e5eeff] transition-colors border border-[#c2c9bb]/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[18px]">content_copy</span>
          {copyLabel}
        </button>
      </div>

      {/* Active Bench */}
      <div className="border-t border-[#c2c9bb]/30 mt-1">
        <div className="px-4 py-2 flex items-center justify-between">
          <p className="text-[10px] font-semibold text-[#72796e] uppercase tracking-wider">
            Bench
          </p>
          <span className="text-[10px] bg-[#e5eeff] px-2 py-0.5 rounded font-bold text-[#42493e]">
            {bench.length}/{roster.length}
          </span>
        </div>

        {bench.length === 0 ? (
          <p className="px-4 pb-3 text-xs text-[#72796e] italic">All players on court</p>
        ) : (
          <div className="px-2 space-y-1.5 pb-2">
            {bench.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-2 bg-[#eff4ff] rounded-lg border border-transparent hover:border-[#c2c9bb] cursor-pointer group"
                onClick={() => onAddToCourt(player)}
                title="Add to court"
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
                <span className="material-symbols-outlined text-[16px] text-[#72796e] group-hover:text-[#2d5a27] transition-colors">
                  add_circle
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
