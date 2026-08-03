"use client";

import { Gift, Sparkles, X } from "lucide-react";

type RewardCelebrationModalProps = {
  rewardName: string;
  rewardDescription: string | null;
  onClose: () => void;
};

export default function RewardCelebrationModal({
  rewardName,
  rewardDescription,
  onClose,
}: RewardCelebrationModalProps) {
  const rewardEmeraldLight = "#2D6A5A";
  const rewardChampagne = "#D8BE82";
  const rewardIvory = "#F7EFD9";

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[#06110E]/90 px-5 py-8 backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label="Reward redeemed"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        {Array.from({ length: 30 }).map((_, index) => {
          const colors = [
            rewardChampagne,
            rewardIvory,
            rewardEmeraldLight,
            "#FFFFFF",
          ];

          return (
            <span
              key={index}
              className="reward-confetti absolute -top-8 block rounded-[2px]"
              style={{
                left: `${(index * 37) % 100}%`,
                width: `${6 + (index % 3) * 2}px`,
                height: `${10 + (index % 4) * 3}px`,
                backgroundColor: colors[index % colors.length],
                animationDelay: `${(index % 10) * 0.11}s`,
                animationDuration: `${2.7 + (index % 6) * 0.22}s`,
              }}
            />
          );
        })}
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(216,190,130,0.22) 0%, rgba(45,106,90,0.16) 38%, transparent 72%)",
        }}
      />

      <div className="reward-reveal relative w-full max-w-sm overflow-hidden rounded-[34px] border border-[#D8BE82]/35 bg-gradient-to-b from-[#173E35] via-[#0F2D27] to-[#081C18] p-7 text-center text-[#F7EFD9] shadow-[0_35px_120px_rgba(0,0,0,0.7)]">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#F7EFD9]/70 to-transparent" />
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#D8BE82]/15 blur-3xl" />

        <button
          type="button"
          onClick={onClose}
          aria-label="Close reward celebration"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[#F7EFD9]/70 transition hover:bg-white/10 hover:text-[#F7EFD9]"
        >
          <X size={18} />
        </button>

        <div className="reward-gift mx-auto mt-3 flex h-20 w-20 items-center justify-center rounded-[26px] border border-[#D8BE82]/45 bg-gradient-to-br from-[#D8BE82]/25 to-[#D8BE82]/5 shadow-[0_16px_55px_rgba(216,190,130,0.2)]">
          <Gift size={36} strokeWidth={1.6} color={rewardIvory} />
        </div>

        <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#D8BE82]">
          Reward redeemed
        </p>

        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#F7EFD9]">
          Enjoy your {rewardName || "reward"}
        </h2>

        <p className="mx-auto mt-3 max-w-[17rem] text-sm leading-6 text-[#F7EFD9]/65">
          Your reward was redeemed successfully. Your next loyalty journey
          starts now.
        </p>

        {rewardDescription ? (
          <div className="mt-6 rounded-2xl border border-[#D8BE82]/20 bg-black/10 px-4 py-3 text-sm leading-6 text-[#F7EFD9]/75">
            {rewardDescription}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#D8BE82] text-sm font-semibold text-[#102A24] shadow-[0_12px_35px_rgba(216,190,130,0.22)] transition hover:bg-[#E3CC98] active:scale-[0.99]"
        >
          <Sparkles size={17} />
          Continue
        </button>
      </div>

      <style jsx global>{`
        @keyframes reward-confetti-fall {
          0% {
            opacity: 0;
            transform: translate3d(0, -8vh, 0) rotate(0deg);
          }
          12% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate3d(35px, 108vh, 0) rotate(760deg);
          }
        }

        @keyframes reward-reveal {
          0% {
            opacity: 0;
            transform: translateY(22px) scale(0.94);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes reward-gift {
          0% {
            transform: scale(0.72) rotate(-8deg);
          }
          55% {
            transform: scale(1.08) rotate(4deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }

        .reward-confetti {
          animation-name: reward-confetti-fall;
          animation-timing-function: cubic-bezier(0.18, 0.7, 0.3, 1);
          animation-fill-mode: both;
          animation-iteration-count: 1;
        }

        .reward-reveal {
          animation: reward-reveal 560ms cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        .reward-gift {
          animation: reward-gift 720ms cubic-bezier(0.16, 1, 0.3, 1) 160ms both;
        }

        @media (prefers-reduced-motion: reduce) {
          .reward-confetti {
            display: none;
          }

          .reward-reveal,
          .reward-gift {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
