"use client";

interface FilterPillsProps {
  options: readonly string[];
  active: string;
  onChange: (value: string) => void;
}

export function FilterPills({ options, active, onChange }: FilterPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          onClick={() => onChange(option)}
          className="rounded-full px-5 py-2 text-sm font-medium transition-all duration-200 cursor-pointer"
          style={{
            background:
              active === option
                ? "rgba(212,168,70,0.15)"
                : "rgba(255,255,255,0.04)",
            color: active === option ? "#D4A846" : "#8888a0",
            border: `1px solid ${active === option ? "rgba(212,168,70,0.3)" : "rgba(255,255,255,0.10)"}`,
          }}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
