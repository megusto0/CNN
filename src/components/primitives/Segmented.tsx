interface SegmentedProps {
  options: { key: string; label: string }[];
  active: string;
  onChange: (key: string) => void;
}

export default function Segmented({ options, active, onChange }: SegmentedProps) {
  return (
    <div
      className="inline-flex gap-1 p-1 rounded-md"
      style={{ backgroundColor: "var(--bg-sunken)" }}
    >
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className="px-3 py-1 text-sm rounded-sm transition-colors"
          style={{
            backgroundColor:
              active === opt.key ? "var(--bg-raised)" : "transparent",
            color:
              active === opt.key
                ? "var(--text-primary)"
                : "var(--text-tertiary)",
            boxShadow:
              active === opt.key
                ? "0 1px 0 0 var(--border-subtle), 0 0 0 1px var(--border-subtle) inset"
                : "none",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
