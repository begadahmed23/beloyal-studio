import {
  ChartNoAxesCombined,
  CreditCard,
  Palette,
  QrCode,
  ScanLine,
  Star,
} from "lucide-react";

const features = [
  {
    icon: CreditCard,
    title: "Branded digital cards",
    description:
      "Every member receives a personal card styled for the café or barbershop they joined.",
  },
  {
    icon: ScanLine,
    title: "Fast visit recording",
    description:
      "Staff record stamps or visits using a phone camera or a USB QR scanner at the counter.",
  },
  {
    icon: QrCode,
    title: "Join without an app",
    description:
      "Customers scan a branded join poster and open their card directly in a mobile browser.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Useful customer insights",
    description:
      "See member growth, active customers, reward redemptions, and recent loyalty activity.",
  },
  {
    icon: Star,
    title: "Private star ratings",
    description:
      "Collect quick customer ratings and understand the experience without interrupting service.",
  },
  {
    icon: Palette,
    title: "Built around your brand",
    description:
      "Choose an industry-specific design, reward target, wording, colors, logo, and Google review link.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="border-t border-neutral-200 bg-white px-6 py-24 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-400">
              The platform
            </p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              One loyalty engine.
              <span className="block text-neutral-400">
                Built for each business.
              </span>
            </h2>
          </div>
          <p className="max-w-xl text-lg leading-8 text-neutral-500 lg:justify-self-end">
            Cafés keep their familiar stamp experience. Barbershops get a
            separate visit-based interface. Both run securely from the same
            BeLoyal platform.
          </p>
        </div>

        <div className="mt-16 grid border-l border-t border-neutral-200 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="min-h-[290px] border-b border-r border-neutral-200 p-8 transition-colors hover:bg-[#f8f7f4] sm:p-10"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-700">
                    <Icon size={19} />
                  </span>
                  <span className="text-xs text-neutral-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <div className="mt-16">
                  <h3 className="text-xl font-semibold tracking-[-0.025em]">
                    {feature.title}
                  </h3>
                  <p className="mt-4 max-w-sm leading-7 text-neutral-500">
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
