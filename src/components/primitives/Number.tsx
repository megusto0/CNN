import { useEffect, useRef, useState } from "react";

interface NumberProps {
  value: number;
  format?: (v: number) => string;
  className?: string;
  style?: React.CSSProperties;
}

export default function Number({
  value,
  format = (v) =>
    v >= 1000
      ? v.toLocaleString("ru-RU")
      : v % 1 === 0
        ? v.toString()
        : v.toFixed(2),
  className,
  style,
}: NumberProps) {
  const [displayed, setDisplayed] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;

    if (from === to) {
      setDisplayed(to);
      return;
    }

    const duration = 400;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(from + (to - from) * eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return (
    <span
      className={`font-mono font-medium tabular-nums ${className ?? ""}`}
      style={{
        fontFeatureSettings: '"tnum"',
        ...style,
      }}
    >
      {format(displayed)}
    </span>
  );
}
