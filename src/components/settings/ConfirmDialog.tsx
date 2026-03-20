import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "primary" | "destructive" | "warning";
  requireText?: string;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "primary",
  requireText,
  loading = false,
}: ConfirmDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const isConfirmEnabled = !requireText || inputValue === requireText;

  useEffect(() => {
    if (open && !requireText) {
      inputRef.current?.focus();
    }
  }, [open, requireText]);

  useEffect(() => {
    if (open && requireText) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, requireText]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setInputValue("");
    }
  }, [open]);

  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getConfirmButtonClass = () => {
    const base =
      "px-4 py-2 rounded-lg font-display text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97]";
    switch (confirmColor) {
      case "destructive":
        return `${base} bg-destructive text-destructive-foreground hover:bg-destructive/90`;
      case "warning":
        return `${base} bg-warning text-black hover:bg-warning/90`;
      default:
        return `${base} bg-primary text-primary-foreground hover:bg-primary/90`;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-xl border border-border bg-card shadow-2xl animate-scale-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 id="dialog-title" className="font-display text-lg font-bold text-foreground">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-4">{message}</p>

          {requireText && (
            <div className="mb-4">
              <label className="block text-xs font-display uppercase tracking-wider text-muted-foreground mb-2">
                Type "{requireText}" to confirm
              </label>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={requireText}
                className="w-full rounded-lg border border-border bg-input px-3 py-2 font-body text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border p-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-display text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={!isConfirmEnabled || loading}
            className={getConfirmButtonClass()}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
