import { useEffect, useRef } from 'react';
import type {
  AdvancedFilters,
  CompletenessFilter,
  DateRange,
  SortOption,
} from '../../lib/libraryFilters';
import {
  DEFAULT_ADVANCED_FILTERS,
  DEFAULT_FILTER_STATE,
  getDateRangeLabel,
  getSortLabel,
  getUniqueTeamNames,
} from '../../lib/libraryFilters';
import type { RotationSet } from '../../lib/firestore';

type SetWithId = RotationSet & { id: string };

type Props = {
  sets: SetWithId[];
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  sortBy: SortOption;
  onSortByChange: (value: SortOption) => void;
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
  selectedTeam: string | null;
  onSelectedTeamChange: (value: string | null) => void;
  advancedFilters: AdvancedFilters;
  onAdvancedFiltersChange: (value: AdvancedFilters) => void;
  openPanel: 'date' | 'team' | 'advanced' | null;
  onOpenPanelChange: (panel: 'date' | 'team' | 'advanced' | null) => void;
  onClearAllFilters: () => void;
};

function FilterButton({
  active,
  onClick,
  children,
  className = '',
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm font-semibold ${
        active
          ? 'border-court-green bg-court-green/5 text-primary'
          : 'border-outline-variant hover:bg-surface-container-low'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function DropdownPanel({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`absolute top-full right-0 mt-1 z-40 bg-white border border-outline-variant rounded-lg shadow-lg p-3 min-w-[220px] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">
      {children}
    </p>
  );
}

function RadioOption<T extends string>({
  name,
  value,
  checked,
  label,
  onChange,
}: {
  name: string;
  value: T;
  checked: boolean;
  label: string;
  onChange: (value: T) => void;
}) {
  return (
    <label className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-surface-container-low cursor-pointer text-sm">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={() => onChange(value)}
        className="accent-court-green"
      />
      {label}
    </label>
  );
}

export default function LibraryFilterBar({
  sets,
  searchQuery,
  onSearchQueryChange,
  sortBy,
  onSortByChange,
  dateRange,
  onDateRangeChange,
  selectedTeam,
  onSelectedTeamChange,
  advancedFilters,
  onAdvancedFiltersChange,
  openPanel,
  onOpenPanelChange,
  onClearAllFilters,
}: Props) {
  const barRef = useRef<HTMLDivElement>(null);
  const teamNames = getUniqueTeamNames(sets);

  const datePanelActive = sortBy !== 'updated-desc' || dateRange !== 'all';
  const teamPanelActive = selectedTeam !== null;
  const advancedPanelActive =
    advancedFilters.completeness !== 'all' ||
    advancedFilters.hasAnnotations ||
    advancedFilters.bothTeamsConfigured;

  useEffect(() => {
    if (!openPanel) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        onOpenPanelChange(null);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [openPanel, onOpenPanelChange]);

  const togglePanel = (panel: 'date' | 'team' | 'advanced') => {
    onOpenPanelChange(openPanel === panel ? null : panel);
  };

  const updateAdvanced = (patch: Partial<AdvancedFilters>) => {
    onAdvancedFiltersChange({ ...advancedFilters, ...patch });
  };

  const dateButtonLabel =
    dateRange !== 'all' ? getDateRangeLabel(dateRange) : getSortLabel(sortBy);

  return (
    <div
      ref={barRef}
      className="bg-white p-4 rounded-xl shadow-sm border border-outline-variant flex flex-col md:flex-row gap-4"
    >
      <div className="flex-grow relative">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          placeholder="Search by name, team, player, or date..."
          className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-court-green focus:border-court-green outline-none transition-all text-sm"
        />
      </div>

      <div className="flex gap-2">
        {/* Date / Sort dropdown */}
        <div className="relative">
          <FilterButton
            active={datePanelActive}
            onClick={() => togglePanel('date')}
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              calendar_today
            </span>
            <span className="max-w-[120px] truncate">{dateButtonLabel}</span>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              expand_more
            </span>
          </FilterButton>

          {openPanel === 'date' && (
            <DropdownPanel className="w-56">
              <SectionLabel>Sort by</SectionLabel>
              <RadioOption
                name="sort"
                value="updated-desc"
                checked={sortBy === 'updated-desc'}
                label="Last modified"
                onChange={onSortByChange}
              />
              <RadioOption
                name="sort"
                value="created-desc"
                checked={sortBy === 'created-desc'}
                label="Date created"
                onChange={onSortByChange}
              />
              <RadioOption
                name="sort"
                value="name-asc"
                checked={sortBy === 'name-asc'}
                label="Name A–Z"
                onChange={onSortByChange}
              />

              <div className="border-t border-outline-variant my-2" />

              <SectionLabel>Show</SectionLabel>
              {(
                [
                  ['all', 'All time'],
                  ['today', 'Today'],
                  ['last7', 'Last 7 days'],
                  ['last30', 'Last 30 days'],
                  ['thisYear', 'This year'],
                ] as const
              ).map(([value, label]) => (
                <RadioOption
                  key={value}
                  name="dateRange"
                  value={value}
                  checked={dateRange === value}
                  label={label}
                  onChange={onDateRangeChange}
                />
              ))}
            </DropdownPanel>
          )}
        </div>

        {/* Team dropdown */}
        <div className="relative">
          <FilterButton
            active={teamPanelActive}
            onClick={() => togglePanel('team')}
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              groups
            </span>
            <span className="max-w-[120px] truncate">
              {selectedTeam ?? 'Team'}
            </span>
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              expand_more
            </span>
          </FilterButton>

          {openPanel === 'team' && (
            <DropdownPanel className="max-h-60 overflow-y-auto">
              <button
                type="button"
                onClick={() => {
                  onSelectedTeamChange(null);
                  onOpenPanelChange(null);
                }}
                className={`w-full text-left py-1.5 px-2 rounded text-sm hover:bg-surface-container-low ${
                  selectedTeam === null ? 'font-bold text-primary' : ''
                }`}
              >
                All teams
              </button>
              {teamNames.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    onSelectedTeamChange(name);
                    onOpenPanelChange(null);
                  }}
                  className={`w-full text-left py-1.5 px-2 rounded text-sm hover:bg-surface-container-low truncate ${
                    selectedTeam === name ? 'font-bold text-primary' : ''
                  }`}
                >
                  {name}
                </button>
              ))}
              {teamNames.length === 0 && (
                <p className="text-xs text-on-surface-variant px-2 py-1">
                  No teams saved yet
                </p>
              )}
            </DropdownPanel>
          )}
        </div>

        {/* Advanced filters */}
        <div className="relative">
          <FilterButton
            active={advancedPanelActive}
            onClick={() => togglePanel('advanced')}
            className="px-2"
          >
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              filter_list
            </span>
          </FilterButton>

          {openPanel === 'advanced' && (
            <DropdownPanel className="w-64">
              <SectionLabel>Completeness</SectionLabel>
              {(
                [
                  ['all', 'All'],
                  ['complete', 'Complete (6)'],
                  ['partial', 'Partial'],
                  ['empty', 'Empty'],
                ] as const
              ).map(([value, label]) => (
                <RadioOption
                  key={value}
                  name="completeness"
                  value={value}
                  checked={advancedFilters.completeness === value}
                  label={label}
                  onChange={(v) => updateAdvanced({ completeness: v as CompletenessFilter })}
                />
              ))}

              <div className="border-t border-outline-variant my-2" />

              <label className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-surface-container-low cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={advancedFilters.hasAnnotations}
                  onChange={(e) => updateAdvanced({ hasAnnotations: e.target.checked })}
                  className="accent-court-green"
                />
                Has court annotations
              </label>
              <label className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-surface-container-low cursor-pointer text-sm">
                <input
                  type="checkbox"
                  checked={advancedFilters.bothTeamsConfigured}
                  onChange={(e) =>
                    updateAdvanced({ bothTeamsConfigured: e.target.checked })
                  }
                  className="accent-court-green"
                />
                Both teams configured
              </label>

              <div className="border-t border-outline-variant mt-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClearAllFilters();
                    onOpenPanelChange(null);
                  }}
                  className="w-full py-2 text-sm font-semibold text-athletic-orange hover:bg-surface-container-low rounded-lg transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            </DropdownPanel>
          )}
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_ADVANCED_FILTERS, DEFAULT_FILTER_STATE };
