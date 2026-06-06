export const RECEIVE_VIEW_KEYS = ['R1', 'R2', 'R3', 'R4', 'R5', 'R6'] as const;
export const SERVE_VIEW_KEYS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] as const;
export const ROTATION_VIEW_KEYS = [...RECEIVE_VIEW_KEYS, ...SERVE_VIEW_KEYS] as const;

export type RotationViewKey = (typeof ROTATION_VIEW_KEYS)[number];

export function createRotationViewRecord<T>(
  factory: (viewKey: RotationViewKey) => T
): Record<RotationViewKey, T> {
  return Object.fromEntries(
    ROTATION_VIEW_KEYS.map((viewKey) => [viewKey, factory(viewKey)])
  ) as Record<RotationViewKey, T>;
}

export function getPreviousRotationViewKey(viewKey: RotationViewKey): RotationViewKey {
  const family = viewKey[0] as 'R' | 'S';
  const rotationNumber = Number(viewKey.slice(1));
  const previousRotationNumber = rotationNumber === 1 ? 6 : rotationNumber - 1;

  return `${family}${previousRotationNumber}` as RotationViewKey;
}

export function getRotationNumber(viewKey: RotationViewKey): number {
  return Number(viewKey.slice(1));
}
