import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWedding } from '../../context/WeddingContext';
import { AmountText } from '../../components/ui/AmountText';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/ui/SearchBar';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatRelativeDay } from '../../lib/dates';
import { filterExpenses, groupExpensesByDate } from '../../domain/expenseFilter';
import type { Expense } from '../../types';

interface ExpensesTabProps {
  onOpenExpenseSheet: (expense?: Expense) => void;
}

/** Searchable, category-filtered list of expenses grouped by day. */
export const ExpensesTab: React.FC<ExpensesTabProps> = ({ onOpenExpenseSheet }) => {
  const { t } = useTranslation();
  const { wedding, expenses, vendors } = useWedding();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const categories = wedding?.categories || [];

  const filteredExpenses = useMemo(
    () =>
      filterExpenses(expenses, vendors, { categoryId: selectedCategoryFilter, query: searchQuery }),
    [expenses, vendors, selectedCategoryFilter, searchQuery]
  );
  const groupedExpenses = useMemo(() => groupExpensesByDate(filteredExpenses), [filteredExpenses]);
  const filteredTotalPaise = filteredExpenses.reduce((sum, e) => sum + e.amountPaise, 0);

  return (
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
                          <Badge variant={exp.type === 'advance' ? 'accent' : 'primary'} size="sm">
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
  );
};
