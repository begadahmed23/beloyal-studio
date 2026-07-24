import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-16 text-neutral-950 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-neutral-500 transition hover:text-black"
        >
          ← Back to BeLoyal
        </Link>

        <p className="mt-16 text-sm font-medium uppercase tracking-[0.18em] text-neutral-400">
          Legal
        </p>

        <h1 className="mt-4 text-5xl font-semibold tracking-[-0.05em]">
          Terms of Service
        </h1>

        <p className="mt-5 text-sm text-neutral-400">
          Last updated: July 23, 2026
        </p>

        <div className="mt-12 space-y-10 leading-7 text-neutral-600">
          <section>
            <h2 className="text-xl font-medium text-neutral-950">
              Use of BeLoyal
            </h2>

            <p className="mt-3">
              BeLoyal provides digital loyalty tools for cafés. Café owners are
              responsible for using the platform lawfully and for ensuring that
              the information entered into their account is accurate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-950">
              Café responsibilities
            </h2>

            <p className="mt-3">
              Each café is responsible for defining its loyalty rules, reward
              conditions and customer communication. The café is also
              responsible for honoring rewards offered through its loyalty
              program.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-950">
              Account security
            </h2>

            <p className="mt-3">
              Account holders must protect their login credentials and notify
              BeLoyal if they believe their account has been accessed without
              permission.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-950">
              Service availability
            </h2>

            <p className="mt-3">
              BeLoyal aims to provide a reliable service but does not guarantee
              uninterrupted availability. Maintenance, updates or technical
              issues may occasionally affect access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-950">
              Changes to the service
            </h2>

            <p className="mt-3">
              Features and functionality may be updated as the platform
              develops. Material changes to these terms may be reflected by
              updating the date shown on this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-950">
              Contact
            </h2>

            <p className="mt-3">
              Questions regarding these terms can be sent to{" "}
              <a
                href="mailto:begad.ahmed124@gmail.com"
                className="font-medium text-neutral-950 underline underline-offset-4"
              >
                begad.ahmed124@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}