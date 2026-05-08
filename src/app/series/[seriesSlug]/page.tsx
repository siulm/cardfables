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

  const epCount = series.episodes.filter((e) => e.status === "live").length;
  const desc = `${series.desc} ${epCount} free episodes to read — written for kids and adults. ${series.genre}.`;

  return {
    title: `${series.title} — Free ${series.genre} Stories | CardFables`,
    description: desc,
    openGraph: {
      title: `${series.title} — CardFables`,
      description: desc,
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
            <p className="mt-1 text-sm italic text-white/80">
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

      {/* Start Reading prompt */}
      {series.episodes.length > 0 && series.episodes[0].status === "live" && (
        <div
          className="mb-10 flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center sm:flex-row sm:text-left"
          style={{ borderColor: `${series.color}33` }}
        >
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">New here?</p>
            <p className="mt-1 text-sm text-text-secondary">
              Start from Episode 1 — each episode builds on the last.
            </p>
          </div>
          <a
            href={`/series/${series.id}/${series.episodes[0].slug}`}
            className="inline-block flex-shrink-0 rounded-lg px-6 py-2.5 text-sm font-bold text-[#FFFEF7] transition-opacity hover:opacity-90"
            style={{ background: `linear-gradient(135deg, #D4893A, #B86E28)` }}
          >
            Read Episode 1 &rarr;
          </a>
        </div>
      )}

      {/* Meet the Cast */}
      {series.characters && series.characters.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-5 font-heading text-xl font-bold text-text-primary">
            Meet the Cast
          </h2>
          {series.setting && (
            <p className="mb-5 text-sm italic text-text-secondary">
              Set in {series.setting}
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {series.characters.slice(0, 6).map((char) => (
              <div
                key={char.name}
                className="rounded-xl border border-border p-4"
                style={{ background: "var(--color-surface)" }}
              >
                <h3 className="text-sm font-bold text-text-primary">
                  {char.name}
                </h3>
                {char.card !== "N/A" && (
                  <p className="mt-0.5 text-xs text-text-dim">{char.card}</p>
                )}
                <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
                  {char.role}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

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
