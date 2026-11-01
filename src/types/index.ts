import type { FieldValue, Timestamp } from 'firebase/firestore';

/** Firestore server timestamps arrive as Timestamp; pending writes carry a FieldValue; absent before first sync. */
export type FirestoreTime = Timestamp | FieldValue | null;

export type Role = 'owner' | 'editor' | 'contributor' | 'giftDesk' | 'viewer';
export type Side = 'bride' | 'groom' | 'common';

export type PaymentMode = 'cash' | 'upi' | 'card' | 'bank' | 'cheque';
export type PaymentType = 'full' | 'advance' | 'balance';

export interface AuditFields {
  createdBy: string;
  createdAt?: FirestoreTime;
  updatedBy?: string;
  updatedAt?: FirestoreTime;
  deleted: boolean;
  deletedAt?: FirestoreTime;
  deletedBy?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  phone?: string;
  language: 'en' | 'te' | 'hi';
  photoURL?: string;
  weddingIds: string[];
  lastWeddingId?: string;
  createdAt?: FirestoreTime;
}

export interface WeddingCategory {
  id: string;
  label: string;
  icon: string;
  hidden?: boolean;
}

export interface Wedding {
  id: string;
  title: string;
  brideName: string;
  groomName: string;
  weddingDate: string; // YYYY-MM-DD
  city: string;
  ownerId: string;
  sides: {
    bride: { label: string };
    groom: { label: string };
  };
  totalBudgetPaise?: number;
  categoryBudgets?: Record<string, number>;
  categories: WeddingCategory[];
  status: 'active' | 'archived';
  plan: 'free' | 'premium';
  createdAt?: FirestoreTime;
  updatedAt?: FirestoreTime;
}

export interface Member {
  uid: string;
  displayName: string;
  photoURL?: string;
  role: Role;
  side: Side;
  inviteCode?: string;
  removed: boolean;
  joinedAt?: FirestoreTime;
}

export interface Invite {
  code: string;
  weddingId: string;
  weddingTitle: string;
  role: Role;
  side: Side;
  createdBy: string;
  createdByName: string;
  expiresAt: FirestoreTime;
  revoked: boolean;
}

export interface WeddingEvent extends AuditFields {
  id: string;
  type:
    'engagement' | 'haldi' | 'mehendi' | 'sangeet' | 'wedding' | 'reception' | 'vratham' | 'other';
  name: string;
  date?: string;
  startTime?: string;
  venue?: string;
  mapUrl?: string;
  side?: Side;
  budgetPaise?: number;
  notes?: string;
  order: number;
}

export interface Expense extends AuditFields {
  id: string;
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
  source: 'manual' | 'voice' | 'receipt' | 'upi';
}

export interface VendorScheduleItem {
  id: string;
  label: string;
  amountPaise: number;
  dueDate: string; // YYYY-MM-DD
  paid?: boolean;
}

export interface Vendor extends AuditFields {
  id: string;
  name: string;
  categoryId: string;
  contactName?: string;
  phone?: string;
  quotedPaise?: number;
  agreedPaise?: number;
  schedule: VendorScheduleItem[];
  notes?: string;
  archived?: boolean;
}

export interface Gift extends AuditFields {
  id: string;
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
  receivedByUid?: string;
  note?: string;
  nameKey: string;
  source: 'manual' | 'voice' | 'giftDesk';
}

export interface Attachment {
  id: string;
  parentType: 'expense' | 'vendor' | 'purchase' | 'document';
  parentId: string;
  mime: string;
  dataBase64: string;
  width?: number;
  height?: number;
  createdBy: string;
  createdAt?: FirestoreTime;
}
