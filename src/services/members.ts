import { doc, updateDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Role, Side } from '../types';

export async function updateMemberRole(
  wid: string,
  uid: string,
  role: Role,
  side: Side
): Promise<void> {
  const path = `weddings/${wid}/members/${uid}`;
  try {
    await updateDoc(doc(db, 'weddings', wid, 'members', uid), {
      role,
      side,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function removeMember(wid: string, uid: string): Promise<void> {
  const path = `weddings/${wid}/members/${uid}`;
  try {
    // Soft remove to maintain audit integrity and instantly revoke Firestore rules access
    await updateDoc(doc(db, 'weddings', wid, 'members', uid), {
      removed: true,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
