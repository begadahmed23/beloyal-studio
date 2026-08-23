import Link from "next/link";

export const metadata = {
  title: "Data Deletion | BeLoyal",
  description:
    "Instructions for requesting deletion of personal data associated with BeLoyal.",
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-[#0A0D12] text-[#F4F7FB]">
      <div className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <div className="mb-12">
          <Link
            href="/"
            className="text-sm font-medium text-white/50 transition hover:text-white"
          >
            ← Back to BeLoyal
          </Link>
        </div>

        <div className="mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-white/40">
            BeLoyal
          </p>

          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Data Deletion
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-white/60">
            You can request the deletion of personal information associated with
            your use of BeLoyal at any time.
          </p>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-xl font-semibold">How to request deletion</h2>

            <div className="mt-5 space-y-4 text-sm leading-7 text-white/65">
              <p>
                To request deletion of your BeLoyal data, contact BeLoyal using
                the contact information provided in our Privacy Policy.
              </p>

              <p>Please include enough information for us to identify your account, such as:</p>

              <ul className="list-disc space-y-2 pl-5">
                <li>Your name</li>
                <li>Your phone number or email associated with BeLoyal</li>
                <li>The business or loyalty program you used</li>
                <li>A clear request asking us to delete your personal data</li>
              </ul>

              <p>
                We may ask you to verify your identity before completing a
                deletion request in order to protect your information.
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-xl font-semibold">What will be deleted</h2>

            <div className="mt-5 space-y-4 text-sm leading-7 text-white/65">
              <p>
                Where applicable, we will delete or anonymize personal
                information associated with your BeLoyal account or loyalty
                membership, including information such as:
              </p>

              <ul className="list-disc space-y-2 pl-5">
                <li>Account and profile information</li>
                <li>Contact information</li>
                <li>Loyalty membership information</li>
                <li>Data connected to third-party integrations where applicable</li>
              </ul>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-xl font-semibold">Processing time</h2>

            <p className="mt-5 text-sm leading-7 text-white/65">
              We will review valid deletion requests as soon as reasonably
              possible. Some information may be retained where required by law,
              for security purposes, fraud prevention, dispute resolution, or
              other legitimate legal obligations.
            </p>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
            <h2 className="text-xl font-semibold">
              Facebook and WhatsApp data
            </h2>

            <p className="mt-5 text-sm leading-7 text-white/65">
              If you interacted with BeLoyal through a Meta service such as
              Facebook or WhatsApp, you may request deletion of data received by
              BeLoyal through those integrations using the same process
              described above.
            </p>
          </section>
        </div>

        <div className="mt-12 flex flex-wrap gap-5 text-sm">
          <Link
            href="/privacy"
            className="text-white/50 transition hover:text-white"
          >
            Privacy Policy
          </Link>

          <Link
            href="/terms"
            className="text-white/50 transition hover:text-white"
          >
            Terms of Service
          </Link>
        </div>

        <p className="mt-12 text-xs text-white/30">
          Last updated: August 2026
        </p>
      </div>
    </main>
  );
}