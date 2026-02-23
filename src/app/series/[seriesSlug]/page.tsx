import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Tag } from "@/components/ui/Tag";
import { EpisodeCard } from "@/components/cards/EpisodeCard";
import { SERIES, getSeriesBySlug } from "@/lib/data";

interface Props {
  params: Promise<{ seriesSlug: string }>;
}

export async function generateStaticParams() {
  return SERIES.map((s) => ({ seriesSlug: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { seriesSlug } = await params;
  const series = getSeriesBySlug(seriesSlug);
  if (!series) return {};

  return {
    title: `${series.title} — CardFables`,
    description: series.desc,
    openGraph: {
      title: `${series.title} — CardFables`,
      description: series.desc,
      type: "website",
    },
  };
}

export default async function SeriesPage({ params }: Props) {
  const { seriesSlug } = await params;
  const series = getSeriesBySlug(seriesSlug);
  if (!series) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: series.title,
    description: series.desc,
    genre: series.genre,
    url: `https://cardfables.com/series/${series.id}`,
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
            { label: "Browse", href: "/browse" },
            { label: series.title },
          ]}
        />
      </div>

      {/* Series header */}
      <div
        className="mb-10 overflow-hidden rounded-2xl border border-border"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="relative p-8" style={{ background: series.bg }}>
          <div className="relative z-10">
            <Tag label={series.status} color={series.color} />
            <h1
              className="mt-4 font-heading text-3xl font-bold"
              style={{ color: series.accent }}
            >
              {series.title}
            </h1>
            <p className="mt-1 text-sm italic text-white/60">
              {series.tagline}
            </p>
          </div>
        </div>
        <div className="p-8">
          <p className="mb-4 text-sm leading-relaxed text-text-body">
            {series.desc}
          </p>
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span>{series.genre}</span>
            <span>&middot;</span>
            <span>{series.type} type</span>
            <span>&middot;</span>
            <span>
              {series.epCount} episode{series.epCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* Episodes */}
      <h2 className="mb-5 font-heading text-xl font-bold text-text-primary">
        Episodes
      </h2>
      {series.episodes.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {series.episodes.map((ep, i) => (
            <EpisodeCard key={ep.id} episode={ep} series={series} index={i} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-text-dim">
            Episodes coming soon. Follow us to get notified.
          </p>
        </div>
      )}
    </div>
  );
}
