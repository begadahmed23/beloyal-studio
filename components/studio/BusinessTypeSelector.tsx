"use client";

import { Coffee, Scissors } from "lucide-react";

import type { BusinessType } from "./studio-types";

type Props = {
  value: BusinessType;
  onChange: (value: BusinessType) => void;
  disabled?: boolean;
};

const options = [
  {
    value: "CAFE" as const,
    label: "Café",
    description: "Stamps and drink rewards",
    icon: Coffee,
  },
  {
    value: "BARBERSHOP" as const,
    label: "Barbershop",
    description: "Visits and service rewards",
    icon: Scissors,
  },
];

export default function BusinessTypeSelector({
  value,
  onChange,
  disabled = false,
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {options.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`flex min-h-20 items-center gap-4 rounded-2xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
              selected
                ? "border-[#61656C] bg-[#ECEEF1] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.08)]"
                : "border-black/[0.08] bg-white hover:border-black/[0.16] hover:bg-[#FAFAFB]"
            }`}
            aria-pressed={selected}
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                selected
                  ? "bg-[#202124] text-white"
                  : "bg-[#F0F1F3] text-[#686B72]"
              }`}
            >
              <Icon size={19} />
            </span>

            <span>
              <span className="block text-sm font-semibold text-[#252528]">
                {option.label}
              </span>
              <span className="mt-1 block text-xs text-[#85868C]">
                {option.description}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
