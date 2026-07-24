const features = [
  {
    number: "01",
    title: "Digital customer cards",
    description:
      "Every customer receives a personal loyalty card that can be opened directly from their phone.",
  },
  {
    number: "02",
    title: "Fast stamp scanning",
    description:
      "Staff can add stamps using a phone camera or a USB QR scanner at the counter.",
  },
  {
    number: "03",
    title: "Automatic rewards",
    description:
      "The customer card tracks progress and automatically shows when a reward has been earned.",
  },
  {
    number: "04",
    title: "Member management",
    description:
      "View members, search customer records and manage loyalty activity from one dashboard.",
  },
  {
    number: "05",
    title: "No customer app",
    description:
      "Customers join through a link or QR code without downloading an application.",
  },
  {
    number: "06",
    title: "Designed for your café",
    description:
      "Configure the café identity, reward details, stamp target and customer experience.",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      className="border-t border-neutral-200 px-6 py-24 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-400">
            The platform
          </p>

          <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Everything needed to run
            <span className="block text-neutral-400">
              a modern loyalty program.
            </span>
          </h2>
        </div>

        <div className="mt-16 grid border-l border-t border-neutral-200 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.number}
              className="min-h-[300px] border-b border-r border-neutral-200 p-8 transition-colors hover:bg-neutral-50 sm:p-10"
            >
              <p className="text-sm text-neutral-400">{feature.number}</p>

              <div className="mt-20">
                <h3 className="text-xl font-medium tracking-[-0.02em]">
                  {feature.title}
                </h3>

                <p className="mt-4 max-w-sm leading-7 text-neutral-500">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}