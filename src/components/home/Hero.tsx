import { Button } from "@/components/ui/Button";
import { EmberParticles } from "@/components/effects/EmberParticles";
import { SERIES } from "@/lib/data";

export function Hero() {
  const feat = SERIES.filter((s) => s.epCount > 0).sort((a, b) => b.epCount - a.epCount)[0] ?? SERIES[0];

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "88vh" }}>
      {/* Background — Ghibli sky gradient */}
      <div className="absolute inset-0">
        {/* Sky: blue top fading to warm peach, then to page background */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #87BBCF 0%, #B8D4DC 25%, #E8D8C0 55%, #F0E4D0 75%, #F5F0E6 100%)",
          }}
        />
        {/* Subtle cloud shapes */}
        <div
          className="absolute"
          style={{
            top: "8%",
            right: "15%",
            width: 180,
            height: 50,
            background: "rgba(255,255,255,0.35)",
            borderRadius: 40,
            filter: "blur(8px)",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "12%",
            right: "25%",
            width: 120,
            height: 35,
            background: "rgba(255,255,255,0.25)",
            borderRadius: 30,
            filter: "blur(6px)",
          }}
        />
        <div
          className="absolute"
          style={{
            top: "6%",
            left: "10%",
            width: 140,
            height: 40,
            background: "rgba(255,255,255,0.20)",
            borderRadius: 35,
            filter: "blur(10px)",
          }}
        />
      </div>

      {/* EmberParticles removed — doesn't fit the light storybook theme */}

      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-6xl items-center px-6" style={{ minHeight: "88vh" }}>
        <div className="animate-fade-up" style={{ maxWidth: 620 }}>
          {/* Now Streaming badge */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full text-gold"
            style={{
              padding: "5px 14px",
              background: "rgba(212,137,58,0.1)",
              border: "1px solid rgba(212,137,58,0.2)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: 1.5,
              textTransform: "uppercase",
            }}
          >
            <span
              className="inline-block h-2 w-2 rounded-full animate-pulse-glow"
              style={{ background: "#22C55E" }}
            />
            Now Streaming
          </div>

          {/* Title */}
          <h1
            className="mb-6 font-heading font-black"
            style={{
              fontSize: "clamp(2.8rem, 6vw, 4.8rem)",
              lineHeight: 1.02,
              letterSpacing: -1.5,
              color: feat.color,
            }}
          >
            {feat.title}
          </h1>

          {/* Description */}
          <p
            className="mb-4"
            style={{
              fontSize: 14.5,
              color: "#5A5040",
              lineHeight: 1.75,
              maxWidth: 480,
            }}
          >
            {feat.desc}
          </p>

          {/* Genre */}
          <p className="mb-8 text-sm text-text-secondary">{feat.genre}</p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4">
            <Button href={`/series/${feat.id}/${feat.episodes[0].slug}`}>
              Read Episode 1
            </Button>
            <Button href={`/series/${feat.id}`} variant="ghost">
              Series Info
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
