import Link from "next/link";

const members = [
  {
    name: "Mohamed Ahmed",
    phone: "012 3456 7890",
    stamps: 3,
  },
  {
    name: "Mariam Hassan",
    phone: "010 1234 5678",
    stamps: 2,
  },
];

function MiniStamp({ active }: { active: boolean }) {
  return (
    <span
      className={`flex aspect-square items-center justify-center rounded-lg border ${
        active
          ? "border-neutral-950 bg-neutral-950"
          : "border-neutral-200 bg-[#eceae5]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-white" : "bg-neutral-400"
        }`}
      />
    </span>
  );
}

export default function Hero() {
  return (
    <section className="overflow-hidden bg-[#f7f6f2] px-6 pb-20 pt-16 sm:pt-20 lg:px-8 lg:pb-28 lg:pt-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="mb-7 text-sm font-medium uppercase tracking-[0.18em] text-neutral-400">
              Digital loyalty for cafés
            </p>

            <h1 className="max-w-2xl text-5xl font-medium leading-[0.98] tracking-[-0.055em] text-neutral-950 sm:text-6xl lg:text-[76px]">
              Loyalty that keeps customers coming back.
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-neutral-600 sm:text-xl">
              BeLoyal gives cafés a simple digital loyalty system for customer
              cards, QR scanning, stamps and rewards without requiring a mobile
              application.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                className="inline-flex items-center justify-center rounded-full bg-black px-8 py-4 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Get BeLoyal
              </a>

              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full border border-neutral-300 bg-white px-8 py-4 text-sm font-medium text-neutral-950 transition hover:bg-neutral-100"
              >
                Log in
              </Link>
            </div>

            <p className="mt-6 text-sm text-neutral-400">
              Personal onboarding for independent cafés.
            </p>
          </div>

          <div className="relative mx-auto h-[450px] w-full max-w-[660px]">
            <div className="absolute left-0 right-10 top-12 overflow-hidden rounded-[1.9rem] border border-neutral-200 bg-white p-2.5 shadow-[0_32px_90px_-42px_rgba(0,0,0,0.3)] sm:right-14">
              <div className="overflow-hidden rounded-[1.45rem] border border-neutral-200 bg-[#f1efe9]">
                <div className="flex h-11 items-center border-b border-neutral-200 bg-white px-4">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                    <span className="h-2.5 w-2.5 rounded-full bg-neutral-300" />
                  </div>

                  <div className="mx-auto rounded-full border border-neutral-200 bg-neutral-50 px-12 py-1.5 text-[9px] text-neutral-400">
                    beloyal.app
                  </div>

                  <div className="w-8" />
                </div>

                <div className="grid h-[350px] grid-cols-[118px_1fr]">
                  <aside className="border-r border-neutral-200 bg-[#fbfaf7] p-4">
                    <div className="flex items-center gap-2 border-b border-neutral-200 pb-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ebe9e4] font-serif text-sm font-semibold">
                        L
                      </div>

                      <div className="min-w-0">
                        <p className="font-serif text-xs font-semibold">
                          Loretto
                        </p>

                        <p className="text-[7px] leading-3 text-neutral-400">
                          Loyalty dashboard
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 text-[9px]">
                      <div className="rounded-lg bg-[#e5e3de] px-2.5 py-2 font-medium text-neutral-950">
                        Members
                      </div>

                      <div className="rounded-lg px-2.5 py-2 text-neutral-500">
                        Dashboard
                      </div>

                      <div className="rounded-lg px-2.5 py-2 text-neutral-500">
                        QR Scanner
                      </div>

                      <div className="rounded-lg px-2.5 py-2 text-neutral-500">
                        Settings
                      </div>
                    </div>
                  </aside>

                  <div className="overflow-hidden p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-serif text-[9px] text-neutral-400">
                          Loretto
                        </p>

                        <h2 className="mt-0.5 font-serif text-2xl font-semibold tracking-[-0.03em] text-neutral-950">
                          Members
                        </h2>

                        <p className="mt-1.5 text-[8px] text-neutral-500">
                          Manage loyalty cards and customer visits.
                        </p>
                      </div>

                      <button
                        type="button"
                        className="shrink-0 rounded-full bg-neutral-950 px-3 py-2 text-[8px] font-medium text-white"
                      >
                        New member
                      </button>
                    </div>

                    <div className="mt-4 rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-[8px] text-neutral-400">
                      Search by name, phone or member number
                    </div>

                    <div className="mt-3 grid gap-2.5">
                      {members.map((member) => (
                        <article
                          key={member.name}
                          className="rounded-xl border border-neutral-200 bg-white p-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-serif text-xs font-semibold text-neutral-950">
                                {member.name}
                              </p>

                              <p className="mt-1 text-[7px] text-neutral-400">
                                {member.phone}
                              </p>
                            </div>

                            <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2 py-1 text-[7px] text-neutral-600">
                              {member.stamps}/7
                            </span>
                          </div>

                          <div className="mt-3 grid grid-cols-7 gap-1.5">
                            {Array.from({ length: 7 }).map((_, index) => (
                              <MiniStamp
                                key={index}
                                active={index < member.stamps}
                              />
                            ))}
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 right-0 w-[145px] rounded-[2.15rem] border-[5px] border-neutral-950 bg-neutral-950 p-[3px] shadow-[0_24px_60px_-25px_rgba(0,0,0,0.5)] sm:w-[152px]">
              <div className="relative h-[285px] overflow-hidden rounded-[1.75rem] bg-[#fdfbf6]">
                <div className="absolute left-1/2 top-2 z-20 h-4 w-14 -translate-x-1/2 rounded-full bg-neutral-950" />

                <div className="relative overflow-hidden border-b border-neutral-200 px-3.5 pb-3.5 pt-8">
                  <div className="absolute -right-7 -top-6 h-20 w-20 rounded-full bg-[#c9c7c2]" />

                  <div className="absolute -left-9 bottom-[-40px] h-20 w-20 rounded-full bg-[#dfddd8]" />

                  <div className="relative">
                    <p className="font-serif text-sm font-semibold text-neutral-950">
                      Loretto
                    </p>

                    <p className="mt-1 text-[5px] font-medium uppercase tracking-[0.15em] text-neutral-500">
                      Digital loyalty card
                    </p>

                    <p className="mt-6 font-serif text-base font-semibold tracking-[-0.03em] text-neutral-950">
                      Mohamed Ahmed
                    </p>
                  </div>
                </div>

                <div className="px-3.5 py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-serif text-[9px] font-semibold">
                      Stamp card
                    </p>

                    <span className="rounded-full border border-neutral-300 bg-neutral-100 px-1.5 py-0.5 text-[6px] font-medium">
                      3/7
                    </span>
                  </div>

                  <div className="mt-2.5 grid grid-cols-4 gap-1">
                    {Array.from({ length: 7 }).map((_, index) => (
                      <span
                        key={index}
                        className={`flex aspect-square items-center justify-center rounded-md border ${
                          index < 3
                            ? "border-neutral-950 bg-neutral-950"
                            : "border-neutral-200 bg-[#eceae5]"
                        }`}
                      >
                        <span
                          className={`h-1 w-1 rounded-full ${
                            index < 3 ? "bg-white" : "bg-neutral-400"
                          }`}
                        />
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full w-[43%] rounded-full bg-neutral-950" />
                  </div>

                  <div className="mt-3 flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-2.5 py-2">
                    <div>
                      <p className="text-[5px] uppercase tracking-[0.12em] text-neutral-400">
                        Reward
                      </p>

                      <p className="mt-0.5 font-serif text-[8px] font-semibold">
                        Free drink
                      </p>
                    </div>

                    <div className="grid h-6 w-6 grid-cols-4 gap-px rounded border border-neutral-200 bg-white p-1">
                      {Array.from({ length: 16 }).map((_, index) => (
                        <span
                          key={index}
                          className={`rounded-[1px] ${
                            [0, 1, 2, 4, 6, 8, 9, 11, 13, 14, 15].includes(
                              index,
                            )
                              ? "bg-neutral-950"
                              : "bg-white"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-3 w-full rounded-full bg-neutral-950 px-3 py-2 text-[7px] font-medium text-white"
                  >
                    Show QR code
                  </button>
                </div>

                <div className="absolute bottom-2 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-neutral-950" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 border-t border-neutral-200 pt-10">
          <p className="text-lg font-medium tracking-[-0.02em] text-neutral-900">
            A complete loyalty experience for modern hospitality businesses.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-x-8 gap-y-8 text-xl font-semibold tracking-[-0.04em] text-neutral-300 sm:grid-cols-3 lg:grid-cols-6">
            <p>Cafés</p>
            <p>Coffee shops</p>
            <p>Bakeries</p>
            <p>Restaurants</p>
            <p>Juice bars</p>
            <p>Hospitality</p>
          </div>
        </div>
      </div>
    </section>
  );
}