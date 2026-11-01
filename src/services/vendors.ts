import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { VendorScheduleItem } from '../types';

export interface CreateVendorInput {
  name: string;
  categoryId: string;
  contactName?: string;
  phone?: string;
  quotedPaise?: number;
  agreedPaise?: number;
  schedule?: VendorScheduleItem[];
  notes?: string;
}

export async function createVendor(
  wid: string,
  input: CreateVendorInput,
  createdByUid: string
): Promise<string> {
  const collectionPath = `weddings/${wid}/vendors`;

  const vendorData = {
    name: input.name,
    categoryId: input.categoryId,
    contactName: input.contactName || '',
    phone: input.phone || '',
    quotedPaise: input.quotedPaise || 0,
    agreedPaise: input.agreedPaise || 0,
    schedule: input.schedule || [],
    notes: input.notes || '',
    archived: false,
    createdBy: createdByUid,
    createdAt: serverTimestamp(),
    updatedBy: createdByUid,
    updatedAt: serverTimestamp(),
    deleted: false,
  };

  try {
    const docRef = await addDoc(collection(db, 'weddings', wid, 'vendors'), vendorData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
    return '';
  }
}

export async function updateVendor(
  wid: string,
  id: string,
  input: Partial<CreateVendorInput & { archived: boolean }>,
  updatedByUid: string
): Promise<void> {
  const path = `weddings/${wid}/vendors/${id}`;

  try {
    const vendorRef = doc(db, 'weddings', wid, 'vendors', id);
    await updateDoc(vendorRef, {
      ...input,
      updatedBy: updatedByUid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function softDeleteVendor(
  wid: string,
  id: string,
  deletedByUid: string
): Promise<void> {
  const path = `weddings/${wid}/vendors/${id}`;

  try {
    const vendorRef = doc(db, 'weddings', wid, 'vendors', id);
    await updateDoc(vendorRef, {
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
