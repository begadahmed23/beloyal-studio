import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-neutral-200 px-6 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-[1fr_auto_auto] md:gap-20">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-semibold tracking-[-0.04em]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-sm text-white">
                B
              </span>

              BeLoyal
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500">
              Digital customer loyalty infrastructure for independent cafés.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-950">Product</p>

            <div className="mt-4 flex flex-col gap-3 text-sm text-neutral-500">
              <a href="#features" className="transition hover:text-black">
                Features
              </a>

              <a href="#how-it-works" className="transition hover:text-black">
                How it works
              </a>

              <a href="#faq" className="transition hover:text-black">
                FAQ
              </a>

              <Link href="/login" className="transition hover:text-black">
                Login
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-neutral-950">Legal</p>

            <div className="mt-4 flex flex-col gap-3 text-sm text-neutral-500">
              <Link href="/privacy" className="transition hover:text-black">
                Privacy Policy
              </Link>

              <Link href="/terms" className="transition hover:text-black">
                Terms of Service
              </Link>

              <a
                href="mailto:hello@beloyalstudio.com"
                className="transition hover:text-black"
              >
                Contact
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-neutral-200 pt-8 text-sm text-neutral-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 BeLoyal Studio. All rights reserved.</p>
          <p>Alexandria, Egypt</p>
        </div>
      </div>
    </footer>
  );
}