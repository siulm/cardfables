interface FieldProps {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
}

export function Field({
  label,
  placeholder,
  value,
  onChange,
  multiline = false,
  rows = 4,
}: FieldProps) {
  const inputStyles =
    "w-full rounded-xl border border-[rgba(255,255,255,0.06)] bg-surface px-4 py-3 text-sm text-text-primary placeholder:text-text-dim outline-none transition-colors duration-200 focus:border-[rgba(212,168,70,0.3)]";

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-text-secondary">{label}</label>
      {multiline ? (
        <textarea
          className={inputStyles}
          style={{ resize: "vertical" }}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
        />
      ) : (
        <input
          type="text"
          className={inputStyles}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
