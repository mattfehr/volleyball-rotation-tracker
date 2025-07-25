import { db } from '../firebase';
import { collection, addDoc, deleteDoc, getDocs, doc, getDoc, query, Timestamp } from 'firebase/firestore';
import type { Player } from '../models/Player';
import type { Stroke } from '../components/CanvasOverlay';

export type RotationSet = {
  title: string;
  players: Record<string, Player[]>;
  annotations: Record<string, Stroke[]>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

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

export async function getUserRotationSets(userId: string): Promise<(RotationSet & { id: string })[]> {
  const q = query(collection(db, 'users', userId, 'rotations'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as any;
}

export async function getRotationSetById(userId: string, rotationId: string): Promise<RotationSet | null> {
  const ref = doc(db, 'users', userId, 'rotations', rotationId);
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? (snapshot.data() as RotationSet) : null;
}

export async function deleteRotationSet(userId: string, rotationId: string) {
  const ref = doc(db, 'users', userId, 'rotations', rotationId);
  await deleteDoc(ref);
}
