const steps = [
  {
    number: "01",
    title: "Customers join in seconds",
    description:
      "They scan the business’s join QR, enter their details, and receive a personal digital loyalty card.",
  },
  {
    number: "02",
    title: "Staff record the activity",
    description:
      "The café records a stamp after a qualifying purchase. The barbershop records a visit after an eligible service.",
  },
  {
    number: "03",
    title: "BeLoyal unlocks the reward",
    description:
      "The card updates automatically, celebrates new progress, and clearly shows when the configured reward is ready.",
  },
  {
    number: "04",
    title: "The business learns and improves",
    description:
      "Private star ratings and loyalty analytics reveal repeat activity, growth, and customer experience trends.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-t border-white/10 bg-[#111210] px-6 py-24 text-white lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-16 lg:grid-cols-[0.78fr_1.22fr] lg:gap-24">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/40">
              How it works
            </p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              Simple for staff.
              <span className="block text-white/35">
                Effortless for customers.
              </span>
            </h2>
            <p className="mt-8 max-w-lg text-lg leading-8 text-white/50">
              No plastic cards, complicated POS installation, or customer app.
              Just one clean flow from joining to reward redemption.
            </p>
          </div>
          <div className="border-t border-white/15">
            {steps.map((step) => (
              <article
                key={step.number}
                className="grid gap-6 border-b border-white/15 py-9 sm:grid-cols-[76px_1fr]"
              >
                <p className="text-sm text-white/30">{step.number}</p>
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
