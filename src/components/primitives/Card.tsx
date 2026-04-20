import type { ReactNode, HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: boolean;
}

export default function Card({
  children,
  padding = true,
  className = "",
  style,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-md border ${className}`}
      style={{
        backgroundColor: "var(--bg-raised)",
        borderColor: "var(--border-subtle)",
        padding: padding ? "16px" : undefined,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
