import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { EpisodeReader } from "@/components/episode/EpisodeReader";
import { getEpisodeBySlugs, getAllEpisodePaths } from "@/lib/data";

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
  const cardNames = episode.cards.map((c) => c.name).join(" + ");
  const desc = `Read "${episode.title}" — Episode ${episode.id} of ${series.title}. Inspired by ${cardNames}. Available in Junior (ages 6-11) and Full (ages 12+) reading levels.`;
  const url = `https://cardfables.com/series/${series.id}/${episode.slug}`;
  return {
    title: `${episode.title} — ${series.title} Episode ${episode.id} | CardFables`,
    description: desc,
    keywords: [
      "CardFables",
      series.title,
      episode.title,
      "Pokemon card stories",
      ...episode.cards.map((c) => c.name),
      ...episode.cards.map((c) => c.set),
      "kids stories",
      "Pokemon fan fiction",
    ],
    robots: { index: true, follow: true },
    alternates: { canonical: url },
    openGraph: {
      title: `${episode.title} — ${series.title} Episode ${episode.id}`,
      description: desc,
      type: "article",
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: `${episode.title} — ${series.title}`,
      description: desc,
    },
  };
}

export default async function EpisodePage({ params }: Props) {
  const { seriesSlug, episodeSlug } = await params;
  const result = getEpisodeBySlugs(seriesSlug, episodeSlug);
  if (!result) notFound();

  const { series, episode } = result;

  const cardNames = episode.cards.map((c) => c.name).join(" + ");
  const episodeUrl = `https://cardfables.com/series/${series.id}/${episode.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVEpisode",
    name: episode.title,
    description: `Episode ${episode.id} of ${series.title}, inspired by ${cardNames}.`,
    episodeNumber: episode.id,
    partOfSeries: {
      "@type": "TVSeries",
      name: series.title,
      url: `https://cardfables.com/series/${series.id}`,
    },
    url: episodeUrl,
    publisher: {
      "@type": "Organization",
      name: "CardFables",
      url: "https://cardfables.com",
    },
    potentialAction: {
      "@type": "ReadAction",
      target: episodeUrl,
    },
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

      <EpisodeReader episode={episode} series={series} />
    </div>
  );
}
