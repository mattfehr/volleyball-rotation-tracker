import { SERVE_VIEW_KEYS } from '../../lib/rotationViews';
import type { RotationViewKey } from '../../lib/rotationViews';

type Phase = 'serve' | 'receive';

type Props = {
  currentView: RotationViewKey;
  currentPhase: Phase;
  onViewChange: (view: RotationViewKey) => void;
  onPhaseChange: (phase: Phase) => void;
  onCheckLegality: () => void;
  checkResult: string | null;
  onRotateFromPrevious: () => void;
  canRotateFromPrevious: boolean;
  onCopyFromOpposite: () => void;
  canCopyFromOpposite: boolean;
  copyLabel: string;
};

export default function RotationControls({
  currentView,
  currentPhase,
  onViewChange,
  onPhaseChange,
  onCheckLegality,
  checkResult,
  onRotateFromPrevious,
  canRotateFromPrevious,
  onCopyFromOpposite,
  canCopyFromOpposite,
  copyLabel,
}: Props) {
  const rotationNumber = Number(currentView.slice(1));
  const isServe = SERVE_VIEW_KEYS.includes(currentView as (typeof SERVE_VIEW_KEYS)[number]);
  const activePhase: Phase = isServe ? 'serve' : 'receive';

  const handlePhaseChange = (phase: Phase) => {
    onPhaseChange(phase);
    const prefix = phase === 'serve' ? 'S' : 'R';
    onViewChange(`${prefix}${rotationNumber}` as RotationViewKey);
  };

  const handleRotationClick = (num: number) => {
    const prefix = activePhase === 'serve' ? 'S' : 'R';
    onViewChange(`${prefix}${num}` as RotationViewKey);
  };

  const isLegal = checkResult?.startsWith('Rotation is legal');
  const isIllegal = checkResult && !isLegal;

  return (
    <div className="space-y-2">
      {/* Serve / Receive toggle */}
      <div className="flex justify-between items-center px-1">
        <span className="text-[10px] font-semibold text-[#72796e] uppercase tracking-wider">
          Rotations
        </span>
        <div className="flex bg-[#dce9ff] rounded-lg p-0.5">
          <button
            onClick={() => handlePhaseChange('serve')}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
              currentPhase === 'serve'
                ? 'bg-white shadow-sm text-[#2d5a27]'
                : 'text-[#42493e] hover:text-[#2d5a27]'
            }`}
          >
            Serve
          </button>
          <button
            onClick={() => handlePhaseChange('receive')}
            className={`px-2 py-1 text-[10px] font-bold rounded-md transition-colors ${
              currentPhase === 'receive'
                ? 'bg-white shadow-sm text-[#2d5a27]'
                : 'text-[#42493e] hover:text-[#2d5a27]'
            }`}
          >
            Receive
          </button>
        </div>
      </div>

      {/* R1–R6 grid */}
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3, 4, 5, 6].map((num) => {
          const active = rotationNumber === num;
          return (
            <button
              key={num}
              onClick={() => handleRotationClick(num)}
              className={`flex items-center justify-center py-2 rounded-lg font-bold text-xs transition-colors border ${
                active
                  ? 'bg-[#f57c00] text-white border-[#f57c00] shadow-sm'
                  : 'text-[#42493e] bg-[#eff4ff] border-[#c2c9bb]/30 hover:bg-[#dce9ff]'
              }`}
            >
              R{num}
            </button>
          );
        })}
      </div>

      {/* Check legality */}
      <button
        onClick={onCheckLegality}
        className="w-full mt-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-[#dce9ff] text-[#2d5a27] font-semibold text-xs hover:bg-[#2d5a27]/10 transition-colors border border-[#2d5a27]/20"
      >
        <span className="material-symbols-outlined text-[16px]">verified</span>
        Check Rotation Legality
      </button>

      {/* Tactical utilities */}
      <div className="space-y-1.5">
        <button
          onClick={onRotateFromPrevious}
          disabled={!canRotateFromPrevious}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-[#42493e] hover:bg-[#e5eeff] transition-colors border border-[#c2c9bb]/30 disabled:opacity-40 disabled:cursor-not-allowed"
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

      {/* Legality result */}
      {checkResult && (
        <p
          className={`text-xs whitespace-pre-wrap px-1 ${
            isIllegal ? 'text-[#ef4444]' : 'text-[#22c55e]'
          }`}
        >
          {checkResult}
        </p>
      )}
    </div>
  );
}
