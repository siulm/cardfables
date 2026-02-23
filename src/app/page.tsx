import { Hero } from "@/components/home/Hero";
import { SeriesRow } from "@/components/home/SeriesRow";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Button } from "@/components/ui/Button";
import { EpisodeCard } from "@/components/cards/EpisodeCard";
import { SERIES } from "@/lib/data";

export default function Home() {
  const airing = SERIES.filter((s) => s.status === "Airing");
  const comingSoon = SERIES.filter((s) => s.status === "Coming Soon");

  // Get latest episodes across all series
  const latestEpisodes = SERIES.flatMap((s) =>
    s.episodes
      .filter((ep) => ep.status === "live")
      .map((ep) => ({ episode: ep, series: s, index: s.episodes.indexOf(ep) }))
  );

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "CardFables",
            url: "https://cardfables.com",
            description:
              "Original episodic stories inspired by Pokemon trading card artwork.",
          }),
        }}
      />

      <Hero />

      <div className="mx-auto max-w-6xl px-6">
        {/* Now Airing */}
        {airing.length > 0 && (
          <SeriesRow
            title="Now Airing"
            emoji={"\u{1F525}"}
            series={airing}
          />
        )}

        {/* Latest Episodes */}
        {latestEpisodes.length > 0 && (
          <section className="py-6">
            <h2 className="mb-5 flex items-center gap-2 font-heading text-xl font-bold text-text-primary">
              {"\u{1F4D6}"} Latest Episodes
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {latestEpisodes.map(({ episode, series, index }) => (
                <EpisodeCard
                  key={`${series.id}-${episode.slug}`}
                  episode={episode}
                  series={series}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {/* Coming Soon */}
        {comingSoon.length > 0 && (
          <SeriesRow
            title="Coming Soon"
            emoji={"\u{1F4FA}"}
            series={comingSoon}
          />
        )}

        {/* All Series */}
        <SeriesRow
          title="All Series"
          emoji={"\u{1F3AC}"}
          series={SERIES}
        />

        {/* How It Works */}
        <HowItWorks />

        {/* CTA */}
        <section className="py-16 text-center">
          <h2 className="mb-3 font-heading text-2xl font-bold text-text-primary">
            Got a card with a story to tell?
          </h2>
          <p className="mb-8 text-sm text-text-secondary">
            Submit it and your card might become the next episode.
          </p>
          <Button href="/submit">Submit a Card &rarr;</Button>
        </section>
      </div>
    </>
  );
}
