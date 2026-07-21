import LogoutButton from "@/components/auth/LogoutButton";
import StudioDashboard from "@/components/studio/StudioDashboard";

export default function StudioPage() {
  return (
    <main className="min-h-screen bg-[#0A0D12] text-[#F4F7FB]">
      <div className="mx-auto max-w-[1500px] px-5 py-7 sm:px-7 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-[#202938] pb-7 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#7C5CFC]">
              Platform administration
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#F4F7FB]">
              Studio
            </h1>

            <p className="mt-2 text-sm text-[#8B96A8]">
              Manage cafés, trials, subscriptions, and revenue.
            </p>
          </div>

          <LogoutButton />
        </header>

        <section className="py-8">
          <StudioDashboard />
        </section>
      </div>
    </main>
  );
}