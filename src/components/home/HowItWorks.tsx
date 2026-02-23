const STEPS = [
  {
    icon: "\u{1F4F7}",
    title: "A Card",
    desc: "Every episode starts with a single Pokemon card and its artwork.",
  },
  {
    icon: "\u270D\uFE0F",
    title: "A Fable",
    desc: "We write an original story inspired by the scene. Drama, comedy, mystery.",
  },
  {
    icon: "\u{1F4FA}",
    title: "A Series",
    desc: "Episodes connect into arcs. Characters return. You binge.",
  },
  {
    icon: "\u{1F6D2}",
    title: "Collect",
    desc: "Love the card? Buy it. Every episode links to the real card.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-16">
      <p className="mb-10 text-center text-sm italic text-text-secondary">
        One card. One episode. One fable at a time.
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step) => (
          <div
            key={step.title}
            className="rounded-2xl border border-border p-6 text-center"
            style={{ background: "var(--color-surface)" }}
          >
            <div className="mb-3 text-3xl">{step.icon}</div>
            <h3 className="mb-2 font-heading text-base font-bold text-text-primary">
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed text-text-secondary">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
