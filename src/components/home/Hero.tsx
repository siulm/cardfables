import { Button } from "@/components/ui/Button";
import { EmberParticles } from "@/components/effects/EmberParticles";
import { SERIES } from "@/lib/data";

export function Hero() {
  const feat = SERIES[0];

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "88vh" }}>
      {/* Background gradients */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 50%, rgba(232,101,26,0.14) 0%, transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 50% 50% at 70% 30%, rgba(196,30,58,0.06) 0%, transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, #07070D 92%)",
          }}
        />
      </div>

      <EmberParticles />

      {/* Content */}
      <div className="relative z-10 mx-auto flex max-w-6xl items-center px-6" style={{ minHeight: "88vh" }}>
        <div className="animate-fade-up" style={{ maxWidth: 620 }}>
          {/* Now Streaming badge */}
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full text-gold"
            style={{
              padding: "5px 14px",
              background: "rgba(212,168,70,0.1)",
              border: "1px solid rgba(212,168,70,0.2)",
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
            }}
          >
            <span style={{ color: "#E8651A" }}>Flames</span>{" "}
            <span
              className="font-heading italic font-normal"
              style={{
                color: "#8888a0",
                fontSize: "0.48em",
              }}
            >
              of our
            </span>{" "}
            <span style={{ color: "#D4A846" }}>Lives</span>
          </h1>

          {/* Description */}
          <p
            className="mb-4"
            style={{
              fontSize: 15,
              color: "#a0a0b8",
              lineHeight: 1.75,
              maxWidth: 480,
            }}
          >
            {feat.desc}
          </p>

          {/* Genre */}
          <p className="mb-8 text-xs text-text-secondary">{feat.genre}</p>

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
