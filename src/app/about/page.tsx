import type { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About CardFables — Original Pokemon Card Stories",
  description:
    "Learn about CardFables — a storytelling project where every episode begins with a single Pokemon trading card.",
};

const FAQ = [
  {
    q: "Are these official Pokemon stories?",
    a: "No. CardFables is an independent fan project. We are not affiliated with, endorsed by, or sponsored by Nintendo, The Pokemon Company, Creatures Inc., or GAME FREAK Inc. All stories are original creative works inspired by card artwork.",
  },
  {
    q: "Can I submit a card?",
    a: "Yes! Visit our Submit page, upload a photo, and tell us which series it fits. Community picks are our favorite way to find the next episode.",
  },
  {
    q: "How do you make money?",
    a: "Amazon affiliate links. When you click a product link and make a purchase, we earn a small commission at no extra cost to you.",
  },
  {
    q: "What age group is this for?",
    a: "We write for ages 10-30+. Fun and accessible for younger readers, but with enough drama and humor for adults. Think Pixar — enjoyable at any age.",
  },
  {
    q: "Can I use these stories?",
    a: "The stories are original work. If you'd like to share them, please link back to CardFables. Don't copy full stories without permission.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 pt-28 pb-16">
      <h1 className="mb-2 font-heading text-3xl font-bold text-text-primary">
        About CardFables
      </h1>
      <p className="mb-12 text-base italic text-text-secondary">
        Every card has a story worth telling.
      </p>

      {/* The Concept */}
      <section className="mb-16">
        <h2 className="mb-6 font-heading text-xl font-bold text-gold">
          The Concept
        </h2>
        <div className="space-y-5 text-sm leading-relaxed text-text-body">
          <p>
            CardFables is a storytelling project where every episode begins with
            a single Pokemon trading card. We look at the artwork — the
            expression, the environment, the mood — and ask: &ldquo;What&rsquo;s
            happening in this moment?&rdquo;
          </p>
          <p>
            Then we write an original story about it. Not a retelling of the
            games or the anime — something entirely new. A soap opera about
            fire-types with too many feelings. A mystery set in the depths of
            the ocean. A comedy about a garden that&rsquo;s way too crowded.
          </p>
          <p>
            The cards are the inspiration. The fables are ours. And if you love
            the card, you can buy it — every episode links to the real card so
            you can own a piece of the story.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-16">
        <h2 className="mb-6 font-heading text-xl font-bold text-gold">FAQ</h2>
        <div className="space-y-6">
          {FAQ.map((item) => (
            <div key={item.q}>
              <h3 className="mb-2 text-sm font-semibold text-text-primary">
                {item.q}
              </h3>
              <p className="text-sm leading-relaxed text-text-secondary">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        className="rounded-2xl p-8 text-center"
        style={{
          background: "rgba(212,168,70,0.025)",
          border: "1px solid rgba(212,168,70,0.06)",
        }}
      >
        <h2 className="mb-2 font-heading text-xl font-bold text-text-primary">
          Be part of the story
        </h2>
        <p className="mb-6 text-sm text-text-secondary">
          Submit a card, follow us, or just come back for the next episode.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button href="/submit">Submit a Card</Button>
          <Button href="/browse" variant="ghost">
            Browse Stories
          </Button>
        </div>
      </section>
    </div>
  );
}
