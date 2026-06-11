import { db } from '../firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  doc,
  getDoc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import type { Player } from '../models/Player';
import type { Team } from '../models/Team';
import type { Stroke } from '../components/CanvasOverlay';
import type { RotationViewKey } from './rotationViews';
import { createRotationViewRecord, ROTATION_VIEW_KEYS } from './rotationViews';

// ─── Composite annotation key ────────────────────────────────────────────────
// Encodes the currently-selected home view + away view so strokes are tied to
// the exact tactical scenario on screen.
export type ComboAnnotationKey = `${RotationViewKey}|${RotationViewKey}`;

export function makeComboKey(
  homeView: RotationViewKey,
  awayView: RotationViewKey
): ComboAnnotationKey {
  return `${homeView}|${awayView}`;
}

// ─── Stored shape ────────────────────────────────────────────────────────────
export type RotationSet = {
  title: string;
  home: Team;
  away: Team;
  /** Sparse – only keys with at least one stroke are present. */
  annotations: Partial<Record<ComboAnnotationKey, Stroke[]>>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

// ─── Legacy doc shape (single-team, pre-dual-team redesign) ─────────────────
type LegacyRotationSet = {
  title?: string;
  players?: Partial<Record<RotationViewKey, Player[]>>;
  annotations?: Partial<Record<RotationViewKey, Stroke[]>>;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};

function makeEmptyTeam(name: string, abbreviation: string, color: string): Team {
  return {
    name,
    abbreviation,
    color,
    roster: [],
    rotations: createRotationViewRecord<Player[]>(() => []),
  };
}

/** Converts a legacy single-team doc into the dual-team shape. */
function migrateLegacy(raw: LegacyRotationSet): RotationSet {
  const homeRotations = createRotationViewRecord<Player[]>(
    (viewKey) => raw.players?.[viewKey] ?? []
  );

  // Carry forward legacy single-view annotations as home R* view pairs
  const annotations: Partial<Record<ComboAnnotationKey, Stroke[]>> = {};
  if (raw.annotations) {
    for (const key of ROTATION_VIEW_KEYS) {
      const strokes = raw.annotations[key];
      if (strokes && strokes.length > 0) {
        // Best-effort mapping: use R1 as the away anchor
        const comboKey = makeComboKey(key, 'R1');
        annotations[comboKey] = strokes;
      }
    }
  }

  return {
    title: raw.title ?? 'Untitled',
    home: {
      ...makeEmptyTeam('Home Team', 'HT', '#2563eb'),
      roster: Object.values(homeRotations).flat().filter(
        (p, idx, arr) => arr.findIndex((q) => q.id === p.id) === idx
      ),
      rotations: homeRotations,
    },
    away: makeEmptyTeam('Away Team', 'AT', '#64748b'),
    annotations,
    createdAt: raw.createdAt ?? Timestamp.now(),
    updatedAt: raw.updatedAt ?? Timestamp.now(),
  };
}

// ─── Firestore helpers ───────────────────────────────────────────────────────

export async function saveRotationSet(
  userId: string,
  data: Omit<RotationSet, 'createdAt' | 'updatedAt'>
) {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, 'users', userId, 'rotations'), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

export async function updateRotationSet(
  userId: string,
  rotationId: string,
  data: Omit<RotationSet, 'createdAt' | 'updatedAt'>
) {
  await setDoc(
    doc(db, 'users', userId, 'rotations', rotationId),
    { ...data, updatedAt: Timestamp.now() },
    { merge: true }
  );
}

export async function getUserRotationSets(
  userId: string
): Promise<(RotationSet & { id: string })[]> {
  const snapshot = await getDocs(
    collection(db, 'users', userId, 'rotations')
  );
  return snapshot.docs.map((rotDoc) => {
    const raw = rotDoc.data();
    const set: RotationSet = raw.home
      ? (raw as RotationSet)
      : migrateLegacy(raw as LegacyRotationSet);
    return { id: rotDoc.id, ...set };
  });
}

export async function getRotationSetById(
  userId: string,
  rotationId: string
): Promise<RotationSet | null> {
  const snapshot = await getDoc(
    doc(db, 'users', userId, 'rotations', rotationId)
  );
  if (!snapshot.exists()) return null;
  const raw = snapshot.data();
  return raw.home ? (raw as RotationSet) : migrateLegacy(raw as LegacyRotationSet);
}

export async function deleteRotationSet(userId: string, rotationId: string) {
  await deleteDoc(doc(db, 'users', userId, 'rotations', rotationId));
}

export async function renameRotationSet(
  userId: string,
  rotationId: string,
  title: string
) {
  await setDoc(
    doc(db, 'users', userId, 'rotations', rotationId),
    { title: title.trim() || 'Untitled', updatedAt: Timestamp.now() },
    { merge: true }
  );
}
