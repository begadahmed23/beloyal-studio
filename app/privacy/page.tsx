import Link from "next/link";

export default function PrivacyPage() {
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
          Privacy Policy
        </h1>

        <p className="mt-5 text-sm text-neutral-400">
          Last updated: July 23, 2026
        </p>

        <div className="mt-12 space-y-10 leading-7 text-neutral-600">
          <section>
            <h2 className="text-xl font-medium text-neutral-950">
              Information we collect
            </h2>

            <p className="mt-3">
              BeLoyal may collect account information provided by café owners,
              including names, email addresses and café details. Customer
              loyalty accounts may include information such as a customer name,
              phone number, birthday, loyalty activity and digital card
              identifiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-950">
              How information is used
            </h2>

            <p className="mt-3">
              Information is used to operate café loyalty programs, provide
              customer cards, record stamps, manage rewards, support café
              accounts and maintain platform security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-950">
              Information sharing
            </h2>

            <p className="mt-3">
              BeLoyal does not sell personal information. Information may be
              processed by service providers required to operate the platform,
              including hosting, database and authentication providers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-950">
              Data protection
            </h2>

            <p className="mt-3">
              Reasonable technical and organizational measures are used to
              protect information. No online system can guarantee complete
              security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-medium text-neutral-950">
              Contact
            </h2>

            <p className="mt-3">
              Questions regarding this policy can be sent to{" "}
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