import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing business accounts and digital loyalty programs operated through BeLoyal.",
};

const sections = [
  {
    title: "1. Agreement",
    content: (
      <>
        These Terms govern access to BeLoyal by participating businesses and
        their authorized staff. By creating, accepting, or using a business
        account, the account holder agrees to these Terms. A person using
        BeLoyal on behalf of a business confirms that they are authorized to do
        so.
      </>
    ),
  },
  {
    title: "2. The service",
    content: (
      <>
        BeLoyal provides tools for digital loyalty enrollment, customer cards,
        QR scanning, stamps or visit records, rewards, ratings, analytics, and
        related account management. Available features may vary by business
        type, plan, configuration, or development stage.
      </>
    ),
  },
  {
    title: "3. Business responsibilities",
    content: (
      <>
        Each business is responsible for its loyalty rules, qualifying
        purchases or services, reward descriptions, staff access, customer
        communications, and compliance with laws that apply to its operations.
        Information entered into BeLoyal must be accurate and must not be
        misleading.
      </>
    ),
  },
  {
    title: "4. Customer data and privacy",
    content: (
      <>
        Businesses must have a lawful basis and provide any required notice or
        consent before collecting or using customer information through
        BeLoyal. They may access only information connected to their own
        loyalty program and must handle that information responsibly. Use of
        the platform is also subject to the BeLoyal {" "}
        <Link
          href="/privacy"
          className="font-semibold text-neutral-950 underline underline-offset-4"
        >
          Privacy Policy
        </Link>
        .
      </>
    ),
  },
  {
    title: "5. Loyalty rewards",
    content: (
      <>
        The participating business—not BeLoyal—offers and is responsible for
        honoring its loyalty rewards. The business decides eligibility,
        exclusions, availability, and redemption conditions, provided those
        terms are communicated clearly and applied lawfully. BeLoyal records
        progress but does not supply the underlying drink, haircut, service, or
        other reward.
      </>
    ),
  },
  {
    title: "6. Accounts and security",
    content: (
      <>
        Account holders must protect their login credentials, limit access to
        authorized staff, and notify BeLoyal promptly if they suspect
        unauthorized use. Activity performed through an account may be treated
        as authorized until BeLoyal is notified otherwise.
      </>
    ),
  },
  {
    title: "7. Trials, subscriptions, and payment",
    content: (
      <>
        Trial length, subscription price, billing cycle, activation date, and
        payment arrangements are shown in the business account or agreed during
        onboarding. Access may be restricted when a trial ends, payment becomes
        overdue, or a subscription is suspended or cancelled. Any refund or
        cancellation terms agreed separately with the business also apply.
      </>
    ),
  },
  {
    title: "8. Acceptable use",
    content: (
      <>
        Users must not attempt to access another business’s data, manipulate
        loyalty balances dishonestly, interfere with platform security, upload
        unlawful material, misuse customer information, reverse engineer the
        service where prohibited, or use BeLoyal for illegal, deceptive, or
        harmful activity.
      </>
    ),
  },
  {
    title: "9. Third-party services",
    content: (
      <>
        BeLoyal may rely on third-party hosting, database, authentication,
        analytics, communications, or review services. Those services may have
        separate terms and privacy practices. BeLoyal is not responsible for a
        business’s website, physical service, Google listing, or other
        third-party destination.
      </>
    ),
  },
  {
    title: "10. Availability and changes",
    content: (
      <>
        We aim to provide a reliable service but cannot promise uninterrupted
        or error-free availability. Maintenance, security incidents, network
        failures, or provider outages may affect access. Features may be added,
        changed, or removed as BeLoyal develops, while reasonable care will be
        taken to avoid unnecessary disruption.
      </>
    ),
  },
  {
    title: "11. Intellectual property",
    content: (
      <>
        BeLoyal and its platform design, software, and branding remain the
        property of their respective owners. Businesses retain responsibility
        for logos, names, and content they upload and grant BeLoyal permission
        to display and process that content solely to provide the service.
      </>
    ),
  },
  {
    title: "12. Suspension and termination",
    content: (
      <>
        BeLoyal may suspend or terminate access to protect customers, prevent
        misuse, respond to legal requirements, address non-payment, or enforce
        these Terms. A business may request cancellation according to its
        agreed subscription arrangements. Relevant records may be retained as
        described in the Privacy Policy.
      </>
    ),
  },
  {
    title: "13. Liability",
    content: (
      <>
        To the extent permitted by applicable law, BeLoyal is not responsible
        for a business’s products, services, reward decisions, staff actions,
        customer disputes, lost profits, or indirect losses. Nothing in these
        Terms excludes liability that cannot legally be excluded.
      </>
    ),
  },
  {
    title: "14. Governing law and contact",
    content: (
      <>
        These Terms are governed by the laws of the Arab Republic of Egypt,
        subject to any mandatory protections that apply. Questions can be sent
        to{" "}
        <a
          href="mailto:begad.ahmed124@gmail.com?subject=BeLoyal%20terms%20question"
          className="font-semibold text-neutral-950 underline underline-offset-4"
        >
          begad.ahmed124@gmail.com
        </a>
        . We may update these Terms as the service develops and will revise the
        date shown on this page.
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#f6f5f2] px-6 py-10 text-neutral-950 sm:py-16 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-neutral-500 transition hover:text-black"
          >
            ← Back to BeLoyal
          </Link>
          <Link
            href="/privacy"
            className="text-sm font-medium text-neutral-500 transition hover:text-black"
          >
            Privacy Policy
          </Link>
        </div>

        <header className="mt-16 border-b border-black/10 pb-10 sm:mt-24 sm:pb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Legal · BeLoyal Studio
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
            Terms of Service
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-500">
            The operating rules for businesses using BeLoyal to provide
            digital loyalty programs to their customers.
          </p>
          <p className="mt-5 text-sm text-neutral-400">
            Last updated: August 21, 2026
          </p>
        </header>

        <div className="mt-10 divide-y divide-black/10 rounded-[28px] border border-black/10 bg-white px-6 shadow-[0_22px_70px_rgba(28,25,21,0.06)] sm:px-10">
          {sections.map((section) => (
            <section key={section.title} className="py-8 sm:py-10">
              <h2 className="text-xl font-semibold tracking-[-0.025em]">
                {section.title}
              </h2>
              <div className="mt-4 max-w-3xl leading-7 text-neutral-600">
                {section.content}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
