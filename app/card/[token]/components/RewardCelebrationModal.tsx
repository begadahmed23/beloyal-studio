"use client";

import { Gift, Sparkles, X } from "lucide-react";

import KatoMark from "@/components/brand/KatoMark";

type RewardCelebrationModalProps = {
  rewardName: string;
  rewardDescription: string | null;
  cafeName?: string;
  cafeSlug?: string;
  onClose: () => void;
};

export default function RewardCelebrationModal({
  rewardName,
  rewardDescription,
  cafeName = "",
  cafeSlug = "",
  onClose,
}: RewardCelebrationModalProps) {
  const normalizedName = cafeName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isKato =
    cafeSlug.toLowerCase().includes("kato") ||
    normalizedName.includes("kato");
  const isKeka =
    cafeSlug.toLowerCase().includes("keka") ||
    normalizedName.includes("keka");

  if (isKeka) {
    return (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[#3A080A]/95 px-4 py-7 backdrop-blur-2xl sm:px-5 sm:py-8"
        role="dialog"
        aria-modal="true"
        aria-label="Keka reward redeemed"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(244,229,198,0.17),transparent_27%),radial-gradient(circle_at_50%_76%,rgba(138,36,38,0.42),transparent_42%)]" />

        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 26 }).map((_, index) => (
            <span
              key={index}
              className="keka-confetti absolute -top-8 block rounded-full"
              style={{
                left: `${(index * 43) % 100}%`,
                width: `${4 + (index % 3) * 2}px`,
                height: `${4 + (index % 3) * 2}px`,
                backgroundColor: index % 3 === 0 ? "#FFF6E6" : index % 3 === 1 ? "#F4E5C6" : "#A53A3D",
                animationDelay: `${(index % 9) * 0.08}s`,
                animationDuration: `${2.2 + (index % 5) * 0.18}s`,
              }}
            />
          ))}
        </div>

        <div className="keka-reward relative w-full max-w-sm overflow-hidden rounded-[32px] border border-[#F4E5C6]/20 bg-[linear-gradient(155deg,#8A2426_0%,#741A1D_54%,#4A0D10_100%)] p-6 text-center text-[#FFF6E6] shadow-[0_40px_130px_rgba(25,2,4,0.68)] sm:rounded-[36px] sm:p-7">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#F4E5C6]/80 to-transparent" />

          <button type="button" onClick={onClose} aria-label="Close reward celebration" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-[#F4E5C6]/15 bg-black/10 text-[#F4E5C6]/70 transition hover:bg-black/15">
            <X size={18} />
          </button>

          <div className="keka-reward-mark mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-[30px] border border-[#F4E5C6]/20 bg-[#F4E5C6] text-[#741A1D] shadow-[0_18px_60px_rgba(244,229,198,0.18)]">
            <span className="text-5xl font-semibold leading-none" dir="rtl">ك</span>
          </div>

          <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#F4E5C6]/60">Keka ritual complete</p>
          <h2 className="mt-3 font-serif text-[2rem] font-semibold leading-tight text-[#FFF6E6]">Enjoy your {rewardName || "reward"}</h2>
          <p className="mx-auto mt-3 max-w-[18rem] text-sm leading-6 text-[#F4E5C6]/70">Your reward was redeemed. A new little ritual starts now.</p>

          {rewardDescription ? (
            <div className="mt-6 rounded-2xl border border-[#F4E5C6]/12 bg-black/10 px-4 py-3 text-sm leading-6 text-[#F4E5C6]/75">{rewardDescription}</div>
          ) : null}

          <p className="mt-7 font-serif text-sm italic text-[#F4E5C6]/55">Little Rituals, Big Comfort</p>

          <button type="button" onClick={onClose} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#F4E5C6] text-sm font-semibold text-[#4A0D10] shadow-[0_14px_40px_rgba(244,229,198,0.16)] transition hover:brightness-105 active:scale-[0.99]">
            <Sparkles size={17} />
            Continue
          </button>
        </div>

        <style jsx global>{`
          @keyframes keka-reward-in {
            0% { opacity: 0; transform: translateY(22px) scale(0.91); }
            65% { opacity: 1; transform: translateY(-3px) scale(1.02); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes keka-reward-mark {
            0% { opacity: 0; transform: scale(0.65) rotate(-8deg); }
            60% { opacity: 1; transform: scale(1.09) rotate(3deg); }
            100% { opacity: 1; transform: scale(1) rotate(0); }
          }
          @keyframes keka-confetti-fall {
            0% { opacity: 0; transform: translate3d(0,-8vh,0) scale(.7); }
            12% { opacity: 1; }
            100% { opacity: 0; transform: translate3d(24px,108vh,0) scale(1); }
          }
          .keka-reward { animation: keka-reward-in 620ms cubic-bezier(.16,1,.3,1) both; }
          .keka-reward-mark { animation: keka-reward-mark 760ms cubic-bezier(.16,1,.3,1) 100ms both; }
          .keka-confetti { animation-name: keka-confetti-fall; animation-timing-function: cubic-bezier(.18,.7,.3,1); animation-fill-mode: both; }
          @media (prefers-reduced-motion: reduce) { .keka-reward,.keka-reward-mark,.keka-confetti { animation: none; } }
        `}</style>
      </div>
    );
  }

  if (isKato) {
    return (
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-[#06172B]/96 px-5 py-8 backdrop-blur-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Kato reward unlocked"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(255,255,255,0.18),transparent_24%),radial-gradient(circle_at_50%_70%,rgba(68,139,255,0.18),transparent_36%)]" />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          {Array.from({ length: 24 }).map((_, index) => (
            <span
              key={index}
              className="kato-confetti absolute -top-8 block rounded-full bg-white"
              style={{
                left: `${(index * 41) % 100}%`,
                width: `${4 + (index % 3) * 2}px`,
                height: `${4 + (index % 3) * 2}px`,
                animationDelay: `${(index % 8) * 0.08}s`,
                animationDuration: `${2.1 + (index % 5) * 0.18}s`,
                opacity: 0.85,
              }}
            />
          ))}
        </div>

        <div className="kato-reward relative w-full max-w-sm overflow-hidden rounded-[36px] border border-white/20 bg-gradient-to-b from-[#16395C] via-[#102B49] to-[#081D36] p-7 text-center text-white shadow-[0_40px_140px_rgba(0,0,0,0.62)]">
          <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
          <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-20 h-64 w-64 rounded-full bg-[#5F9CFF]/20 blur-3xl" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Close reward celebration"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>

          <div className="kato-reward-mark mx-auto mt-3 flex h-24 w-24 items-center justify-center rounded-[30px] border border-white/15 bg-white text-[#0B2343] shadow-[0_18px_60px_rgba(255,255,255,0.18)]">
            <KatoMark size={58} />
          </div>

          <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.34em] text-white/60">
            KATŌ reward unlocked
          </p>

          <h2 className="mt-3 text-[2.25rem] font-semibold leading-none tracking-[-0.055em] text-white">
            FREE DRINK
          </h2>

          <p className="mx-auto mt-3 max-w-[18rem] text-sm leading-6 text-white/70">
            You completed your loyalty card. Your {rewardName || "reward"} is ready.
          </p>

          {rewardDescription ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-6 text-white/75">
              {rewardDescription}
            </div>
          ) : null}

          <div className="mt-7 flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/55">
            <Sparkles size={15} />
            Show this screen to the cashier
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-[#0B2343] shadow-[0_14px_40px_rgba(255,255,255,0.16)] transition hover:brightness-95 active:scale-[0.99]"
          >
            Continue
          </button>
        </div>

        <style jsx global>{`
          @keyframes kato-reward-in {
            0% {
              opacity: 0;
              transform: translateY(24px) scale(0.9);
            }
            65% {
              opacity: 1;
              transform: translateY(-3px) scale(1.02);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes kato-reward-mark {
            0% {
              transform: scale(0.68) rotate(-10deg);
              opacity: 0;
            }
            60% {
              transform: scale(1.08) rotate(3deg);
              opacity: 1;
            }
            100% {
              transform: scale(1) rotate(0deg);
              opacity: 1;
            }
          }

          @keyframes kato-confetti-fall {
            0% {
              transform: translate3d(0, -8vh, 0) scale(0.7);
              opacity: 0;
            }
            12% {
              opacity: 1;
            }
            100% {
              transform: translate3d(28px, 108vh, 0) scale(1);
              opacity: 0;
            }
          }

          .kato-reward {
            animation: kato-reward-in 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .kato-reward-mark {
            animation: kato-reward-mark 760ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both;
          }

          .kato-confetti {
            animation-name: kato-confetti-fall;
            animation-timing-function: cubic-bezier(0.18, 0.7, 0.3, 1);
            animation-fill-mode: both;
          }

          @media (prefers-reduced-motion: reduce) {
            .kato-reward,
            .kato-reward-mark,
            .kato-confetti {
              animation: none;
            }
          }
        `}</style>
      </div>
    );
  }
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
