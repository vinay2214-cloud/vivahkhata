import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Home,
  IndianRupee,
  Plus,
  Gift as GiftIcon,
  Menu,
  Mic,
  Camera,
  Users,
  Calendar,
  LogOut,
  ChevronDown,
  Sparkles,
  Store,
  Layers,
} from 'lucide-react';
import { useWedding } from '../../context/WeddingContext';
import { useAuth } from '../../context/AuthContext';
import { SyncPill } from '../ui/SyncPill';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { Avatar } from '../ui/Avatar';
import { BottomSheet } from '../ui/BottomSheet';
import { switchLanguage } from '../../i18n';

interface AppShellProps {
  currentTab: 'home' | 'money' | 'gifts' | 'more' | 'gift-desk';
  onTabChange: (tab: 'home' | 'money' | 'gifts' | 'more' | 'gift-desk') => void;
  onOpenExpenseSheet: () => void;
  onOpenGiftSheet: () => void;
  onOpenVoiceSheet: () => void;
  onOpenScanSheet: () => void;
  onOpenVendorModal: () => void;
  onOpenEventModal: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentTab,
  onTabChange,
  onOpenExpenseSheet,
  onOpenGiftSheet,
  onOpenVoiceSheet,
  onOpenScanSheet,
  onOpenVendorModal,
  onOpenEventModal,
  children,
}) => {
  const { t, i18n } = useTranslation();
  const { wedding, selectWedding } = useWedding();
  const { user, profile, signOut } = useAuth();
  const { isOnline, isSyncing, pendingWrites } = useSyncStatus();

  const [isAddActionOpen, setIsAddActionOpen] = useState(false);
  const [isWeddingMenuOpen, setIsWeddingMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const currentLang = i18n.language === 'te' ? 'te' : 'en';

  const toggleLanguage = () => {
    const nextLang = currentLang === 'en' ? 'te' : 'en';
    switchLanguage(nextLang);
  };

  const navItems = [
    { id: 'home', label: t('nav.home'), icon: <Home className="w-5 h-5" /> },
    { id: 'money', label: t('nav.money'), icon: <IndianRupee className="w-5 h-5" /> },
    { id: 'gifts', label: t('nav.gifts'), icon: <GiftIcon className="w-5 h-5" /> },
    { id: 'more', label: t('nav.more'), icon: <Menu className="w-5 h-5" /> },
  ] as const;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col lg:flex-row text-[var(--color-text)]">
      {/* Desktop Left Sidebar (>= 1024px) */}
      <aside className="hidden lg:flex flex-col w-64 bg-[var(--color-surface)] border-r border-[var(--color-border)] p-5 shrink-0 justify-between">
        <div className="flex flex-col gap-6">
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center font-serif-wedding font-bold text-xl shadow-sm">
              VK
            </div>
            <div>
              <h1 className="font-serif-wedding font-bold text-lg text-[var(--color-primary)] leading-none">
                {t('app.name')}
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] mt-1 truncate max-w-[140px]">
                {wedding?.title || 'Wedding Ledger'}
              </p>
            </div>
          </div>

          {/* Quick Add Button */}
          <button
            type="button"
            onClick={() => setIsAddActionOpen(true)}
            className="w-full py-3 px-4 rounded-xl bg-[var(--color-primary)] text-white font-semibold flex items-center justify-center gap-2 hover:opacity-95 shadow-sm active:scale-98 transition-all cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Add Entry</span>
          </button>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const active = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors cursor-pointer ${
                    active
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold'
                      : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Sync & Profile */}
        <div className="flex flex-col gap-4 pt-4 border-t border-[var(--color-border)]">
          <SyncPill isOnline={isOnline} isSyncing={isSyncing} pendingCount={pendingWrites} />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 truncate">
              <Avatar name={profile?.displayName || user?.displayName || 'User'} size="sm" />
              <div className="truncate text-xs">
                <span className="font-semibold block truncate">
                  {profile?.displayName || user?.displayName || 'User'}
                </span>
                <span className="text-[var(--color-text-muted)] capitalize">
                  {profile?.language === 'te' ? 'తెలుగు' : 'English'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleLanguage}
              className="text-xs font-semibold px-2.5 py-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-border)]"
            >
              {currentLang === 'en' ? 'తెలుగు' : 'EN'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[var(--color-surface)]/90 backdrop-blur-md border-b border-[var(--color-border)] px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          {/* Left: Wedding Selector */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-bold font-serif-wedding flex items-center justify-center shrink-0">
              VK
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold font-serif-wedding text-[var(--color-text)] truncate flex items-center gap-1.5">
                <span>{wedding?.title || 'Vivah Khata'}</span>
              </h2>
            </div>
          </div>

          {/* Right: Sync Status & Profile Menu */}
          <div className="flex items-center gap-2 shrink-0">
            <SyncPill isOnline={isOnline} isSyncing={isSyncing} pendingCount={pendingWrites} />

            <button
              type="button"
              onClick={toggleLanguage}
              aria-label="Toggle language"
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] hover:bg-[var(--color-border)] cursor-pointer"
            >
              {currentLang === 'en' ? 'తెలుగు' : 'EN'}
            </button>

            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="cursor-pointer"
              aria-label="Profile"
            >
              <Avatar
                name={profile?.displayName || user?.displayName || 'Family'}
                size="sm"
              />
            </button>
          </div>
        </header>

        {/* Profile Dropdown Sheet/Menu */}
        {isProfileMenuOpen && (
          <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)}>
            <div
              className="absolute right-4 top-14 w-64 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-xl p-3 flex flex-col gap-2 animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2 border-b border-[var(--color-border)]">
                <p className="font-bold text-sm text-[var(--color-text)]">
                  {profile?.displayName || user?.displayName || 'Family Member'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">
                  {user?.email || profile?.phone || 'Logged In'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  toggleLanguage();
                  setIsProfileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface-2)] rounded-lg font-medium cursor-pointer"
              >
                Switch Language ({currentLang === 'en' ? 'తెలుగు' : 'English'})
              </button>

              <button
                type="button"
                onClick={() => {
                  signOut();
                  setIsProfileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-red-50 rounded-lg font-medium cursor-pointer flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 pb-24 lg:pb-8 max-w-5xl w-full mx-auto p-4 sm:p-6">
          {children}
        </main>

        {/* Mobile Bottom Navigation Bar (< 1024px) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-lg border-t border-[var(--color-border)] px-3 py-1.5 flex items-center justify-around pb-[max(env(safe-area-inset-bottom),0.5rem)]">
          {/* Home */}
          <button
            type="button"
            onClick={() => onTabChange('home')}
            className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium cursor-pointer transition-colors ${
              currentTab === 'home'
                ? 'text-[var(--color-primary)] font-bold'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>{t('nav.home')}</span>
          </button>

          {/* Money */}
          <button
            type="button"
            onClick={() => onTabChange('money')}
            className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium cursor-pointer transition-colors ${
              currentTab === 'money'
                ? 'text-[var(--color-primary)] font-bold'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            <IndianRupee className="w-5 h-5" />
            <span>{t('nav.money')}</span>
          </button>

          {/* Center + Action Button */}
          <div className="relative -top-4">
            <button
              type="button"
              onClick={() => setIsAddActionOpen(true)}
              aria-label="Add entry"
              className="w-13 h-13 rounded-full bg-[var(--color-primary)] text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform cursor-pointer border-4 border-[var(--color-bg)]"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Gifts */}
          <button
            type="button"
            onClick={() => onTabChange('gifts')}
            className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium cursor-pointer transition-colors ${
              currentTab === 'gifts'
                ? 'text-[var(--color-primary)] font-bold'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            <GiftIcon className="w-5 h-5" />
            <span>{t('nav.gifts')}</span>
          </button>

          {/* More */}
          <button
            type="button"
            onClick={() => onTabChange('more')}
            className={`flex flex-col items-center gap-1 py-1 px-2 text-xs font-medium cursor-pointer transition-colors ${
              currentTab === 'more'
                ? 'text-[var(--color-primary)] font-bold'
                : 'text-[var(--color-text-muted)]'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span>{t('nav.more')}</span>
          </button>
        </nav>
      </div>

      {/* Quick Add Action BottomSheet */}
      <BottomSheet
        isOpen={isAddActionOpen}
        onClose={() => setIsAddActionOpen(false)}
        title="Add to Wedding Ledger"
      >
        <div className="grid grid-cols-2 gap-3 py-2 pb-4">
          {/* Add Expense */}
          <button
            type="button"
            onClick={() => {
              setIsAddActionOpen(false);
              onOpenExpenseSheet();
            }}
            className="flex flex-col items-center text-center p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-primary)] cursor-pointer transition-all active:scale-98"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center mb-2">
              <IndianRupee className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-[var(--color-text)]">
              Expense (ఖర్చు)
            </span>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Quick tap entry
            </span>
          </button>

          {/* Add Gift */}
          <button
            type="button"
            onClick={() => {
              setIsAddActionOpen(false);
              onOpenGiftSheet();
            }}
            className="flex flex-col items-center text-center p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-[var(--color-accent)] cursor-pointer transition-all active:scale-98"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-accent)] flex items-center justify-center mb-2">
              <GiftIcon className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-[var(--color-text)]">
              Gift (చదివింపులు)
            </span>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Cash & gold records
            </span>
          </button>

          {/* Voice Note */}
          <button
            type="button"
            onClick={() => {
              setIsAddActionOpen(false);
              onOpenVoiceSheet();
            }}
            className="flex flex-col items-center text-center p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-emerald-500 cursor-pointer transition-all active:scale-98"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
              <Mic className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-[var(--color-text)]">
              Voice Note (వాయిస్)
            </span>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Speak in Telugu / Hindi
            </span>
          </button>

          {/* Scan Bill / UPI */}
          <button
            type="button"
            onClick={() => {
              setIsAddActionOpen(false);
              onOpenScanSheet();
            }}
            className="flex flex-col items-center text-center p-4 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-purple-500 cursor-pointer transition-all active:scale-98"
          >
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
              <Camera className="w-6 h-6" />
            </div>
            <span className="font-bold text-sm text-[var(--color-text)]">
              Scan Bill / UPI
            </span>
            <span className="text-xs text-[var(--color-text-muted)] mt-0.5">
              Photo OCR extraction
            </span>
          </button>

          {/* Add Vendor */}
          <button
            type="button"
            onClick={() => {
              setIsAddActionOpen(false);
              onOpenVendorModal();
            }}
            className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-sky-500 cursor-pointer transition-all active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-1.5">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-[var(--color-text)]">
              Vendor & Dues
            </span>
          </button>

          {/* Add Event */}
          <button
            type="button"
            onClick={() => {
              setIsAddActionOpen(false);
              onOpenEventModal();
            }}
            className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] hover:border-amber-500 cursor-pointer transition-all active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1.5">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="font-bold text-xs text-[var(--color-text)]">
              Add Ceremony
            </span>
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};
