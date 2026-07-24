const questions = [
  {
    question: "Do customers need to download an application?",
    answer:
      "No. Customers create and open their loyalty card using a normal web link on their phone.",
  },
  {
    question: "Does BeLoyal work on iPhone and Android?",
    answer:
      "Yes. The joining process and customer card work in modern mobile browsers on both iPhone and Android.",
  },
  {
    question: "How are stamps added?",
    answer:
      "The café scans the QR code on the customer card using a phone camera or a compatible USB QR scanner.",
  },
  {
    question: "Can the reward and stamp target be changed?",
    answer:
      "Yes. Each café can configure its own stamp target and the reward shown to customers.",
  },
  {
    question: "Can customers keep using the same card?",
    answer:
      "Yes. Each customer keeps the same personal loyalty card and uses it during future visits.",
  },
  {
    question: "How can a café start using BeLoyal?",
    answer:
      "BeLoyal is currently onboarding cafés directly. Contact us and we will handle the setup and provide access to the platform.",
  },
];

export default function FAQ() {
  return (
    <section
      id="faq"
      className="border-t border-neutral-200 px-6 py-24 lg:px-8 lg:py-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-neutral-400">
              Frequently asked questions
            </p>

            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Product information,
              <span className="block text-neutral-400">
                clearly explained.
              </span>
            </h2>
          </div>

          <div className="border-t border-neutral-200">
            {questions.map((item) => (
              <details
                key={item.question}
                className="group border-b border-neutral-200"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-7 text-lg font-medium">
                  <span>{item.question}</span>

                  <span className="relative h-5 w-5 shrink-0">
                    <span className="absolute left-0 top-1/2 h-px w-5 bg-neutral-950" />
                    <span className="absolute left-1/2 top-0 h-5 w-px bg-neutral-950 transition-all group-open:rotate-90 group-open:opacity-0" />
                  </span>
                </summary>

                <p className="max-w-2xl pb-7 pr-10 leading-7 text-neutral-500">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}