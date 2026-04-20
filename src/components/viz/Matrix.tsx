import { useMemo } from "react";

interface MatrixProps {
  data: number[][];
  labels?: string[];
  title?: string;
  cellSize?: number;
}

export default function Matrix({
  data,
  labels,
  title,
  cellSize = 32,
}: MatrixProps) {
  const { normalized } = useMemo(() => {
    const flat = data.flat();
    const max = Math.max(...flat, 1);
    const norm = data.map((row) => row.map((v) => v / max));
    return { normalized: norm };
  }, [data]);

  const rows = data.length;
  const cols = data[0]?.length ?? 0;
  const gap = 1;

  return (
    <figure>
      {title && (
        <figcaption
          className="text-xs mb-2"
          style={{ color: "var(--text-tertiary)" }}
        >
          {title}
        </figcaption>
      )}
      <svg
        width={cols * (cellSize + gap) + 2}
        height={rows * (cellSize + gap) + 2}
      >
        {normalized.map((row, ri) =>
          row.map((val, ci) => {
            const r = Math.round(124 + (255 - 124) * (1 - val));
            const g = Math.round(155 + (255 - 155) * (1 - val));
            const b = 255;
            return (
              <g key={`${ri}-${ci}`}>
                <rect
                  x={ci * (cellSize + gap)}
                  y={ri * (cellSize + gap)}
                  width={cellSize}
                  height={cellSize}
                  rx={2}
                  fill={`rgba(${r},${g},${b},${0.15 + val * 0.7})`}
                  stroke="var(--border-subtle)"
                  strokeWidth={0.5}
                />
                <text
                  x={ci * (cellSize + gap) + cellSize / 2}
                  y={ri * (cellSize + gap) + cellSize / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={val > 0.5 ? "var(--text-primary)" : "var(--text-secondary)"}
                  fontSize={cellSize < 28 ? 8 : 10}
                  fontFamily="JetBrains Mono, monospace"
                >
                  {data[ri][ci]}
                </text>
              </g>
            );
          }),
        )}
        {labels &&
          labels.slice(0, cols).map((label, ci) => (
            <text
              key={`col-${ci}`}
              x={ci * (cellSize + gap) + cellSize / 2}
              y={rows * (cellSize + gap) + 12}
              textAnchor="middle"
              fill="var(--text-tertiary)"
              fontSize={8}
            >
              {label.length > 4 ? label.slice(0, 4) : label}
            </text>
          ))}
      </svg>
    </figure>
  );
}
