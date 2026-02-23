interface TagProps {
  label: string;
  color?: string;
}

export function Tag({ label, color }: TagProps) {
  const isAiring = label === "Airing";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
      style={{
        background: isAiring
          ? "rgba(34,197,94,0.1)"
          : color
            ? `${color}15`
            : "rgba(212,168,70,0.1)",
        color: isAiring ? "#22C55E" : color || "#D4A846",
        border: `1px solid ${isAiring ? "rgba(34,197,94,0.2)" : color ? `${color}30` : "rgba(212,168,70,0.2)"}`,
      }}
    >
      {isAiring && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full animate-pulse-glow"
          style={{ background: "#22C55E" }}
        />
      )}
      {label}
    </span>
  );
}
