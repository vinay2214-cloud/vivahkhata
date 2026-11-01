import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WeddingProvider, useWedding } from './context/WeddingContext';
import { Welcome } from './pages/Welcome';
import { Start } from './pages/Start';
import { CreateWizard } from './pages/CreateWizard';
import { Dashboard } from './pages/Dashboard';
import { Money } from './pages/Money';
import { GiftRegister } from './pages/GiftRegister';
import { GiftDeskMode } from './pages/GiftDeskMode';
import { Members } from './pages/Members';
import { MoreMenu } from './pages/MoreMenu';
import { AppShell } from './components/layout/AppShell';
import { readPendingInviteCode } from './lib/pendingInvite';

import { ExpenseSheet } from './components/expense/ExpenseSheet';
import { GiftSheet } from './components/gift/GiftSheet';
import { VendorModal } from './components/vendor/VendorModal';
import { EventModal } from './components/events/EventModal';
import { VoiceRecorderSheet } from './components/ai/VoiceRecorderSheet';
import { ScanBillSheet } from './components/ai/ScanBillSheet';
import { ConfirmCard, ParsedAIDraft } from './components/ai/ConfirmCard';
import { Expense, Vendor, WeddingEvent, Gift } from './types';

function MainApp() {
  const { user, loading: authLoading } = useAuth();
  const { weddingId } = useWedding();

  const [currentView, setCurrentView] = useState<'shell' | 'create' | 'gift-desk' | 'members'>(
    'shell'
  );
  // Code from an invite link like /join/AB7K2P (kept through sign-in).
  const [pendingInvite, setPendingInvite] = useState<string | null>(() => readPendingInviteCode());
  const [currentTab, setCurrentTab] = useState<'home' | 'money' | 'gifts' | 'more' | 'gift-desk'>(
    'home'
  );

  // Modals state
  const [isExpenseSheetOpen, setIsExpenseSheetOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [defaultVendorPayment, setDefaultVendorPayment] = useState<{
    vendorId: string;
    scheduleItemId: string;
    amountPaise: number;
    categoryId: string;
  } | null>(null);

  const [isGiftSheetOpen, setIsGiftSheetOpen] = useState(false);
  const [giftToEdit, setGiftToEdit] = useState<Gift | null>(null);

  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<Vendor | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<WeddingEvent | null>(null);

  // AI Sheets
  const [isVoiceSheetOpen, setIsVoiceSheetOpen] = useState(false);
  const [isScanSheetOpen, setIsScanSheetOpen] = useState(false);
  const [aiDraft, setAiDraft] = useState<ParsedAIDraft | null>(null);
  const [isConfirmCardOpen, setIsConfirmCardOpen] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-xl font-serif-wedding animate-pulse">
            VK
          </div>
          <p className="text-sm font-semibold text-[var(--color-text-muted)]">
            Loading Vivah Khata…
          </p>
        </div>
      </div>
    );
  }

  // If not signed in, show Welcome screen
  if (!user) {
    return <Welcome onSuccess={() => {}} />;
  }

  // If creating new wedding
  if (currentView === 'create') {
    return (
      <CreateWizard
        onBack={() => setCurrentView('shell')}
        onSuccess={() => {
          setCurrentView('shell');
          setCurrentTab('home');
        }}
      />
    );
  }

  // If no wedding selected or user has no weddings yet
  if (!weddingId || pendingInvite) {
    return (
      <Start
        initialCode={pendingInvite}
        onBack={weddingId ? () => setPendingInvite(null) : undefined}
        onCreateNew={() => {
          setPendingInvite(null);
          setCurrentView('create');
        }}
        onJoinSuccess={() => {
          setPendingInvite(null);
          setCurrentView('shell');
          setCurrentTab('home');
        }}
      />
    );
  }

  // Fullscreen Gift Desk Mode (no shell navigation)
  if (currentTab === 'gift-desk' || currentView === 'gift-desk') {
    return (
      <GiftDeskMode
        onExit={() => {
          setCurrentTab('gifts');
          setCurrentView('shell');
        }}
      />
    );
  }

  const handleOpenExpenseForVendor = (
    vendorId: string,
    scheduleItemId: string,
    amountPaise: number,
    categoryId: string
  ) => {
    setExpenseToEdit(null);
    setDefaultVendorPayment({ vendorId, scheduleItemId, amountPaise, categoryId });
    setIsExpenseSheetOpen(true);
  };

  const handleAiParsed = (draft: ParsedAIDraft) => {
    setAiDraft(draft);
    setIsConfirmCardOpen(true);
  };

  return (
    <>
      <AppShell
        currentTab={currentTab}
        onTabChange={(tab) => {
          if (tab === 'gift-desk') {
            setCurrentTab('gift-desk');
          } else {
            setCurrentTab(tab);
            setCurrentView('shell');
          }
        }}
        onOpenExpenseSheet={() => {
          setExpenseToEdit(null);
          setDefaultVendorPayment(null);
          setIsExpenseSheetOpen(true);
        }}
        onOpenGiftSheet={() => {
          setGiftToEdit(null);
          setIsGiftSheetOpen(true);
        }}
        onOpenVoiceSheet={() => setIsVoiceSheetOpen(true)}
        onOpenScanSheet={() => setIsScanSheetOpen(true)}
        onOpenVendorModal={() => {
          setVendorToEdit(null);
          setIsVendorModalOpen(true);
        }}
        onOpenEventModal={() => {
          setEventToEdit(null);
          setIsEventModalOpen(true);
        }}
      >
        {currentView === 'members' ? (
          <Members />
        ) : (
          <>
            {currentTab === 'home' && (
              <Dashboard
                onNavigateTab={(tab) => setCurrentTab(tab)}
                onOpenExpenseSheet={() => {
                  setExpenseToEdit(null);
                  setDefaultVendorPayment(null);
                  setIsExpenseSheetOpen(true);
                }}
                onOpenGiftSheet={() => {
                  setGiftToEdit(null);
                  setIsGiftSheetOpen(true);
                }}
                onOpenVendorModal={() => {
                  setVendorToEdit(null);
                  setIsVendorModalOpen(true);
                }}
                onOpenInviteModal={() => setCurrentView('members')}
              />
            )}

            {currentTab === 'money' && (
              <Money
                onOpenExpenseSheet={(exp) => {
                  setExpenseToEdit(exp || null);
                  setDefaultVendorPayment(null);
                  setIsExpenseSheetOpen(true);
                }}
                onOpenVendorModal={(v) => {
                  setVendorToEdit(v || null);
                  setIsVendorModalOpen(true);
                }}
                onRecordVendorPayment={handleOpenExpenseForVendor}
              />
            )}

            {currentTab === 'gifts' && (
              <GiftRegister
                onOpenGiftDesk={() => setCurrentTab('gift-desk')}
                onOpenGiftSheet={(g) => {
                  setGiftToEdit(g || null);
                  setIsGiftSheetOpen(true);
                }}
              />
            )}

            {currentTab === 'more' && (
              <MoreMenu
                onOpenEventModal={(ev) => {
                  setEventToEdit(ev || null);
                  setIsEventModalOpen(true);
                }}
                onOpenMembers={() => setCurrentView('members')}
              />
            )}
          </>
        )}
      </AppShell>

      {/* Global Modals & Sheets */}
      <ExpenseSheet
        isOpen={isExpenseSheetOpen}
        onClose={() => {
          setIsExpenseSheetOpen(false);
          setExpenseToEdit(null);
          setDefaultVendorPayment(null);
        }}
        expenseToEdit={expenseToEdit}
        defaultVendorId={defaultVendorPayment?.vendorId}
        defaultScheduleItemId={defaultVendorPayment?.scheduleItemId}
        defaultAmountPaise={defaultVendorPayment?.amountPaise}
        defaultCategoryId={defaultVendorPayment?.categoryId}
        defaultType={defaultVendorPayment ? 'advance' : 'full'}
      />

      <GiftSheet
        isOpen={isGiftSheetOpen}
        onClose={() => {
          setIsGiftSheetOpen(false);
          setGiftToEdit(null);
        }}
        giftToEdit={giftToEdit}
      />

      <VendorModal
        isOpen={isVendorModalOpen}
        onClose={() => {
          setIsVendorModalOpen(false);
          setVendorToEdit(null);
        }}
        vendorToEdit={vendorToEdit}
      />

      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEventToEdit(null);
        }}
        eventToEdit={eventToEdit}
      />

      {/* AI Sheets */}
      <VoiceRecorderSheet
        isOpen={isVoiceSheetOpen}
        onClose={() => setIsVoiceSheetOpen(false)}
        onParsed={handleAiParsed}
      />

      <ScanBillSheet
        isOpen={isScanSheetOpen}
        onClose={() => setIsScanSheetOpen(false)}
        onParsed={handleAiParsed}
      />

      <ConfirmCard
        isOpen={isConfirmCardOpen}
        onClose={() => {
          setIsConfirmCardOpen(false);
          setAiDraft(null);
        }}
        draft={aiDraft}
      />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <WeddingProvider>
        <MainApp />
      </WeddingProvider>
    </AuthProvider>
  );
}
