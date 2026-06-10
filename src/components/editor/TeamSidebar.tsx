import type { Player } from '../../models/Player';
import type { RotationViewKey } from '../../lib/rotationViews';
import RotationControls from './RotationControls';
import RosterList from './RosterList';

type Phase = 'serve' | 'receive';

type Props = {
  side: 'home' | 'away';
  teamName: string;
  teamAbbr: string;
  teamColor: string;
  isVisible: boolean;
  currentView: RotationViewKey;
  currentPhase: Phase;
  onViewChange: (view: RotationViewKey) => void;
  onPhaseChange: (phase: Phase) => void;
  players: Player[];         // on-court players for current view
  roster: Player[];          // all roster members
  checkResult: string | null;
  editingPlayerId: string | null;
  onCheckLegality: () => void;
  onEditPlayer: (player: Player) => void;
  onAddToCourt: (player: Player) => void;
  onRemoveFromCourt: (playerId: string) => void;
  onAddNewPlayer: () => void;
  onRotateFromPrevious: () => void;
  canRotateFromPrevious: boolean;
  onCopyFromOpposite: () => void;
  canCopyFromOpposite: boolean;
  copyLabel: string;
};

export default function TeamSidebar({
  side,
  teamName,
  teamAbbr,
  teamColor,
  isVisible,
  currentView,
  currentPhase,
  onViewChange,
  onPhaseChange,
  players,
  roster,
  checkResult,
  editingPlayerId,
  onCheckLegality,
  onEditPlayer,
  onAddToCourt,
  onRemoveFromCourt,
  onAddNewPlayer,
  onRotateFromPrevious,
  canRotateFromPrevious,
  onCopyFromOpposite,
  canCopyFromOpposite,
  copyLabel,
}: Props) {
  const borderSide = side === 'home' ? 'border-r' : 'border-l';

  return (
    <aside
      className={`flex flex-col h-full ${borderSide} border-[#c2c9bb] z-40 bg-[#f8f9ff] w-72 shrink-0 overflow-hidden`}
    >
      {/* Team header */}
      <div className="p-4 border-b border-[#c2c9bb] shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ backgroundColor: teamColor }}
          >
            {teamAbbr}
          </div>
          <span
            className="material-symbols-outlined text-[16px]"
            style={{ color: isVisible ? teamColor : '#72796e' }}
            title={isVisible ? 'Visible on court' : 'Hidden from court'}
          >
            {isVisible ? 'visibility' : 'visibility_off'}
          </span>
          <div className="min-w-0">
            <h3
              className="font-['Hanken_Grotesk'] font-semibold text-[15px] leading-tight truncate"
              style={{ color: teamColor }}
            >
              {teamName}
            </h3>
            <p className="text-[11px] text-[#42493e]">
              {currentView} · {currentPhase === 'serve' ? 'Serve' : 'Receive'}
            </p>
          </div>
        </div>

        <RotationControls
          currentView={currentView}
          currentPhase={currentPhase}
          onViewChange={onViewChange}
          onPhaseChange={onPhaseChange}
          onCheckLegality={onCheckLegality}
          checkResult={checkResult}
          onRotateFromPrevious={onRotateFromPrevious}
          canRotateFromPrevious={canRotateFromPrevious}
          onCopyFromOpposite={onCopyFromOpposite}
          canCopyFromOpposite={canCopyFromOpposite}
          copyLabel={copyLabel}
        />
      </div>

      {/* Roster + bench */}
      <RosterList
        players={players}
        roster={roster}
        teamColor={teamColor}
        editingId={editingPlayerId}
        onEditPlayer={onEditPlayer}
        onAddToCourt={onAddToCourt}
        onRemoveFromCourt={onRemoveFromCourt}
        side={side}
      />

      {/* Add player */}
      <div className="p-4 border-t border-[#c2c9bb] shrink-0">
        <button
          onClick={onAddNewPlayer}
          className="w-full py-2.5 rounded-lg font-semibold text-sm text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-95"
          style={{ backgroundColor: teamColor }}
        >
          <span className="material-symbols-outlined text-[18px]">person_add</span>
          Add Player
        </button>
      </div>
    </aside>
  );
}
