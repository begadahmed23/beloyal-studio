import Link from "next/link";

export default function Contact() {
  return (
    <section
      id="contact"
      className="border-t border-neutral-200 px-6 py-24 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="rounded-[2.5rem] bg-neutral-100 px-6 py-16 text-center sm:px-12 lg:px-20 lg:py-24">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-400">
            Café onboarding
          </p>

          <h2 className="mx-auto mt-5 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.055em] sm:text-5xl lg:text-7xl">
            A loyalty platform built around repeat visits.
          </h2>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-neutral-500">
            BeLoyal is currently onboarding cafés directly while the platform
            is being tested and refined in real locations.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="mailto:begad.ahmed124@gmail.com?subject=BeLoyal%20cafe%20onboarding"
              className="w-full rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white transition hover:bg-neutral-800 sm:w-auto"
            >
              Contact BeLoyal
            </a>

            <Link
              href="/login"
              className="w-full rounded-full border border-neutral-300 bg-white px-7 py-3.5 text-sm font-medium text-neutral-950 transition hover:bg-neutral-50 sm:w-auto"
            >
               login
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}