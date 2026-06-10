/**
 * Volleyball half-court geometry (9 m × 9 m) in local pixel space.
 *
 * Storage convention (home-oriented):
 *   - Origin (y = 0) is at the net; y increases toward the end line.
 *   - x increases left → right when facing the net.
 *   - Away uses the same stored coordinates; Court mirrors X and Y when rendering
 *     so zones appear horizontally flipped (back row reads 1–6–5 left to right).
 *
 * Zone positions are independent of 1-side vs 2-side view — only render scale changes.
 */

export const COURT_LOCAL_W = 900;
export const COURT_LOCAL_H = 900;

/** Attack line: 3 m from the net on a 9 m half-court */
export const ATTACK_LINE_Y = COURT_LOCAL_H / 3;

const FRONT_ROW_Y = ATTACK_LINE_Y / 2;
const BACK_ROW_Y = ATTACK_LINE_Y + (COURT_LOCAL_H - ATTACK_LINE_Y) / 2;

const LEFT_X = COURT_LOCAL_W / 6;
const CENTER_X = COURT_LOCAL_W / 2;
const RIGHT_X = (COURT_LOCAL_W * 5) / 6;

/**
 * Zone centers indexed by zone number (1–6).
 *
 * Layout facing the net:
 *   Back row:  5 — 6 — 1
 *   Front row: 4 — 3 — 2
 */
const ZONE_CENTERS: Readonly<Record<number, [number, number]>> = {
  1: [RIGHT_X, BACK_ROW_Y],
  2: [RIGHT_X, FRONT_ROW_Y],
  3: [CENTER_X, FRONT_ROW_Y],
  4: [LEFT_X, FRONT_ROW_Y],
  5: [LEFT_X, BACK_ROW_Y],
  6: [CENTER_X, BACK_ROW_Y],
};

export type CourtSide = 'home' | 'away';

export function getZoneLocation(zone: number, _side: CourtSide): [number, number] {
  const coords = ZONE_CENTERS[zone];
  if (!coords) {
    throw new RangeError(`Invalid zone: ${zone}`);
  }
  // Stored coords are home-oriented; away horizontal mirror happens at render time
  return coords;
}

export function applyZonePosition(
  player: { zone?: number | null; x: number; y: number },
  side: CourtSide
): { x: number; y: number } {
  if (typeof player.zone !== 'number') {
    return { x: player.x, y: player.y };
  }
  const [x, y] = getZoneLocation(player.zone, side);
  return { x, y };
}
