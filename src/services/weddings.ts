import {
  writeBatch,
  doc,
  collection,
  serverTimestamp,
  getDoc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Wedding, Side } from '../types';
import { DEFAULT_CATEGORIES, DEFAULT_EVENT_TEMPLATES } from '../domain/defaultData';

export interface CreateWeddingInput {
  brideName: string;
  groomName: string;
  weddingDate: string; // YYYY-MM-DD
  city: string;
  side: Side;
  selectedEventTypes: string[];
  totalBudgetPaise?: number;
  ownerUid: string;
  ownerDisplayName: string;
  ownerPhotoURL?: string;
}

export async function createWedding(input: CreateWeddingInput): Promise<string> {
  const weddingRef = doc(collection(db, 'weddings'));
  const wid = weddingRef.id;

  const weddingTitle = `${input.brideName} weds ${input.groomName}`;

  try {
    // 1. Establish Wedding Document with ownerId
    await setDoc(weddingRef, {
      title: weddingTitle,
      brideName: input.brideName,
      groomName: input.groomName,
      weddingDate: input.weddingDate,
      city: input.city,
      ownerId: input.ownerUid,
      sides: {
        bride: { label: 'Bride Side' },
        groom: { label: 'Groom Side' },
      },
      totalBudgetPaise: input.totalBudgetPaise || 0,
      categoryBudgets: {},
      categories: DEFAULT_CATEGORIES,
      status: 'active',
      plan: 'free',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // 2. Establish Owner Membership in weddings/{wid}/members/{uid}
    const memberRef = doc(db, 'weddings', wid, 'members', input.ownerUid);
    await setDoc(memberRef, {
      uid: input.ownerUid,
      displayName: input.ownerDisplayName,
      photoURL: input.ownerPhotoURL || '',
      role: 'owner',
      side: input.side,
      removed: false,
      joinedAt: serverTimestamp(),
    });

    // 3. Create default events for the chosen templates
    const batch = writeBatch(db);
    input.selectedEventTypes.forEach((type, index) => {
      const template = DEFAULT_EVENT_TEMPLATES.find((t) => t.type === type);
      const eventRef = doc(collection(db, 'weddings', wid, 'events'));
      batch.set(eventRef, {
        type,
        name: template ? template.name : type,
        date: type === 'wedding' ? input.weddingDate : '',
        startTime: '',
        venue: '',
        mapUrl: '',
        side: input.side,
        order: template ? template.order : index + 1,
        createdBy: input.ownerUid,
        createdAt: serverTimestamp(),
        deleted: false,
      });
    });

    // 4. Update user's weddingIds list and lastWeddingId
    const userRef = doc(db, 'users', input.ownerUid);
    const userSnap = await getDoc(userRef);
    const existingWeddingIds = userSnap.exists()
      ? userSnap.data().weddingIds || []
      : [];
    if (!existingWeddingIds.includes(wid)) {
      existingWeddingIds.push(wid);
    }
    batch.set(
      userRef,
      {
        weddingIds: existingWeddingIds,
        lastWeddingId: wid,
      },
      { merge: true }
    );

    await batch.commit();
    return wid;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `weddings/${wid}`);
    return wid;
  }
}

export async function updateWedding(
  wid: string,
  data: Partial<Wedding>
): Promise<void> {
  const path = `weddings/${wid}`;
  try {
    const weddingRef = doc(db, 'weddings', wid);
    await updateDoc(weddingRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
