import type { HTMLAttributes } from "react";

export default function Kbd({ children, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className="inline-flex items-center justify-center min-w-[20px] h-5 px-1 rounded-sm text-xs font-mono"
      style={{
        backgroundColor: "var(--bg-sunken)",
        color: "var(--text-secondary)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "0 1px 0 0 var(--border-subtle)",
      }}
      {...props}
    >
      {children}
    </kbd>
  );
}
