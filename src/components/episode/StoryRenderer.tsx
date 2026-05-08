import type { StoryData } from "@/lib/types";

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
}

export function StoryRenderer({ story, seriesColor, mode, textSize = "normal" }: StoryRendererProps) {
  const { fontSize, lineHeight } = SIZE_MAP[textSize][mode];
  return (
    <article className="max-w-2xl">
      {/* Scene heading */}
      <p className="mb-8 text-sm italic text-text-secondary">{story.scene}</p>

      {/* Story blocks */}
      <div className="space-y-6">
        {story.paragraphs.map((block, i) => {
          switch (block.t) {
            case "p":
              return (
                <p
                  key={i}
                  className="text-text-story"
                  style={{ fontSize, lineHeight }}
                >
                  {block.c}
                </p>
              );
            case "q":
              return (
                <blockquote
                  key={i}
                  className="rounded-xl border-l-2 py-1 pl-5"
                  style={{ borderColor: seriesColor }}
                >
                  {block.speaker && (
                    <span
                      className="mb-1 block text-xs font-semibold uppercase tracking-wider"
                      style={{ color: seriesColor }}
                    >
                      {block.speaker}
                    </span>
                  )}
                  <p
                    className="text-base italic leading-[1.85] text-text-primary"
                  >
                    {block.c}
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
                <p
                  key={i}
                  className="mt-8 text-center font-heading text-xl font-bold italic"
                  style={{ color: seriesColor }}
                >
                  {block.c}
                </p>
              );
            default:
              return null;
          }
        })}
      </div>
    </article>
  );
}
