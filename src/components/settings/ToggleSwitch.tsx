import { useEffect, useRef } from "react";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function ToggleSwitch({ checked, onChange, disabled = false, label }: ToggleSwitchProps) {
  const switchRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (switchRef.current) {
      switchRef.current.setAttribute("role", "switch");
      switchRef.current.setAttribute("aria-checked", String(checked));
      switchRef.current.setAttribute("tabindex", disabled ? "-1" : "0");
    }
  }, [checked, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <button
      ref={switchRef}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      onKeyDown={handleKeyDown}
      className={`
        relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 ease-in-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
        disabled:cursor-not-allowed disabled:opacity-50
        ${checked ? "bg-primary" : "bg-muted"}
        ${disabled ? "opacity-50" : ""}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg ring-0
          transition-transform duration-200 ease-in-out
          ${checked ? "translate-x-5" : "translate-x-0"}
        `}
      >
        <span
          className={`
            absolute inset-0 flex h-full w-full items-center justify-center
            transition-opacity duration-200
            ${checked ? "opacity-100" : "opacity-0"}
          `}
        >
          <svg className="h-3 w-3 text-primary" fill="currentColor" viewBox="0 0 12 12">
            <path d="M4.5 8L2 5.5L3 4.5L4.5 6L8.5 2L9.5 3L4.5 8Z" />
          </svg>
        </span>
        <span
          className={`
            absolute inset-0 flex h-full w-full items-center justify-center
            transition-opacity duration-200
            ${checked ? "opacity-0" : "opacity-100"}
          `}
        >
          <svg className="h-2 w-2 text-muted-foreground" fill="currentColor" viewBox="0 0 12 12">
            <path d="M3 3L9 9M9 3L3 9" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
        </span>
      </span>
    </button>
  );
}
