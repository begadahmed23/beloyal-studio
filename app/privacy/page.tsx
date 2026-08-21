import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How BeLoyal collects, uses, stores, and protects business and loyalty-member information.",
};

const sections = [
  {
    title: "1. About this policy",
    content: (
      <>
        This policy explains how BeLoyal handles information when businesses
        use the platform and when customers join a loyalty program operated by
        a café, barbershop, or another participating business.
      </>
    ),
  },
  {
    title: "2. Our role and the business’s role",
    content: (
      <>
        The participating business decides how its loyalty program operates,
        which customers may join, and how rewards are offered. BeLoyal provides
        the technology used to run that program. Depending on the activity,
        the business and BeLoyal may have different responsibilities under
        applicable data-protection law. Questions about a specific loyalty
        membership should normally be directed to that business first.
      </>
    ),
  },
  {
    title: "3. Information we collect",
    content: (
      <>
        Business-account information may include names, email addresses,
        login and authentication records, business details, branding,
        subscription information, and platform settings. Loyalty-member
        information may include a name, phone number, birthday, member number,
        digital-card identifier, stamps or visits, reward and redemption
        activity, ratings, optional feedback, and timestamps. We may also
        process technical information such as IP address, browser or device
        details, security events, and essential session information.
      </>
    ),
  },
  {
    title: "4. How information is collected",
    content: (
      <>
        Information is provided directly by business account holders and
        loyalty members, created when staff record activity or redeem rewards,
        and generated when the platform is used. QR codes identify the relevant
        join page or loyalty card; they do not themselves expose the full
        customer record.
      </>
    ),
  },
  {
    title: "5. How we use information",
    content: (
      <>
        We use information to create and secure accounts, operate digital
        loyalty cards, record eligible purchases or services, calculate reward
        progress, process redemptions, show business analytics, collect star
        ratings, provide support, prevent misuse, maintain the platform, and
        comply with legal obligations. If messaging features are enabled,
        contact details may also be used to deliver loyalty-related messages
        requested by the participating business.
      </>
    ),
  },
  {
    title: "6. Cookies and local storage",
    content: (
      <>
        BeLoyal uses essential cookies or similar browser storage to maintain
        signed-in sessions, remember a customer’s loyalty card on their device,
        preserve security, and avoid repeatedly showing the same introductory
        rating prompt. Disabling essential storage may prevent parts of the
        platform from working correctly.
      </>
    ),
  },
  {
    title: "7. When information is shared",
    content: (
      <>
        We do not sell personal information. Information may be available to
        the business operating the relevant loyalty program and to service
        providers that support hosting, databases, authentication, analytics,
        security, communications, or customer support. We may also disclose
        information when required by law, to protect users or the platform, or
        as part of a lawful business transfer.
      </>
    ),
  },
  {
    title: "8. Storage, transfers, and retention",
    content: (
      <>
        Information may be processed using service providers located outside
        the customer’s country. Where required, appropriate safeguards should
        be used for cross-border processing. We retain information while it is
        needed to provide the loyalty program, maintain legitimate business and
        security records, resolve disputes, or satisfy legal obligations. The
        exact period may depend on the participating business and the type of
        record.
      </>
    ),
  },
  {
    title: "9. Your choices and rights",
    content: (
      <>
        Subject to applicable law, individuals may request information about
        their personal data and ask for access, correction, deletion,
        restriction, or withdrawal of consent where relevant. A loyalty member
        may contact the participating business or BeLoyal. We may need to
        verify identity before completing a request, and some records may be
        retained when legally required.
      </>
    ),
  },
  {
    title: "10. Children’s information",
    content: (
      <>
        BeLoyal is not intended for children to use independently. Businesses
        must ensure that they have any permission required before collecting a
        child’s information. A parent or guardian may contact the participating
        business or BeLoyal regarding a child’s record.
      </>
    ),
  },
  {
    title: "11. Security",
    content: (
      <>
        We use reasonable technical and organizational measures designed to
        protect information, including authenticated business access and
        restricted customer-card identifiers. No online service can guarantee
        absolute security, and account holders must protect their credentials.
      </>
    ),
  },
  {
    title: "12. Updates and contact",
    content: (
      <>
        We may update this policy when the platform or legal requirements
        change. The current date will appear at the top of this page. Privacy
        questions and requests can be sent to{" "}
        <a
          href="mailto:begad.ahmed124@gmail.com?subject=BeLoyal%20privacy%20request"
          className="font-semibold text-neutral-950 underline underline-offset-4"
        >
          begad.ahmed124@gmail.com
        </a>
        .
      </>
    ),
  },
];

export default function PrivacyPage() {
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
            href="/terms"
            className="text-sm font-medium text-neutral-500 transition hover:text-black"
          >
            Terms of Service
          </Link>
        </div>

        <header className="mt-16 border-b border-black/10 pb-10 sm:mt-24 sm:pb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
            Legal · BeLoyal Studio
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.055em] sm:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-neutral-500">
            A clear explanation of the information used to provide BeLoyal’s
            business accounts and digital loyalty programs.
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
