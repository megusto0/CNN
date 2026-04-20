import { type ReactNode } from "react";

interface TabsProps {
  items: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
  children: ReactNode;
}

export default function Tabs({ items, active, onChange, children }: TabsProps) {
  return (
    <div>
      <div
        className="flex gap-1 p-1 rounded-md w-fit"
        style={{ backgroundColor: "var(--bg-sunken)" }}
      >
        {items.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className="px-3 py-1.5 text-sm rounded-sm transition-colors"
            style={{
              backgroundColor:
                active === item.key ? "var(--bg-raised)" : "transparent",
              color:
                active === item.key
                  ? "var(--text-primary)"
                  : "var(--text-tertiary)",
              boxShadow:
                active === item.key
                  ? "0 1px 0 0 var(--border-subtle), 0 0 0 1px var(--border-subtle) inset"
                  : "none",
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
