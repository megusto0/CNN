interface SliderProps {
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  label?: string;
}

export default function Slider({
  min,
  max,
  step,
  value,
  onChange,
  label,
}: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <label className="flex flex-col gap-1">
      {label && (
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
          {label}: <span className="font-mono">{value}</span>
        </span>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, var(--accent) ${pct}%, var(--border-subtle) ${pct}%)`,
          accentColor: "var(--accent)",
        }}
      />
    </label>
  );
}
