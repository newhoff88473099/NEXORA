"use client";

import { Check, X, Minus } from "lucide-react";

type Props = {
  value: string | null;
  onChange: (v: string) => void;
  disabled?: boolean;
};

const BUTTONS = [
  {
    value: "conforme",
    label: "CONFORME",
    icon: Check,
    active: "bg-[var(--ok)] text-white border-[var(--ok)]",
    hover: "hover:border-[var(--ok)] hover:text-[var(--ok)]",
  },
  {
    value: "nc",
    label: "NC",
    icon: X,
    active: "bg-[var(--nc)] text-white border-[var(--nc)]",
    hover: "hover:border-[var(--nc)] hover:text-[var(--nc)]",
  },
  {
    value: "na",
    label: "N.A.",
    icon: Minus,
    active: "bg-[var(--na)] text-white border-[var(--na)]",
    hover: "hover:border-[var(--na)] hover:text-[var(--na)]",
  },
] as const;

export function AnswerButtons({ value, onChange, disabled }: Props) {
  return (
    <div className="flex gap-2">
      {BUTTONS.map(({ value: v, label, icon: Icon, active, hover }) => {
        const isActive = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => !disabled && onChange(v)}
            disabled={disabled}
            className={`
              flex-1 flex items-center justify-center gap-1.5
              min-h-[48px] rounded border text-sm font-medium
              transition-all
              ${isActive ? active : `border-border text-muted-foreground bg-background ${hover}`}
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
