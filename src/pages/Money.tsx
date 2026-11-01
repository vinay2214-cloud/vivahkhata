import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWedding } from '../context/WeddingContext';
import { ExpensesTab } from './money/ExpensesTab';
import { VendorsTab } from './money/VendorsTab';
import { BudgetTab } from './money/BudgetTab';
import type { Expense, Vendor } from '../types';

interface MoneyProps {
  onOpenExpenseSheet: (expense?: Expense) => void;
  onOpenVendorModal: (vendor?: Vendor) => void;
  onRecordVendorPayment: (
    vendorId: string,
    scheduleItemId: string,
    amountPaise: number,
    categoryId: string
  ) => void;
}

type MoneyTab = 'expenses' | 'vendors' | 'budget';

/** Money screen: a tab bar switching between expenses, vendors and budget. */
export const Money: React.FC<MoneyProps> = ({
  onOpenExpenseSheet,
  onOpenVendorModal,
  onRecordVendorPayment,
}) => {
  const { t } = useTranslation();
  const { expenses, vendors } = useWedding();
  const [activeTab, setActiveTab] = useState<MoneyTab>('expenses');

  const tabs: { id: MoneyTab; label: string }[] = [
    { id: 'expenses', label: `${t('money.expenses_tab')} (${expenses.length})` },
    { id: 'vendors', label: `${t('money.vendors_tab')} (${vendors.length})` },
    { id: 'budget', label: t('money.budget_tab') },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <div className="flex bg-[var(--color-surface)] p-1.5 rounded-2xl border border-[var(--color-border)] shadow-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'expenses' && <ExpensesTab onOpenExpenseSheet={onOpenExpenseSheet} />}
      {activeTab === 'vendors' && (
        <VendorsTab
          onOpenVendorModal={onOpenVendorModal}
          onRecordVendorPayment={onRecordVendorPayment}
        />
      )}
      {activeTab === 'budget' && <BudgetTab />}
    </div>
  );
};
