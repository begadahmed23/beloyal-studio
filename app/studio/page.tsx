import LogoutButton from "@/components/auth/LogoutButton";
import StudioDashboard from "@/components/studio/StudioDashboard";

export default function StudioPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F5F5F7] text-[#171719]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-gradient-to-b from-white via-[#FAFAFB] to-transparent" />

      <div className="pointer-events-none absolute -left-48 top-10 h-96 w-96 rounded-full bg-white blur-3xl" />

      <div className="pointer-events-none absolute -right-40 top-0 h-96 w-96 rounded-full bg-[#DDE2EA]/40 blur-3xl" />

      <div className="relative mx-auto max-w-[1500px] px-5 pb-12 pt-5 sm:px-7 lg:px-10">
        <header className="rounded-[28px] border border-black/[0.07] bg-white/85 px-5 py-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:px-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-black/[0.08] bg-gradient-to-br from-white via-[#F0F1F3] to-[#C9CDD3] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_20px_rgba(15,23,42,0.09)]">
                <div className="absolute inset-[1px] rounded-[15px] border border-white/70" />

                <span className="relative text-lg font-semibold tracking-[-0.05em] text-[#202124]">
                  B
                </span>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-lg font-semibold tracking-[-0.03em] text-[#171719]">
                    BeLoyal Studio
                  </p>

                  <span className="rounded-full border border-black/[0.07] bg-[#F3F4F6] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#74747B]">
                    Admin
                  </span>
                </div>

                <p className="mt-1 text-sm text-[#77777E]">
                  Platform administration
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden rounded-full border border-black/[0.07] bg-[#F7F7F8] px-3 py-2 text-xs text-[#77777E] md:block">
                Secure super-admin access
              </div>

              <LogoutButton />
            </div>
          </div>
        </header>

        <section className="pb-7 pt-10 sm:pt-12">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="h-px w-7 bg-[#A8ABB1]" />

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#8A8A91]">
                Executive overview
              </p>
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em] text-[#171719] sm:text-5xl">
              Your loyalty platform,
              <span className="bg-gradient-to-r from-[#5F6368] via-[#A1A5AB] to-[#4B4E53] bg-clip-text text-transparent">
                {" "}
                clearly managed.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-[#68686F] sm:text-base">
              Manage business accounts, subscriptions, customer
              activity, and platform performance from one place.
            </p>
          </div>
        </section>

        <StudioDashboard />
      </div>
    </main>
  );
}
