import type { Player } from './Player';
import type { RotationViewKey } from '../lib/rotationViews';

export type Team = {
  name: string;          // e.g. "Lions Athletics"
  abbreviation: string;  // e.g. "HT"
  color: string;         // tailwind-compatible hex for player tokens, e.g. "#2563eb"
  roster: Player[];      // all players on the team (on-court + bench)
  rotations: Record<RotationViewKey, Player[]>; // on-court players per view
};
