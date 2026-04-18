import Link from "next/link";

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  variant?: "primary" | "ghost";
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}

export function Button({
  children,
  href,
  variant = "primary",
  onClick,
  type = "button",
  className = "",
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 cursor-pointer";

  const variantStyles =
    variant === "primary"
      ? "text-[#FFFEF7] shadow-[0_8px_28px_rgba(212,137,58,0.25)]"
      : "border border-[rgba(74,64,53,0.10)] text-text-primary hover:border-[rgba(74,64,53,0.20)]";

  const style =
    variant === "primary"
      ? { background: "linear-gradient(135deg, #D4893A, #B86E28)" }
      : undefined;

  const classes = `${baseStyles} ${variantStyles} ${className}`;

  if (href) {
    return (
      <Link href={href} className={classes} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes} style={style}>
      {children}
    </button>
  );
}
