import type { HTMLAttributes } from "react";

interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  color?: "accent" | "positive" | "negative" | "warning" | "neutral";
}

const colors: Record<NonNullable<TagProps["color"]>, React.CSSProperties> = {
  accent: { backgroundColor: "var(--feature-map)", color: "var(--accent)" },
  positive: { backgroundColor: "rgba(74,222,128,0.12)", color: "var(--positive)" },
  negative: { backgroundColor: "rgba(248,113,113,0.12)", color: "var(--negative)" },
  warning: { backgroundColor: "rgba(251,191,36,0.12)", color: "var(--warning)" },
  neutral: { backgroundColor: "var(--bg-sunken)", color: "var(--text-tertiary)" },
};

export default function Tag({ children, color = "neutral", style, ...props }: TagProps) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-mono font-medium"
      style={{ ...colors[color], ...style }}
      {...props}
    >
      {children}
    </span>
  );
}
