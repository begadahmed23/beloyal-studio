const steps = [
  {
    number: "01",
    title: "The customer joins",
    description:
      "The customer scans the café QR code, enters their details and receives a personal loyalty card.",
  },
  {
    number: "02",
    title: "The café records each visit",
    description:
      "Staff scan the customer card and add a stamp after an eligible purchase.",
  },
  {
    number: "03",
    title: "The reward is unlocked",
    description:
      "When the stamp target is completed, the card displays the available reward for redemption.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-neutral-200 bg-neutral-950 px-6 py-24 text-white lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/40">
              How it works
            </p>

            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Simple at the counter.
              <span className="block text-white/40">
                Clear for the customer.
              </span>
            </h2>

            <p className="mt-8 max-w-lg text-lg leading-8 text-white/50">
              BeLoyal keeps the loyalty experience focused on the actions that
              matter: joining, collecting stamps and redeeming a reward.
            </p>
          </div>

          <div className="border-t border-white/15">
            {steps.map((step) => (
              <article
                key={step.number}
                className="grid gap-6 border-b border-white/15 py-10 sm:grid-cols-[80px_1fr]"
              >
                <p className="text-sm text-white/35">{step.number}</p>

                <div>
                  <h3 className="text-2xl font-medium tracking-[-0.03em]">
                    {step.title}
                  </h3>

                  <p className="mt-4 max-w-xl leading-7 text-white/50">
                    {step.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}