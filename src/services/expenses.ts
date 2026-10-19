import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Expense, PaymentMode, PaymentType, Side } from '../types';

export interface CreateExpenseInput {
  amountPaise: number;
  categoryId: string;
  eventId?: string;
  vendorId?: string;
  scheduleItemId?: string;
  title?: string;
  paidByUid?: string;
  paidByName: string;
  mode: PaymentMode;
  type: PaymentType;
  date: string; // YYYY-MM-DD
  side: Side;
  note?: string;
  upiRef?: string;
  attachmentIds?: string[];
  source?: 'manual' | 'voice' | 'receipt' | 'upi';
}

export async function createExpense(
  wid: string,
  input: CreateExpenseInput,
  createdByUid: string
): Promise<string> {
  const collectionPath = `weddings/${wid}/expenses`;

  // Basic validation check
  if (input.amountPaise <= 0 || input.amountPaise > 10000000000) {
    throw new Error('Expense amount must be greater than 0 and less than ₹10 Crore');
  }

  const expenseData = {
    amountPaise: input.amountPaise,
    categoryId: input.categoryId,
    eventId: input.eventId || '',
    vendorId: input.vendorId || '',
    scheduleItemId: input.scheduleItemId || '',
    title: input.title || '',
    paidByUid: input.paidByUid || '',
    paidByName: input.paidByName,
    mode: input.mode,
    type: input.type,
    date: input.date,
    side: input.side,
    note: input.note || '',
    upiRef: input.upiRef || '',
    attachmentIds: input.attachmentIds || [],
    source: input.source || 'manual',
    createdBy: createdByUid,
    createdAt: serverTimestamp(),
    updatedBy: createdByUid,
    updatedAt: serverTimestamp(),
    deleted: false,
  };

  try {
    const docRef = await addDoc(collection(db, 'weddings', wid, 'expenses'), expenseData);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionPath);
    return '';
  }
}

export async function updateExpense(
  wid: string,
  id: string,
  input: Partial<CreateExpenseInput>,
  updatedByUid: string
): Promise<void> {
  const path = `weddings/${wid}/expenses/${id}`;

  try {
    const expenseRef = doc(db, 'weddings', wid, 'expenses', id);
    await updateDoc(expenseRef, {
      ...input,
      updatedBy: updatedByUid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function softDeleteExpense(
  wid: string,
  id: string,
  deletedByUid: string
): Promise<void> {
  const path = `weddings/${wid}/expenses/${id}`;

  try {
    const expenseRef = doc(db, 'weddings', wid, 'expenses', id);
    await updateDoc(expenseRef, {
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

export async function restoreExpense(
  wid: string,
  id: string,
  restoredByUid: string
): Promise<void> {
  const path = `weddings/${wid}/expenses/${id}`;

  try {
    const expenseRef = doc(db, 'weddings', wid, 'expenses', id);
    await updateDoc(expenseRef, {
      deleted: false,
      deletedAt: null,
      deletedBy: null,
      updatedBy: restoredByUid,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
