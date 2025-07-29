import { db } from '../firebase';
import { collection, addDoc, deleteDoc, getDocs, doc, getDoc, query, Timestamp } from 'firebase/firestore';
import type { Player } from '../models/Player';
import type { Stroke } from '../components/CanvasOverlay';

//each rotation is stored in firebase with these fields
export type RotationSet = {
  title: string;
  players: Record<string, Player[]>;      // "0: [Player, Player, ...]"
  annotations: Record<string, Stroke[]>;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

//function to save new rotation set to firestore under specific user
export async function saveRotationSet(userId: string, data: Omit<RotationSet, 'createdAt' | 'updatedAt'>) {
  const now = Timestamp.now();
  const docRef = await addDoc(collection(db, 'users', userId, 'rotations'), {   //add new document at /users/{userId}/rotations/
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id; //return document id
}

//function to get all of a users save rotation sets -> returns promise that resolves to all rotation sets with their ids
export async function getUserRotationSets(userId: string): Promise<(RotationSet & { id: string })[]> {
  const q = query(collection(db, 'users', userId, 'rotations'));  //fire store query to get all documents in /users/{userId}/rotations
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({    //spread the doc out 
    id: doc.id,
    ...doc.data(),
  })) as any;
}

//function to get a particulat rotation set
export async function getRotationSetById(userId: string, rotationId: string): Promise<RotationSet | null> {
  const ref = doc(db, 'users', userId, 'rotations', rotationId);  //build document reference and fetch it 
  const snapshot = await getDoc(ref);
  return snapshot.exists() ? (snapshot.data() as RotationSet) : null;
}

//function to delete a particular rotation set
export async function deleteRotationSet(userId: string, rotationId: string) {
  const ref = doc(db, 'users', userId, 'rotations', rotationId);
  await deleteDoc(ref);
}
