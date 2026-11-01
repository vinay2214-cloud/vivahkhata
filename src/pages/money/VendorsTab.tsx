import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Phone, MessageCircle, Clock, CheckCircle } from 'lucide-react';
import { useWedding } from '../../context/WeddingContext';
import { AmountText } from '../../components/ui/AmountText';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../lib/dates';
import { computeVendorBalance } from '../../domain/vendorBalance';
import type { Vendor } from '../../types';

interface VendorsTabProps {
  onOpenVendorModal: (vendor?: Vendor) => void;
  onRecordVendorPayment: (
    vendorId: string,
    scheduleItemId: string,
    amountPaise: number,
    categoryId: string
  ) => void;
}

/** Vendor cards with agreed amount, paid/balance progress and the instalment schedule. */
export const VendorsTab: React.FC<VendorsTabProps> = ({
  onOpenVendorModal,
  onRecordVendorPayment,
}) => {
  const { t } = useTranslation();
  const { wedding, expenses, vendors } = useWedding();
  const categories = wedding?.categories || [];

  return (
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
  );
};
