import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxHeight = 'max-h-[90vh]',
}) => {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  // Keep the latest onClose without re-running the focus effect on every render
  // (re-running would steal focus from the field the user is typing in).
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Accessibility: Escape closes; focus moves into the sheet and returns to the opener afterwards.
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in">
      {/* Backdrop click to dismiss */}
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : 'Dialog'}
        tabIndex={-1}
        className={`relative z-10 w-full max-w-lg bg-[var(--color-surface)] rounded-t-3xl border-t border-[var(--color-border)] shadow-2xl flex flex-col ${maxHeight} overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-full flex justify-center pt-3 pb-1" aria-hidden="true">
          <div className="w-12 h-1.5 bg-[var(--color-border)] rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--color-border)]">
            <h2 id={titleId} className="text-lg font-bold text-[var(--color-text)]">{title}</h2>
            <IconButton
              aria-label="Close"
              size="sm"
              onClick={onClose}
              className="text-[var(--color-text-muted)]"
            >
              <X className="w-5 h-5" />
            </IconButton>
          </div>
        )}

        {/* Body */}
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
