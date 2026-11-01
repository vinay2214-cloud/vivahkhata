import { errorMessage } from '../lib/errors';
import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Phone, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { useWedding } from '../context/WeddingContext';
import { AmountText } from '../components/ui/AmountText';
import { Badge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/ProgressBar';
import { SearchBar } from '../components/ui/SearchBar';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { formatDate, formatRelativeDay } from '../lib/dates';
import { computeVendorBalance } from '../domain/vendorBalance';
import { Expense, Vendor } from '../types';
import { updateWedding } from '../services/weddings';
import { toPaise } from '../lib/money';

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

export const Money: React.FC<MoneyProps> = ({
  onOpenExpenseSheet,
  onOpenVendorModal,
  onRecordVendorPayment,
}) => {
  const { t } = useTranslation();
  const { weddingId, wedding, expenses, vendors, totals, showToast } = useWedding();

  const [activeTab, setActiveTab] = useState<'expenses' | 'vendors' | 'budget'>('expenses');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedModeFilter] = useState<string>('all');

  // Budget editing state
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);
  const [editingBudgetRupees, setEditingBudgetRupees] = useState<string>('');

  const categories = wedding?.categories || [];

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedCategoryFilter !== 'all' && e.categoryId !== selectedCategoryFilter) {
        return false;
      }
      if (selectedModeFilter !== 'all' && e.mode !== selectedModeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const vendorName = vendors.find((v) => v.id === e.vendorId)?.name.toLowerCase() || '';
        const matchTitle = (e.title || '').toLowerCase().includes(query);
        const matchNote = (e.note || '').toLowerCase().includes(query);
        const matchPayer = (e.paidByName || '').toLowerCase().includes(query);
        const matchCat = (e.categoryId || '').toLowerCase().includes(query);
        const matchVendor = vendorName.includes(query);
        return matchTitle || matchNote || matchPayer || matchCat || matchVendor;
      }
      return true;
    });
  }, [expenses, selectedCategoryFilter, selectedModeFilter, searchQuery, vendors]);

  // Group filtered expenses by date
  const groupedExpenses = useMemo(() => {
    const groups: Record<string, Expense[]> = {};
    for (const exp of filteredExpenses) {
      const dateKey = exp.date || 'Earlier';
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(exp);
    }
    return groups;
  }, [filteredExpenses]);

  const filteredTotalPaise = filteredExpenses.reduce((sum, e) => sum + e.amountPaise, 0);

  const handleSaveCategoryBudget = async (categoryId: string) => {
    if (!weddingId) return;
    const rupees = parseFloat(editingBudgetRupees) || 0;
    const categoryBudgets = {
      ...(wedding?.categoryBudgets || {}),
      [categoryId]: toPaise(rupees),
    };

    try {
      await updateWedding(weddingId, { categoryBudgets });
      showToast('Category budget target updated');
      setEditingBudgetId(null);
    } catch (err) {
      showToast(errorMessage(err, 'Failed to update budget'));
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      {/* 3 Tabs */}
      <div className="flex bg-[var(--color-surface)] p-1.5 rounded-2xl border border-[var(--color-border)] shadow-xs">
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'expenses'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {t('money.expenses_tab')} ({expenses.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('vendors')}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'vendors'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {t('money.vendors_tab')} ({vendors.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('budget')}
          className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
            activeTab === 'budget'
              ? 'bg-[var(--color-primary)] text-white shadow-xs'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
        >
          {t('money.budget_tab')}
        </button>
      </div>

      {/* TAB 1: EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="flex flex-col gap-4">
          {/* Search & Filters */}
          <div className="flex flex-col gap-2.5">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('money.search_expenses')}
            />

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() => setSelectedCategoryFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer shrink-0 ${
                  selectedCategoryFilter === 'all'
                    ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                }`}
              >
                All Categories
              </button>

              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setSelectedCategoryFilter(selectedCategoryFilter === cat.id ? 'all' : cat.id)
                  }
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all cursor-pointer shrink-0 ${
                    selectedCategoryFilter === cat.id
                      ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary)]'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Filtered Total Strip */}
            <div className="flex items-center justify-between px-3 py-2 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] font-medium">
              <span>{filteredExpenses.length} entries shown</span>
              <span>
                Total:{' '}
                <AmountText
                  paise={filteredTotalPaise}
                  className="font-bold text-[var(--color-text)] text-sm ml-1"
                />
              </span>
            </div>
          </div>

          {/* Expenses Grouped List */}
          {filteredExpenses.length === 0 ? (
            <EmptyState
              title="No expenses found"
              description="No records match your search or filter. Tap + below to add a new expense."
              actionLabel="+ Add Expense"
              onAction={() => onOpenExpenseSheet()}
            />
          ) : (
            <div className="flex flex-col gap-5">
              {Object.keys(groupedExpenses).map((dateKey) => (
                <div key={dateKey} className="flex flex-col gap-2">
                  <div className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-wider px-1">
                    {formatRelativeDay(dateKey)}
                  </div>

                  <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] overflow-hidden shadow-xs divide-y divide-[var(--color-border)]">
                    {groupedExpenses[dateKey].map((exp) => {
                      const category = categories.find((c) => c.id === exp.categoryId);
                      const vendor = vendors.find((v) => v.id === exp.vendorId);
                      return (
                        <div
                          key={exp.id}
                          onClick={() => onOpenExpenseSheet(exp)}
                          className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center font-bold text-xs shrink-0 uppercase">
                              {category?.label ? category.label.substring(0, 2) : 'EX'}
                            </div>

                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-[var(--color-text)] truncate">
                                {vendor?.name || category?.label || 'Expense'}
                              </h4>
                              <p className="text-xs text-[var(--color-text-muted)] truncate mt-0.5">
                                <span>{exp.paidByName}</span>
                                <span> • </span>
                                <span className="uppercase">{exp.mode}</span>
                                {exp.note && <span> • "{exp.note}"</span>}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end shrink-0 gap-1">
                            <AmountText
                              paise={exp.amountPaise}
                              className="font-bold text-sm sm:text-base text-[var(--color-text)]"
                            />
                            {exp.type && exp.type !== 'full' && (
                              <Badge
                                variant={exp.type === 'advance' ? 'accent' : 'primary'}
                                size="sm"
                              >
                                {exp.type}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VENDORS */}
      {activeTab === 'vendors' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-[var(--color-text-muted)] uppercase tracking-wider">
              Wedding Vendors ({vendors.length})
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenVendorModal()}
              icon={<Plus className="w-4 h-4" />}
            >
              {t('money.add_vendor')}
            </Button>
          </div>

          {vendors.length === 0 ? (
            <EmptyState
              title="No vendors added yet"
              description="Keep all your caterer, decorator, photographer, and mandapam contracts and due dates in one place."
              actionLabel="+ Add First Vendor"
              onAction={() => onOpenVendorModal()}
            />
          ) : (
            <div className="flex flex-col gap-3.5">
              {vendors.map((vendor) => {
                const summary = computeVendorBalance(vendor, expenses);
                const category = categories.find((c) => c.id === vendor.categoryId);
                const hasOverdue = summary.scheduleWithStatus.some((s) => s.isOverdue);

                return (
                  <div
                    key={vendor.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col gap-3.5"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4
                            onClick={() => onOpenVendorModal(vendor)}
                            className="font-bold text-base text-[var(--color-text)] hover:text-[var(--color-primary)] cursor-pointer"
                          >
                            {vendor.name}
                          </h4>
                          {hasOverdue && (
                            <Badge variant="danger" size="sm">
                              Overdue
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                          {category?.label || 'Vendor'}{' '}
                          {vendor.contactName && `• ${vendor.contactName}`}
                        </p>
                      </div>

                      {/* Phone Actions: Call / WhatsApp */}
                      {vendor.phone && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <a
                            href={`tel:${vendor.phone}`}
                            className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100"
                            aria-label={`Call ${vendor.name}`}
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                          <a
                            href={`https://wa.me/${vendor.phone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100"
                            aria-label={`WhatsApp ${vendor.name}`}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar & Balances */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[var(--color-text-muted)]">
                          Paid: <AmountText paise={summary.paidPaise} />
                        </span>
                        <span className="text-[var(--color-text)]">
                          Agreed: <AmountText paise={summary.agreedPaise} />
                        </span>
                      </div>
                      <ProgressBar value={summary.paidPaise} max={summary.agreedPaise} />
                      <div className="text-right text-xs font-bold text-[var(--color-warning)]">
                        Balance due: <AmountText paise={summary.balancePaise} />
                      </div>
                    </div>

                    {/* Payment Schedule Rows */}
                    {summary.scheduleWithStatus.length > 0 && (
                      <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border)]">
                        <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                          Installments
                        </span>
                        <div className="flex flex-col gap-1.5">
                          {summary.scheduleWithStatus.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between text-xs p-2 rounded-xl bg-[var(--color-surface-2)]"
                            >
                              <div className="flex items-center gap-2">
                                {item.status === 'paid' ? (
                                  <CheckCircle className="w-4 h-4 text-[var(--color-success)]" />
                                ) : (
                                  <Clock
                                    className={`w-4 h-4 ${
                                      item.status === 'overdue'
                                        ? 'text-[var(--color-danger)]'
                                        : 'text-[var(--color-warning)]'
                                    }`}
                                  />
                                )}
                                <span className="font-semibold text-[var(--color-text)]">
                                  {item.label}
                                </span>
                                {item.dueDate && (
                                  <span className="text-[var(--color-text-muted)] text-[11px]">
                                    ({formatDate(item.dueDate)})
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <AmountText paise={item.amountPaise} className="font-bold" />
                                {item.status !== 'paid' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      onRecordVendorPayment(
                                        vendor.id,
                                        item.id,
                                        item.amountPaise,
                                        vendor.categoryId
                                      )
                                    }
                                    className="px-2 py-0.5 text-[11px] font-bold bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-md hover:bg-[var(--color-primary)] hover:text-white transition-colors cursor-pointer"
                                  >
                                    Pay
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BUDGET */}
      {activeTab === 'budget' && (
        <div className="flex flex-col gap-5">
          {/* Total Budget Card */}
          <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">
                  Total Planned Budget
                </span>
                <AmountText
                  paise={totals.totalPlannedBudgetPaise}
                  className="text-2xl font-bold text-[var(--color-primary)]"
                />
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider block">
                  Remaining
                </span>
                <AmountText
                  paise={totals.remainingBudgetPaise}
                  className="text-xl font-bold text-[var(--color-success)]"
                />
              </div>
            </div>

            <ProgressBar
              value={totals.totalSpentPaise}
              max={totals.totalPlannedBudgetPaise}
              showLabels
            />
          </div>

          {/* Per Category Planned vs Spent Rows */}
          <div className="p-5 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-xs flex flex-col gap-4">
            <h3 className="font-bold text-sm text-[var(--color-text)] uppercase tracking-wider">
              Category Budgets & Spending
            </h3>

            <div className="flex flex-col gap-4 divide-y divide-[var(--color-border)]">
              {categories.map((cat) => {
                const spent = totals.spentByCategoryPaise[cat.id] || 0;
                const planned = wedding?.categoryBudgets?.[cat.id] || 0;
                const isOver = planned > 0 && spent > planned;

                return (
                  <div key={cat.id} className="pt-3.5 first:pt-0 flex flex-col gap-1.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-sm font-bold text-[var(--color-text)]">
                        {cat.label}
                      </span>

                      {editingBudgetId === cat.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            autoFocus
                            value={editingBudgetRupees}
                            onChange={(e) => setEditingBudgetRupees(e.target.value)}
                            className="w-24 px-2 py-1 text-xs border rounded-md"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveCategoryBudget(cat.id)}
                            className="px-2 py-1 bg-[var(--color-primary)] text-white text-xs rounded-md"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-[var(--color-text-muted)]">
                            Planned:{' '}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBudgetId(cat.id);
                                setEditingBudgetRupees((planned / 100).toString());
                              }}
                              className="underline hover:text-[var(--color-primary)] cursor-pointer"
                            >
                              <AmountText paise={planned} />
                            </button>
                          </span>
                          <span>•</span>
                          <span className={isOver ? 'text-[var(--color-danger)] font-bold' : ''}>
                            Spent: <AmountText paise={spent} />
                          </span>
                        </div>
                      )}
                    </div>

                    <ProgressBar value={spent} max={planned > 0 ? planned : spent} />

                    {isOver && (
                      <p className="text-[11px] text-[var(--color-danger)] font-semibold text-right">
                        ⚠ Over budget by <AmountText paise={spent - planned} />
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
