import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { CardSidebar } from "@/components/episode/CardSidebar";
import { StoryRenderer } from "@/components/episode/StoryRenderer";
import { NextEpisodeCTA } from "@/components/episode/NextEpisodeCTA";
import { getEpisodeBySlugs, getAllEpisodePaths, STORY_DATA } from "@/lib/data";

interface Props {
  params: Promise<{ seriesSlug: string; episodeSlug: string }>;
}

export async function generateStaticParams() {
  return getAllEpisodePaths().map(({ seriesSlug, episodeSlug }) => ({
    seriesSlug,
    episodeSlug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seriesSlug, episodeSlug } = await params;
  const result = getEpisodeBySlugs(seriesSlug, episodeSlug);
  if (!result) return {};

  const { series, episode } = result;
  return {
    title: `${episode.title} — ${series.title} Episode ${episode.id} | CardFables`,
    description: `Read "${episode.title}" — Episode ${episode.id} of ${series.title}. Inspired by the ${episode.card} card from ${episode.set}.`,
    openGraph: {
      title: `${episode.title} — ${series.title} Episode ${episode.id}`,
      description: `Read "${episode.title}" — Episode ${episode.id} of ${series.title}.`,
      type: "article",
    },
  };
}

export default async function EpisodePage({ params }: Props) {
  const { seriesSlug, episodeSlug } = await params;
  const result = getEpisodeBySlugs(seriesSlug, episodeSlug);
  if (!result) notFound();

  const { series, episode } = result;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVEpisode",
    name: episode.title,
    episodeNumber: episode.id,
    partOfSeries: {
      "@type": "TVSeries",
      name: series.title,
      url: `https://cardfables.com/series/${series.id}`,
    },
    url: `https://cardfables.com/series/${series.id}/${episode.slug}`,
  };

  return (
    <div className="mx-auto max-w-6xl px-6 pt-28 pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mb-6">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: series.title, href: `/series/${series.id}` },
            { label: `Episode ${episode.id}` },
          ]}
        />
      </div>

      {/* Episode header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: series.color }}
          >
            {series.title}
          </span>
          <span className="text-text-dim">&middot;</span>
          <span className="text-xs text-text-secondary">
            Episode {episode.id}
          </span>
        </div>
        <h1 className="font-heading text-3xl font-bold text-text-primary">
          {episode.title}
        </h1>
      </div>

      {/* Two-column reader */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        <div>
          <StoryRenderer story={STORY_DATA} seriesColor={series.color} />
          <NextEpisodeCTA series={series} />
        </div>
        <CardSidebar episode={episode} series={series} />
      </div>
    </div>
  );
}
