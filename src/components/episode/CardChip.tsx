"use client";

interface CardChipProps {
  cardIndex: number;
  seriesColor: string;
  children: React.ReactNode;
}

export function CardChip({ cardIndex, seriesColor, children }: CardChipProps) {
  const onClick = () => {
    window.dispatchEvent(
      new CustomEvent("cardfables:focus-card", { detail: { index: cardIndex } })
    );
    const target = document.getElementById(`sidebar-card-${cardIndex}`);
    if (target) {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;
      target.scrollIntoView({
        behavior: reduce ? "instant" : "smooth",
        block: "center",
      });
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer border-0 bg-transparent p-0 transition-colors hover:bg-[rgba(74,64,53,0.06)]"
      style={{
        font: "inherit",
        color: "inherit",
        borderBottom: `1px dotted ${seriesColor}`,
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}
