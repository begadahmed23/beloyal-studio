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

        <p className="mt-5 text-xl font-semibold">Add to Home Screen</p>
        <p
          className="mt-2 text-sm leading-6"
          style={{ color: textSecondary }}
        >
          On iPhone: open this card in Safari, tap the Share button, choose
          “Add to Home Screen”, then tap “Add”.
        </p>

        <p
          className="mt-4 text-sm leading-6"
          style={{ color: textSecondary }}
        >
          On Android: open the browser menu and choose “Add to Home screen” or
          “Install app”.
        </p>

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
