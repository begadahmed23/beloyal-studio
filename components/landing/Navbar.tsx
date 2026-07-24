import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-xl font-semibold tracking-[-0.04em]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-black text-sm font-semibold text-white">
            B
          </span>

          <span>BeLoyal</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-neutral-500 md:flex">
          <a
            href="#features"
            className="transition-colors hover:text-neutral-950"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="transition-colors hover:text-neutral-950"
          >
            How it works
          </a>

          <a
            href="#faq"
            className="transition-colors hover:text-neutral-950"
          >
            FAQ
          </a>

          <a
            href="#contact"
            className="transition-colors hover:text-neutral-950"
          >
            Contact
          </a>
        </nav>

        <Link
          href="/login"
          className="rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
           login
        </Link>
      </div>
    </header>
  );
}