import type { Timestamp } from 'firebase/firestore';
import type { RotationSet } from './firestore';
import { RECEIVE_VIEW_KEYS, ROTATION_VIEW_KEYS } from './rotationViews';

export type SortOption = 'updated-desc' | 'created-desc' | 'name-asc';
export type DateRange = 'all' | 'today' | 'last7' | 'last30' | 'thisYear';
export type CompletenessFilter = 'all' | 'complete' | 'partial' | 'empty';

export type AdvancedFilters = {
  completeness: CompletenessFilter;
  hasAnnotations: boolean;
  bothTeamsConfigured: boolean;
};

export type LibraryFilterState = {
  searchQuery: string;
  sortBy: SortOption;
  dateRange: DateRange;
  selectedTeam: string | null;
  advancedFilters: AdvancedFilters;
};

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {
  completeness: 'all',
  hasAnnotations: false,
  bothTeamsConfigured: false,
};

export const DEFAULT_FILTER_STATE: LibraryFilterState = {
  searchQuery: '',
  sortBy: 'updated-desc',
  dateRange: 'all',
  selectedTeam: null,
  advancedFilters: DEFAULT_ADVANCED_FILTERS,
};

type SetWithId = RotationSet & { id: string };

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

function timestampToDate(ts: Timestamp): Date {
  return ts.toDate();
}

