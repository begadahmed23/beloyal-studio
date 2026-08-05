"use client";

import { Smartphone, X } from "lucide-react";

type HomeScreenHelpModalProps = {
  cardBorder: string;
  cardBackground: string;
  textPrimary: string;
  textSecondary: string;
  surfaceColor: string;
  primaryColor: string;
  accentText: string;
  onClose: () => void;
};

type InstructionStepProps = {
  number: number;
  children: React.ReactNode;
  primaryColor: string;
  accentText: string;
  textSecondary: string;
};

function InstructionStep({
  number,
  children,
  primaryColor,
  accentText,
  textSecondary,
}: InstructionStepProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
        style={{
          backgroundColor: primaryColor,
          color: accentText,
        }}
      >
        {number}
      </span>

      <p className="text-sm leading-5" style={{ color: textSecondary }}>
        {children}
      </p>
    </div>
  );
}

export default function HomeScreenHelpModal({
  cardBorder,
  cardBackground,
  textPrimary,
  textSecondary,
  surfaceColor,
  primaryColor,
  accentText,
  onClose,
}: HomeScreenHelpModalProps) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-5 py-8 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Add to Home Screen instructions"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-sm rounded-[30px] border p-6 shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
        style={{
          borderColor: cardBorder,
          backgroundColor: cardBackground,
          color: textPrimary,
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close instructions"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border"
          style={{
            borderColor: cardBorder,
            backgroundColor: surfaceColor,
            color: textSecondary,
          }}
        >
          <X size={18} />
        </button>

        <Smartphone size={30} style={{ color: primaryColor }} />

        <p className="mt-5 text-xl font-semibold">Save your loyalty card</p>

        <div className="mt-5">
          <p className="text-sm font-semibold">On iPhone</p>

          <div className="mt-3 space-y-3">
            <InstructionStep
              number={1}
              primaryColor={primaryColor}
              accentText={accentText}
              textSecondary={textSecondary}
            >
              Open this card in Safari.
            </InstructionStep>

            <InstructionStep
              number={2}
              primaryColor={primaryColor}
              accentText={accentText}
              textSecondary={textSecondary}
            >
              Tap the Share button.
            </InstructionStep>

            <InstructionStep
              number={3}
              primaryColor={primaryColor}
              accentText={accentText}
              textSecondary={textSecondary}
            >
              Tap “Add to Home Screen”.
            </InstructionStep>

          </div>
        </div>

        <div
          className="my-5 h-px"
          style={{ backgroundColor: cardBorder }}
        />

        <div>
          <p className="text-sm font-semibold">On Android</p>

          <div className="mt-3 space-y-3">
            <InstructionStep
              number={1}
              primaryColor={primaryColor}
              accentText={accentText}
              textSecondary={textSecondary}
            >
              Open the browser menu.
            </InstructionStep>

            <InstructionStep
              number={2}
              primaryColor={primaryColor}
              accentText={accentText}
              textSecondary={textSecondary}
            >
              Tap “Add to Home screen” or “Install app”.
            </InstructionStep>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 h-12 w-full rounded-2xl text-sm font-semibold"
          style={{
            backgroundColor: primaryColor,
            color: accentText,
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}