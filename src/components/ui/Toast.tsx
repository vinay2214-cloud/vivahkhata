import React from 'react';

export interface ToastMessage {
  id: string;
  text: string;
  onUndo?: () => void;
  undoLabel?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-[#1F1A17] text-white px-4 py-3 rounded-xl shadow-lg border border-neutral-700 flex items-center justify-between gap-3 text-sm animate-fade-in"
        >
          <span className="truncate">{toast.text}</span>
          <div className="flex items-center gap-2 shrink-0">
            {toast.onUndo && (
              <button
                type="button"
                onClick={() => {
                  toast.onUndo?.();
                  onDismiss(toast.id);
                }}
                className="text-[var(--color-accent)] font-semibold hover:underline cursor-pointer select-none"
              >
                {toast.undoLabel || 'Undo'}
              </button>
            )}
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-neutral-400 hover:text-white text-xs cursor-pointer select-none"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
