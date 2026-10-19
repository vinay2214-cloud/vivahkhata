import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { WeddingEvent, Side } from '../types';

export interface CreateEventInput {
  type: WeddingEvent['type'];
  name: string;
  date?: string;
  startTime?: string;
  venue?: string;
  mapUrl?: string;
  side?: Side;
  budgetPaise?: number;
  notes?: string;
  order?: number;
}

export async function createWeddingEvent(
  wid: string,
  input: CreateEventInput,
  createdByUid: string
): Promise<string> {
  const collectionPath = `weddings/${wid}/events`;

  const eventData = {
    type: input.type,
    name: input.name,
    date: input.date || '',
    startTime: input.startTime || '',
    venue: input.venue || '',
    mapUrl: input.mapUrl || '',
    side: input.side || 'common',
    budgetPaise: input.budgetPaise || 0,
    notes: input.notes || '',
    order: input.order || 99,
    createdBy: createdByUid,
    createdAt: serverTimestamp(),
    updatedBy: createdByUid,
    updatedAt: serverTimestamp(),
    deleted: false,
  };

  try {
    const docRef = await addDoc(collection(db, 'weddings', wid, 'events'), eventData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
    return '';
  }
}

export async function updateWeddingEvent(
  wid: string,
  id: string,
  input: Partial<CreateEventInput>,
  updatedByUid: string
): Promise<void> {
  const path = `weddings/${wid}/events/${id}`;

  try {
    const eventRef = doc(db, 'weddings', wid, 'events', id);
    await updateDoc(eventRef, {
      ...input,
      updatedBy: updatedByUid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function softDeleteWeddingEvent(
  wid: string,
  id: string,
  deletedByUid: string
): Promise<void> {
  const path = `weddings/${wid}/events/${id}`;

  try {
    const eventRef = doc(db, 'weddings', wid, 'events', id);
    await updateDoc(eventRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: deletedByUid,
      updatedBy: deletedByUid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
