import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use — CardFables",
  description: "Terms and conditions for using CardFables.",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 pt-28 pb-16">
      <h1 className="mb-8 font-heading text-3xl font-bold text-text-primary">
        Terms of Use
      </h1>

      <div className="space-y-6 text-sm leading-relaxed text-text-secondary">
        <p>
          <strong className="text-text-primary">Last updated:</strong> May 2026
        </p>

        <section>
          <h2 className="mb-2 font-heading text-lg font-bold text-text-primary">About CardFables</h2>
          <p>
            CardFables is an independent fan project that creates original stories inspired by trading card artwork.
            It is not affiliated with, endorsed by, or sponsored by The Pok&eacute;mon Company, Nintendo,
            Creatures Inc., or GAME FREAK Inc.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-bold text-text-primary">Original content</h2>
          <p>
            All stories, characters (as depicted in our narratives), and written content on CardFables
            are original creative works. Card names, artwork, and related trademarks belong to their
            respective owners. Our stories are inspired by card artwork but are entirely original fiction.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-bold text-text-primary">User submissions</h2>
          <p>
            When you submit a card through our Submit page, you grant CardFables permission to use the
            submitted photo and information to potentially create an episode. Submissions are reviewed
            for appropriateness before being used. We reserve the right to decline any submission.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-bold text-text-primary">Affiliate links</h2>
          <p>
            CardFables contains affiliate links to Amazon.com. When you click these links and make a purchase,
            we may earn a small commission. All affiliate links are clearly marked with an arrow (↗) and a
            reminder to ask a parent before buying. Prices shown are approximate and may change.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-bold text-text-primary">Age appropriateness</h2>
          <p>
            CardFables offers two reading levels: Junior Fables (ages 6&ndash;11) and Full Fables (ages 12+).
            Junior Fables use simpler language and shorter sentences. Full Fables include more complex
            vocabulary and emotional depth. Parents are encouraged to select the appropriate level for
            their children.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-heading text-lg font-bold text-text-primary">Use of the site</h2>
          <p>
            You may freely read and share stories from CardFables. You may not reproduce, redistribute,
            or sell our original written content without permission. Sharing links to episodes is
            always welcome and encouraged.
          </p>
        </section>
      </div>
    </div>
  );
}
