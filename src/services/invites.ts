import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Role, Side, Invite, UserProfile } from '../types';

// 31-character alphabet (no ambiguous 0, O, 1, I)
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

export function generateInviteCode(length = 6): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * ALPHABET.length);
    result += ALPHABET[randomIndex];
  }
  return result;
}

export async function createInvite(
  weddingId: string,
  weddingTitle: string,
  role: Role,
  side: Side,
  createdByUid: string,
  createdByName: string
): Promise<Invite> {
  const code = generateInviteCode(6);
  const path = `invites/${code}`;

  // 7 days expiry
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const inviteData: Invite = {
    code,
    weddingId,
    weddingTitle,
    role,
    side,
    createdBy: createdByUid,
    createdByName,
    expiresAt: Timestamp.fromDate(expiresAt),
    revoked: false,
  };

  try {
    const inviteRef = doc(db, 'invites', code);
    await setDoc(inviteRef, inviteData);
    return inviteData;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    return inviteData;
  }
}

export async function getInvite(code: string): Promise<Invite | null> {
  const cleanCode = code.trim().toUpperCase();
  const path = `invites/${cleanCode}`;

  try {
    const snap = await getDoc(doc(db, 'invites', cleanCode));
    if (!snap.exists()) return null;
    return snap.data() as Invite;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
}

export async function revokeInvite(code: string): Promise<void> {
  const cleanCode = code.trim().toUpperCase();
  const path = `invites/${cleanCode}`;

  try {
    await updateDoc(doc(db, 'invites', cleanCode), {
      revoked: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function joinWeddingWithInvite(
  invite: Invite,
  user: UserProfile
): Promise<void> {
  const wid = invite.weddingId;
  const memberPath = `weddings/${wid}/members/${user.uid}`;

  try {
    const batch = writeBatch(db);

    // 1. Create or update membership
    const memberRef = doc(db, 'weddings', wid, 'members', user.uid);
    batch.set(memberRef, {
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL || '',
      role: invite.role,
      side: invite.side,
      inviteCode: invite.code,
      removed: false,
      joinedAt: serverTimestamp(),
    });

    // 2. Add to user profile's weddingIds list and set lastWeddingId
    const userRef = doc(db, 'users', user.uid);
    const existingWeddingIds = user.weddingIds || [];
    const updatedWeddingIds = existingWeddingIds.includes(wid)
      ? existingWeddingIds
      : [...existingWeddingIds, wid];

    batch.set(
      userRef,
      {
        weddingIds: updatedWeddingIds,
        lastWeddingId: wid,
      },
      { merge: true }
    );

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, memberPath);
  }
}
