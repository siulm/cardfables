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

  const ariaLabel =
    typeof children === "string"
      ? `Focus ${children} card in sidebar`
      : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="cursor-pointer border-0 bg-transparent p-0 transition-colors hover:bg-[rgba(74,64,53,0.06)] focus-visible:outline-none focus-visible:bg-[rgba(74,64,53,0.10)] focus-visible:ring-2 focus-visible:ring-offset-1"
      style={{
        font: "inherit",
        color: "inherit",
        borderBottom: `1px dotted ${seriesColor}`,
        fontWeight: 600,
        ["--tw-ring-color" as string]: seriesColor,
      }}
    >
      {children}
    </button>
  );
}
