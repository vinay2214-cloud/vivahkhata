import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Gift, Side } from '../types';

export interface CreateGiftInput {
  envelopeNo?: number;
  giverName: string;
  relation?: string;
  town?: string;
  phone?: string;
  side: Side;
  eventId?: string;
  cashPaise: number;
  goldMg?: number;
  goldDescription?: string;
  items?: string;
  note?: string;
  source?: 'manual' | 'voice' | 'giftDesk';
}

export { generateNameKey } from '../lib/names';
import { generateNameKey } from '../lib/names';

export async function createGift(
  wid: string,
  input: CreateGiftInput,
  createdByUid: string
): Promise<string> {
  const collectionPath = `weddings/${wid}/gifts`;

  if (!input.giverName.trim()) {
    throw new Error('Giver name is required');
  }

  const giftData = {
    envelopeNo: input.envelopeNo || 0,
    giverName: input.giverName.trim(),
    relation: input.relation?.trim() || '',
    town: input.town?.trim() || '',
    phone: input.phone?.trim() || '',
    side: input.side,
    eventId: input.eventId || '',
    cashPaise: input.cashPaise >= 0 ? input.cashPaise : 0,
    goldMg: input.goldMg || 0,
    goldDescription: input.goldDescription?.trim() || '',
    items: input.items?.trim() || '',
    receivedByUid: createdByUid,
    note: input.note?.trim() || '',
    nameKey: generateNameKey(input.giverName),
    source: input.source || 'manual',
    createdBy: createdByUid,
    createdAt: serverTimestamp(),
    updatedBy: createdByUid,
    updatedAt: serverTimestamp(),
    deleted: false,
  };

  try {
    const docRef = await addDoc(collection(db, 'weddings', wid, 'gifts'), giftData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
    return '';
  }
}

export async function updateGift(
  wid: string,
  id: string,
  input: Partial<CreateGiftInput>,
  updatedByUid: string
): Promise<void> {
  const path = `weddings/${wid}/gifts/${id}`;

  const updatePayload: any = {
    ...input,
    updatedBy: updatedByUid,
    updatedAt: serverTimestamp(),
  };

  if (input.giverName) {
    updatePayload.nameKey = generateNameKey(input.giverName);
  }

  try {
    const giftRef = doc(db, 'weddings', wid, 'gifts', id);
    await updateDoc(giftRef, updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function softDeleteGift(
  wid: string,
  id: string,
  deletedByUid: string
): Promise<void> {
  const path = `weddings/${wid}/gifts/${id}`;

  try {
    const giftRef = doc(db, 'weddings', wid, 'gifts', id);
    await updateDoc(giftRef, {
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
