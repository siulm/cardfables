import type { CardInfo, StoryData } from "@/lib/types";
import { splitParagraph } from "@/lib/cardMentions";
import { CardChip } from "./CardChip";
import { FadeUpOnScroll } from "@/components/effects/FadeUpOnScroll";

type TextSize = "normal" | "large" | "xl";

const SIZE_MAP: Record<TextSize, Record<"junior" | "full", { fontSize: string; lineHeight: string }>> = {
  normal: { junior: { fontSize: "16px", lineHeight: "1.9" }, full: { fontSize: "15px", lineHeight: "1.85" } },
  large:  { junior: { fontSize: "19px", lineHeight: "2.0" }, full: { fontSize: "18px", lineHeight: "1.95" } },
  xl:     { junior: { fontSize: "22px", lineHeight: "2.1" }, full: { fontSize: "21px", lineHeight: "2.05" } },
};

interface StoryRendererProps {
  story: StoryData;
  seriesColor: string;
  mode: "junior" | "full";
  textSize?: TextSize;
  cards: CardInfo[];
}

function renderWithChips(
  text: string,
  cards: CardInfo[],
  seriesColor: string
): React.ReactNode {
  const segments = splitParagraph(text, cards);
  return segments.map((seg, i) => {
    if (seg.kind === "text") return <span key={i}>{seg.value}</span>;
    return (
      <CardChip key={i} cardIndex={seg.cardIndex} seriesColor={seriesColor}>
        {seg.value}
      </CardChip>
    );
  });
}

export function StoryRenderer({
  story,
  seriesColor,
  mode,
  textSize = "normal",
  cards,
}: StoryRendererProps) {
  const { fontSize, lineHeight } = SIZE_MAP[textSize][mode];
  const firstProseIndex = story.paragraphs.findIndex((b) => b.t === "p");

  return (
    <article
      className="max-w-2xl"
      style={{ ["--series-color" as string]: seriesColor }}
    >
      {/* Scene heading — italic with flanking ornaments */}
      <p className="mb-8 flex items-center justify-center gap-3 text-sm italic text-text-secondary">
        <span aria-hidden="true" style={{ color: seriesColor, opacity: 0.5 }}>·</span>
        <span>{story.scene}</span>
        <span aria-hidden="true" style={{ color: seriesColor, opacity: 0.5 }}>·</span>
      </p>

      <div className="space-y-6">
        {story.paragraphs.map((block, i) => {
          switch (block.t) {
            case "p":
              if (i === firstProseIndex && block.c.length > 0) {
                const firstChar = block.c.charAt(0);
                const rest = block.c.slice(1);
                return (
                  <p
                    key={i}
                    className="text-text-story story-paragraph"
                    style={{ fontSize, lineHeight }}
                  >
                    <span
                      className="drop-cap-letter"
                      style={{ color: seriesColor }}
                    >
                      {firstChar}
                    </span>
                    {renderWithChips(rest, cards, seriesColor)}
                  </p>
                );
              }
              return (
                <p
                  key={i}
                  className="text-text-story story-paragraph"
                  style={{ fontSize, lineHeight }}
                >
                  {renderWithChips(block.c, cards, seriesColor)}
                </p>
              );
            case "q":
              return (
                <blockquote
                  key={i}
                  className="rounded-xl py-1 pl-5"
                  style={{
                    borderLeft: `2px solid ${seriesColor}`,
                    borderImage: `linear-gradient(180deg, ${seriesColor}, ${seriesColor}33) 1`,
                  }}
                >
                  {block.speaker && (
                    <span
                      className="mb-1 block text-xs font-semibold uppercase tracking-wider"
                      style={{ color: seriesColor }}
                    >
                      {block.speaker}
                    </span>
                  )}
                  <p className="text-base italic leading-[1.85] text-text-primary">
                    {renderWithChips(block.c, cards, seriesColor)}
                  </p>
                </blockquote>
              );
            case "a":
              return (
                <p
                  key={i}
                  className="text-center text-sm italic text-text-secondary"
                >
                  {block.c}
                </p>
              );
            case "end":
              return (
                <FadeUpOnScroll key={i} animation="curtain-drop" threshold={0.4}>
                  <p
                    className="mt-8 text-center font-heading text-xl font-bold italic"
                    style={{ color: seriesColor }}
                  >
                    {block.c}
                  </p>
                </FadeUpOnScroll>
              );
            default:
              return null;
          }
        })}
      </div>
    </article>
  );
}
