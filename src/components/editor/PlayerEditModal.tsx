import { useState, useEffect } from 'react';
import type { Player } from '../../models/Player';

const POSITIONS = ['S', 'OH', 'OP', 'MB', 'L', 'DS'] as const;

type Props = {
  player: Player | null;
  onSave: (updated: Player) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
};

export default function PlayerEditModal({ player, onSave, onDelete, onClose }: Props) {
  const [form, setForm] = useState<Player | null>(null);

  useEffect(() => {
    setForm(player ? { ...player } : null);
  }, [player]);

  if (!player || !form) return null;

  const update = <K extends keyof Player>(key: K, value: Player[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0b1c30]/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#c2c9bb] flex justify-between items-center">
          <h2 className="font-['Hanken_Grotesk'] font-semibold text-xl text-[#0b1c30]">
            Edit Player Details
          </h2>
          <button
            onClick={onClose}
            className="text-[#72796e] hover:text-[#0b1c30] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#42493e] uppercase tracking-wider">
              Player Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full px-3 py-2 rounded-lg border border-[#c2c9bb] focus:border-[#f57c00] focus:ring-1 focus:ring-[#f57c00] outline-none text-sm transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Jersey Number */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#42493e] uppercase tracking-wider">
                Jersey #
              </label>
              <input
                type="number"
                value={form.number ?? ''}
                onChange={(e) =>
                  update(
                    'number',
                    e.target.value === '' ? null : parseInt(e.target.value, 10)
                  )
                }
                placeholder="#"
                className="w-full px-3 py-2 rounded-lg border border-[#c2c9bb] focus:border-[#f57c00] focus:ring-1 focus:ring-[#f57c00] outline-none text-sm transition-all"
              />
            </div>

            {/* Position (maps to label) */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-[#42493e] uppercase tracking-wider">
                Position
              </label>
              <select
                value={form.label}
                onChange={(e) => update('label', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#c2c9bb] focus:border-[#f57c00] focus:ring-1 focus:ring-[#f57c00] outline-none text-sm bg-white transition-all"
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
                {/* Allow custom label if it's not a standard position */}
                {!POSITIONS.includes(form.label as (typeof POSITIONS)[number]) && (
                  <option value={form.label}>{form.label}</option>
                )}
              </select>
            </div>
          </div>

          {/* Zone */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-[#42493e] uppercase tracking-wider">
              Court Zone
            </label>
            <select
              value={form.zone ?? ''}
              onChange={(e) =>
                update('zone', e.target.value === '' ? undefined : parseInt(e.target.value, 10))
              }
              className="w-full px-3 py-2 rounded-lg border border-[#c2c9bb] focus:border-[#f57c00] focus:ring-1 focus:ring-[#f57c00] outline-none text-sm bg-white transition-all"
            >
              <option value="">No zone assigned</option>
              {[1, 2, 3, 4, 5, 6].map((z) => (
                <option key={z} value={z}>
                  Zone {z}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#eff4ff] flex justify-between items-center gap-3 border-t border-[#c2c9bb]">
          <button
            onClick={() => {
              const name = form.name || form.label;
              if (window.confirm(`Delete "${name}" from the roster? This cannot be undone.`)) {
                onDelete(form.id);
              }
            }}
            className="px-3 py-2 rounded-lg font-semibold text-sm text-[#ef4444] hover:bg-[#ffdad6]/40 transition-colors"
          >
            Delete
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold text-sm text-[#42493e] hover:bg-[#e5eeff] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(form);
                onClose();
              }}
              className="px-6 py-2 rounded-lg bg-[#f57c00] text-white font-semibold text-sm shadow-sm hover:bg-[#e65100] transition-colors active:scale-95"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
