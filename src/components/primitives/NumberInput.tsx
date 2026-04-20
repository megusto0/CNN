import { type InputHTMLAttributes, useRef } from "react";

interface NumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  className,
  style,
  ...props
}: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <input
      ref={inputRef}
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const v = parseFloat(e.target.value);
        if (!isNaN(v)) onChange(v);
      }}
      className={`w-16 px-2 py-1 rounded-sm text-sm font-mono tabular-nums text-center ${className ?? ""}`}
      style={{
        backgroundColor: "var(--bg-sunken)",
        border: "1px solid var(--border-subtle)",
        color: "var(--text-primary)",
        fontFeatureSettings: '"tnum"',
        ...style,
      }}
      {...props}
    />
  );
}
