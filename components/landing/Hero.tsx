import Link from "next/link";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  QrCode,
  ScanLine,
  Star,
  Users,
} from "lucide-react";

const chartBars = [38, 52, 44, 68, 57, 78, 91];

function DesktopPreview() {
  return (
    <div className="absolute left-0 right-8 top-10 overflow-hidden rounded-[28px] border border-black/[0.08] bg-white p-2.5 shadow-[0_34px_90px_-38px_rgba(28,25,21,0.35)] sm:right-14 sm:top-8">
      <div className="overflow-hidden rounded-[21px] border border-black/[0.07] bg-[#f5f4f1]">
        <div className="flex h-11 items-center border-b border-black/[0.07] bg-white px-4">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-neutral-200" />
          </div>
          <div className="mx-auto rounded-full border border-black/[0.06] bg-neutral-50 px-10 py-1.5 text-[8px] text-neutral-400 sm:px-14">
            Getbeloyal.app/dashboard
          </div>
          <div className="w-8" />
        </div>

        <div className="grid h-[354px] grid-cols-[92px_1fr] sm:grid-cols-[126px_1fr]">
          <aside className="border-r border-black/[0.07] bg-[#151614] p-3 text-white sm:p-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] font-bold text-neutral-950">
                B
              </span>
              <div className="hidden sm:block">
                <p className="text-[10px] font-semibold">BeLoyal</p>
                <p className="mt-0.5 text-[6px] uppercase tracking-[0.13em] text-white/35">
                  Business
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-1.5 text-[8px]">
              {["Overview", "Members", "Scanner", "Settings"].map(
                (item, index) => (
                  <div
                    key={item}
                    className={`rounded-lg px-2.5 py-2 ${
                      index === 0
                        ? "bg-white/10 font-medium text-white"
                        : "text-white/40"
                    }`}
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </aside>

          <div className="overflow-hidden p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[7px] font-medium uppercase tracking-[0.15em] text-neutral-400">
                  Loyalty dashboard
                </p>
                <h2 className="mt-1 text-base font-semibold tracking-[-0.035em] text-neutral-950 sm:text-xl">
                  Business overview
                </h2>
                <p className="mt-1 text-[7px] text-neutral-400 sm:text-[8px]">
                  Customers, activity, rewards, and ratings.
                </p>
              </div>
              <span className="rounded-full bg-[#657d70]/10 px-2.5 py-1 text-[7px] font-semibold text-[#526b5e]">
                Live
              </span>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { label: "Members", value: "1,248", icon: Users },
                {
                  label: "Activity",
                  value: "326",
                  icon: ChartNoAxesCombined,
                },
                { label: "Rating", value: "4.8", icon: Star },
              ].map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="rounded-xl border border-black/[0.07] bg-white p-2.5 sm:p-3"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-[6px] text-neutral-400 sm:text-[7px]">
                        {metric.label}
                      </p>
                      <Icon className="h-2.5 w-2.5 text-neutral-300 sm:h-3 sm:w-3" />
                    </div>
                    <p className="mt-2 text-sm font-semibold tracking-[-0.04em] sm:text-lg">
                      {metric.value}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-[1.35fr_0.65fr]">
              <div className="rounded-xl border border-black/[0.07] bg-white p-3">
                <div className="flex items-center justify-between">
                  <p className="text-[8px] font-semibold">Loyalty activity</p>
                  <p className="flex items-center gap-0.5 text-[7px] font-medium text-[#526b5e]">
                    +18% <ArrowUpRight size={8} />
                  </p>
                </div>
                <div className="mt-4 flex h-[76px] items-end gap-1.5 sm:gap-2">
                  {chartBars.map((height, index) => (
                    <span
                      key={index}
                      className="flex-1 rounded-t-sm bg-[#657d70] first:bg-[#c7cec9]"
                      style={{ height: `${height}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="hidden rounded-xl border border-black/[0.07] bg-[#171816] p-3 text-white sm:block">
                <p className="text-[8px] font-semibold">Quick scan</p>
                <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <ScanLine size={15} />
                </div>
                <p className="mt-4 text-[7px] leading-3 text-white/45">
                  Record loyalty activity from a phone or USB scanner.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhonePreview() {
  return (
    <div className="absolute bottom-2 right-0 w-[154px] rounded-[34px] border-[5px] border-[#111210] bg-[#111210] p-[3px] shadow-[0_28px_65px_-24px_rgba(0,0,0,0.58)] sm:bottom-0 sm:w-[172px]">
      <div className="relative h-[306px] overflow-hidden rounded-[26px] bg-[#f4f1eb] sm:h-[336px]">
        <div className="absolute left-1/2 top-2 z-20 h-4 w-14 -translate-x-1/2 rounded-full bg-[#111210]" />

        <div className="relative overflow-hidden border-b border-black/[0.08] px-4 pb-4 pt-9">
          <div className="absolute -right-9 -top-8 h-24 w-24 rounded-full bg-[#657d70]/25" />
          <div className="absolute -left-8 bottom-[-48px] h-24 w-24 rounded-full bg-[#b98552]/15" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#111210] text-[9px] font-bold text-white">
                B
              </span>
              <div>
                <p className="text-[10px] font-semibold">BeLoyal</p>
                <p className="text-[5px] font-medium uppercase tracking-[0.14em] text-neutral-500">
                  Digital loyalty card
                </p>
              </div>
            </div>
            <p className="mt-5 text-[7px] text-neutral-500">Welcome back</p>
            <p className="mt-0.5 text-base font-semibold tracking-[-0.035em]">
              Member
            </p>
          </div>
        </div>

        <div className="px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-semibold">Loyalty progress</p>
              <p className="mt-0.5 text-[6px] text-neutral-400">
                Every visit brings a reward closer
              </p>
            </div>
            <span className="rounded-full border border-black/10 bg-white/70 px-2 py-1 text-[6px] font-semibold">
              4/6
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, index) => (
              <span
                key={index}
                className={`flex aspect-square items-center justify-center rounded-lg border ${
                  index < 4
                    ? "border-[#657d70] bg-[#657d70] text-white"
                    : "border-black/[0.08] bg-white/55 text-neutral-300"
                }`}
              >
                <Star size={9} fill={index < 4 ? "currentColor" : "none"} />
              </span>
            ))}
          </div>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/[0.06]">
            <div className="h-full w-2/3 rounded-full bg-[#657d70]" />
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl border border-black/[0.07] bg-white/70 px-3 py-2.5">
            <div>
              <p className="text-[5px] uppercase tracking-[0.12em] text-neutral-400">
                Next reward
              </p>
              <p className="mt-0.5 text-[8px] font-semibold">
                Almost there
              </p>
            </div>
            <QrCode size={17} className="text-neutral-700" />
          </div>
        </div>

        <div className="absolute bottom-2 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-[#111210]" />
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#f5f3ee] px-6 pb-20 pt-16 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
      <div className="pointer-events-none absolute left-1/2 top-[-22rem] h-[46rem] w-[46rem] -translate-x-1/2 rounded-full bg-white blur-3xl" />
      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white/75 px-3 py-1.5 text-xs font-medium text-neutral-600 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#668777]" />
              Built for cafés and barbershops
            </div>
            <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.06em] text-neutral-950 sm:text-6xl lg:text-[76px]">
              Bring customers back.
              <span className="block text-neutral-400">
                Without another app.
              </span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-neutral-600 sm:text-xl">
              BeLoyal turns everyday purchases and visits into a branded
              digital loyalty experience—with QR cards, fast scanning,
              automatic rewards, and useful customer insights.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex min-h-13 items-center justify-center rounded-full bg-neutral-950 px-8 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
              >
                Start with BeLoyal
              </a>
              <Link
                href="/login"
                className="inline-flex min-h-13 items-center justify-center rounded-full border border-neutral-300 bg-white px-8 py-3.5 text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100"
              >
                Business login
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-neutral-500">
              <span className="flex items-center gap-2">
                <QrCode size={15} /> No customer download
              </span>
              <span className="flex items-center gap-2">
                <ScanLine size={15} /> Phone or USB scanning
              </span>
              <span className="flex items-center gap-2">
                <Star size={15} /> Private ratings
              </span>
            </div>
          </div>

          <div className="relative mx-auto h-[450px] w-full max-w-[660px] sm:h-[470px]">
            <div className="absolute -left-12 top-12 h-52 w-52 rounded-full bg-[#b98552]/10 blur-3xl" />
            <div className="absolute -right-12 bottom-8 h-56 w-56 rounded-full bg-[#667d71]/15 blur-3xl" />
            <DesktopPreview />
            <PhonePreview />
          </div>
        </div>

        <div className="mt-24 border-t border-black/[0.08] pt-9">
          <p className="text-sm font-medium uppercase tracking-[0.17em] text-neutral-400">
            Designed around real repeat business
          </p>
          <div className="mt-7 grid grid-cols-2 gap-x-8 gap-y-5 text-lg font-semibold tracking-[-0.03em] text-neutral-300 sm:grid-cols-3 lg:grid-cols-6">
            <p className="text-neutral-700">Cafés</p>
            <p className="text-neutral-700">Barbershops</p>
            <p>Coffee shops</p>
            <p>Salons</p>
            <p>Bakeries</p>
            <p>Hospitality</p>
          </div>
        </div>
      </div>
    </section>
  );
}
