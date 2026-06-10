import { useState } from 'react';

export type PdfTeamMode = 'both' | 'home' | 'away';

export type PdfExportOptions = {
  teamMode: PdfTeamMode;
  includeAnnotations: boolean;
};

export const DEFAULT_PDF_EXPORT_OPTIONS: PdfExportOptions = {
  teamMode: 'both',
  includeAnnotations: true,
};

type Props = {
  initialTeamMode?: PdfTeamMode;
  onExport: (options: PdfExportOptions) => void;
  onCancel: () => void;
};

export default function PdfExportDialog({
  initialTeamMode = 'both',
  onExport,
  onCancel,
}: Props) {
  const [teamMode, setTeamMode] = useState<PdfTeamMode>(initialTeamMode);
  const [includeAnnotations, setIncludeAnnotations] = useState(true);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[#0b1c30]/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      <div className="relative bg-white w-full max-w-sm rounded-xl shadow-2xl overflow-hidden flex flex-col mx-4">
        <div className="p-6 border-b border-[#c2c9bb] flex justify-between items-start gap-4">
          <h2 className="font-['Hanken_Grotesk'] font-semibold text-lg text-[#0b1c30]">
            Export PDF
          </h2>
          <button
            onClick={onCancel}
            className="text-[#72796e] hover:text-[#0b1c30] transition-colors shrink-0 -mt-1 -mr-1"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          <fieldset>
            <legend className="text-sm font-semibold text-[#0b1c30] mb-2">Teams</legend>
            <div className="space-y-2">
              {(
                [
                  { value: 'both', label: 'Both teams' },
                  { value: 'home', label: 'Home only' },
                  { value: 'away', label: 'Away only' },
                ] as const
              ).map(({ value, label }) => (
                <label
                  key={value}
                  className="flex items-center gap-2 text-sm text-[#42493e] cursor-pointer"
                >
                  <input
                    type="radio"
                    name="pdf-team-mode"
                    value={value}
                    checked={teamMode === value}
                    onChange={() => setTeamMode(value)}
                    className="accent-[#f57c00]"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex items-center gap-2 text-sm text-[#42493e] cursor-pointer">
            <input
              type="checkbox"
              checked={includeAnnotations}
              onChange={(e) => setIncludeAnnotations(e.target.checked)}
              className="accent-[#f57c00] rounded"
            />
            Include court annotations
          </label>
        </div>

        <div className="p-4 bg-[#eff4ff] flex justify-end gap-2 border-t border-[#c2c9bb]">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg font-semibold text-sm text-[#42493e] hover:bg-[#e5eeff] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onExport({ teamMode, includeAnnotations })}
            className="px-6 py-2 rounded-lg font-semibold text-sm shadow-sm transition-colors active:scale-95 bg-[#f57c00] text-white hover:bg-[#e65100]"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
