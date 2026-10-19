import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  doc,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  Wedding,
  Member,
  Expense,
  Vendor,
  Gift,
  WeddingEvent,
} from '../types';
import { computeWeddingTotals, WeddingTotals } from '../domain/totals';
import { Toast, ToastMessage } from '../components/ui/Toast';

interface WeddingContextType {
  weddingId: string | null;
  wedding: Wedding | null;
  myMembership: Member | null;
  members: Member[];
  expenses: Expense[];
  vendors: Vendor[];
  gifts: Gift[];
  events: WeddingEvent[];
  totals: WeddingTotals;
  loading: boolean;
  error: string | null;
  selectWedding: (wid: string) => void;
  showToast: (text: string, onUndo?: () => void, undoLabel?: string) => void;
}

const WeddingContext = createContext<WeddingContextType | undefined>(undefined);

export const WeddingProvider: React.FC<{
  children: React.ReactNode;
  initialWeddingId?: string | null;
}> = ({ children, initialWeddingId = null }) => {
  const { user, profile } = useAuth();
  const [weddingId, setWeddingId] = useState<string | null>(
    initialWeddingId || profile?.lastWeddingId || (profile?.weddingIds?.[0] ?? null)
  );

  const [wedding, setWedding] = useState<Wedding | null>(null);
  const [myMembership, setMyMembership] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [events, setEvents] = useState<WeddingEvent[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (text: string, onUndo?: () => void, undoLabel?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, onUndo, undoLabel }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync weddingId when profile updates if not currently set
  useEffect(() => {
    if (!weddingId && profile?.lastWeddingId) {
      setWeddingId(profile.lastWeddingId);
    } else if (!weddingId && profile?.weddingIds && profile.weddingIds.length > 0) {
      setWeddingId(profile.weddingIds[0]);
    }
  }, [profile, weddingId]);

  // Main real-time subscriptions
  useEffect(() => {
    if (!weddingId || !user) {
      setWedding(null);
      setMyMembership(null);
      setMembers([]);
      setExpenses([]);
      setVendors([]);
      setGifts([]);
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    // 1. Subscribe to Wedding document
    const unsubWedding = onSnapshot(
      doc(db, 'weddings', weddingId),
      (snap) => {
        if (snap.exists()) {
          setWedding({ id: snap.id, ...snap.data() } as Wedding);
        } else {
          setWedding(null);
          setError('Wedding not found or access was removed.');
        }
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `weddings/${weddingId}`);
        setError(err.message);
        setLoading(false);
      }
    );

    // 2. Subscribe to My Membership
    const unsubMyMembership = onSnapshot(
      doc(db, 'weddings', weddingId, 'members', user.uid),
      (snap) => {
        if (snap.exists()) {
          const m = snap.data() as Member;
          setMyMembership(m);
        } else {
          setMyMembership(null);
        }
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `weddings/${weddingId}/members/${user.uid}`);
      }
    );

    // 3. Subscribe to all Members
    const unsubMembers = onSnapshot(
      collection(db, 'weddings', weddingId, 'members'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as Member).filter((m) => !m.removed);
        setMembers(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `weddings/${weddingId}/members`);
      }
    );

    // 4. Subscribe to Expenses
    const unsubExpenses = onSnapshot(
      collection(db, 'weddings', weddingId, 'expenses'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Expense))
          .filter((e) => !e.deleted)
          .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setExpenses(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `weddings/${weddingId}/expenses`);
      }
    );

    // 5. Subscribe to Vendors
    const unsubVendors = onSnapshot(
      collection(db, 'weddings', weddingId, 'vendors'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Vendor))
          .filter((v) => !v.deleted);
        setVendors(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `weddings/${weddingId}/vendors`);
      }
    );

    // 6. Subscribe to Gifts
    const unsubGifts = onSnapshot(
      collection(db, 'weddings', weddingId, 'gifts'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Gift))
          .filter((g) => !g.deleted);
        setGifts(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `weddings/${weddingId}/gifts`);
      }
    );

    // 7. Subscribe to Events
    const unsubEvents = onSnapshot(
      collection(db, 'weddings', weddingId, 'events'),
      (snap) => {
        const list = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as WeddingEvent))
          .filter((e) => !e.deleted)
          .sort((a, b) => (a.order || 0) - (b.order || 0));
        setEvents(list);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `weddings/${weddingId}/events`);
      }
    );

    return () => {
      unsubWedding();
      unsubMyMembership();
      unsubMembers();
      unsubExpenses();
      unsubVendors();
      unsubGifts();
      unsubEvents();
    };
  }, [weddingId, user]);

  const totals = useMemo(() => {
    return computeWeddingTotals(
      expenses,
      gifts,
      vendors,
      wedding?.totalBudgetPaise || 0
    );
  }, [expenses, gifts, vendors, wedding?.totalBudgetPaise]);

  const selectWedding = (wid: string) => {
    setWeddingId(wid);
  };

  return (
    <WeddingContext.Provider
      value={{
        weddingId,
        wedding,
        myMembership,
        members,
        expenses,
        vendors,
        gifts,
        events,
        totals,
        loading,
        error,
        selectWedding,
        showToast,
      }}
    >
      {children}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </WeddingContext.Provider>
  );
};

export function useWedding() {
  const context = useContext(WeddingContext);
  if (!context) {
    throw new Error('useWedding must be used within a WeddingProvider');
  }
  return context;
}