export function formatLibraryTimestamp(date: Date): string {
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })}`;
}

function countReceiveRotations(set: RotationSet): number {
  return RECEIVE_VIEW_KEYS.filter((key) => set.home.rotations[key].length > 0).length;
}

function teamHasPlayers(set: RotationSet, side: 'home' | 'away'): boolean {
  const team = set[side];
  return ROTATION_VIEW_KEYS.some((key) => team.rotations[key].length > 0);
}

function setHasAnnotations(set: RotationSet): boolean {
  if (!set.annotations) return false;
  return Object.values(set.annotations).some(
    (strokes) => strokes != null && strokes.length > 0
  );
}

function setSearchableText(set: RotationSet): string {
  const parts = [
    set.title || '',
    set.home.name,
    set.away.name,
    set.home.abbreviation,
    set.away.abbreviation,
    ...set.home.roster.flatMap((p) => [p.name, p.label]),
    ...set.away.roster.flatMap((p) => [p.name, p.label]),
  ];
  return parts.join(' ').toLowerCase();
}

type ParsedDateRange = { start: Date; end: Date };

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseSearchDateRange(query: string): ParsedDateRange | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;

  const now = new Date();

  if (q === 'last week') {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { start: startOfDay(start), end: endOfDay(now) };
  }

  if (q === 'last month') {
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    return { start: startOfDay(start), end: endOfDay(now) };
  }

  for (let i = 0; i < MONTH_NAMES.length; i++) {
    const month = MONTH_NAMES[i];
    if (q === month || q.startsWith(`${month} `) || q.endsWith(` ${month}`)) {
      const yearMatch = q.match(/\b(20\d{2})\b/);
      const year = yearMatch ? Number(yearMatch[1]) : now.getFullYear();
      const start = new Date(year, i, 1);
      const end = endOfDay(new Date(year, i + 1, 0));
      return { start, end };
    }
  }

  const isoMatch = q.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const start = startOfDay(new Date(year, month, day));
    return { start, end: endOfDay(start) };
  }

  const slashMatch = q.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
  if (slashMatch) {
    const month = Number(slashMatch[1]) - 1;
    const day = Number(slashMatch[2]);
    let year = slashMatch[3] ? Number(slashMatch[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    const start = startOfDay(new Date(year, month, day));
    return { start, end: endOfDay(start) };
  }

  return null;
}

function looksDateLike(query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  if (q === 'last week' || q === 'last month') return true;
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(q)) return true;
  if (/^\d{1,2}\/\d{1,2}(\/\d{2,4})?$/.test(q)) return true;
  return MONTH_NAMES.some(
    (month) => q === month || q.includes(month)
  );
}

function dateOverlapsRange(date: Date, range: ParsedDateRange): boolean {
  return date >= range.start && date <= range.end;
}

export function matchesSearchQuery(set: RotationSet, query: string): boolean {
  const trimmed = query.trim();
  if (!trimmed) return true;

  if (looksDateLike(trimmed)) {
    const range = parseSearchDateRange(trimmed);
    if (range) {
      const created = timestampToDate(set.createdAt);
      const updated = timestampToDate(set.updatedAt);
      return (
        dateOverlapsRange(created, range) || dateOverlapsRange(updated, range)
      );
    }
  }

  return setSearchableText(set).includes(trimmed.toLowerCase());
}

function getDateRangeBounds(range: DateRange): { start: Date; end: Date } | null {
  const now = new Date();
  switch (range) {
    case 'all':
      return null;
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'last7': {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { start: startOfDay(start), end: endOfDay(now) };
    }
    case 'last30': {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { start: startOfDay(start), end: endOfDay(now) };
    }
    case 'thisYear':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: endOfDay(now),
      };
  }
}

export function matchesDateRange(set: RotationSet, range: DateRange): boolean {
  const bounds = getDateRangeBounds(range);
  if (!bounds) return true;
  const updated = timestampToDate(set.updatedAt);
  return updated >= bounds.start && updated <= bounds.end;
}

export function matchesTeamFilter(set: RotationSet, teamName: string | null): boolean {
  if (!teamName) return true;
  return set.home.name === teamName || set.away.name === teamName;
}

export function matchesAdvancedFilters(set: RotationSet, filters: AdvancedFilters): boolean {
  const receiveCount = countReceiveRotations(set);

  if (filters.completeness === 'complete' && receiveCount !== 6) return false;
  if (filters.completeness === 'partial' && (receiveCount < 1 || receiveCount >= 6)) {
    return false;
  }
  if (filters.completeness === 'empty' && receiveCount !== 0) return false;

  if (filters.hasAnnotations && !setHasAnnotations(set)) return false;
  if (filters.bothTeamsConfigured && !(teamHasPlayers(set, 'home') && teamHasPlayers(set, 'away'))) {
    return false;
  }

  return true;
}

export function sortSets(sets: SetWithId[], sortBy: SortOption): SetWithId[] {
  const sorted = [...sets];
  sorted.sort((a, b) => {
    switch (sortBy) {
      case 'updated-desc':
        return b.updatedAt.toMillis() - a.updatedAt.toMillis();
      case 'created-desc':
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      case 'name-asc':
        return (a.title || 'Untitled').localeCompare(b.title || 'Untitled', undefined, {
          sensitivity: 'base',
        });
    }
  });
  return sorted;
}

export function getUniqueTeamNames(sets: SetWithId[]): string[] {
  const names = new Set<string>();
  for (const set of sets) {
    if (set.home.name) names.add(set.home.name);
    if (set.away.name) names.add(set.away.name);
  }
  return [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export function hasActiveFilters(state: LibraryFilterState): boolean {
  return (
    state.searchQuery.trim() !== '' ||
    state.dateRange !== 'all' ||
    state.sortBy !== 'updated-desc' ||
    state.selectedTeam !== null ||
    state.advancedFilters.completeness !== 'all' ||
    state.advancedFilters.hasAnnotations ||
    state.advancedFilters.bothTeamsConfigured
  );
}

export function filterAndSortSets(
  sets: SetWithId[],
  state: LibraryFilterState
): SetWithId[] {
  const filtered = sets.filter(
    (set) =>
      matchesSearchQuery(set, state.searchQuery) &&
      matchesDateRange(set, state.dateRange) &&
      matchesTeamFilter(set, state.selectedTeam) &&
      matchesAdvancedFilters(set, state.advancedFilters)
  );
  return sortSets(filtered, state.sortBy);
}

export function getDateRangeLabel(range: DateRange): string {
  switch (range) {
    case 'all':
      return 'Date';
    case 'today':
      return 'Today';
    case 'last7':
      return 'Last 7 days';
    case 'last30':
      return 'Last 30 days';
    case 'thisYear':
      return 'This year';
  }
}

export function getSortLabel(sortBy: SortOption): string {
  switch (sortBy) {
    case 'updated-desc':
      return 'Last modified';
    case 'created-desc':
      return 'Date created';
    case 'name-asc':
      return 'Name A–Z';
  }
}

export function getResultsHint(
  count: number,
  state: LibraryFilterState
): string | null {
  if (!hasActiveFilters(state)) return null;
  const q = state.searchQuery.trim();
  if (q) {
    return `${count} result${count === 1 ? '' : 's'} for "${q}"`;
  }
  return `${count} rotation${count === 1 ? '' : 's'}`;
}
