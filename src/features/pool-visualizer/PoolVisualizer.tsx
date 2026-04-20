import { useState, useMemo } from "react";

const DEFAULT_GRID = [
  [1, 2, 3, 4, 5, 6, 7, 8],
  [8, 7, 6, 5, 4, 3, 2, 1],
  [2, 4, 6, 8, 1, 3, 5, 7],
  [7, 5, 3, 1, 8, 6, 4, 2],
  [3, 6, 9, 2, 5, 8, 1, 4],
  [4, 1, 8, 5, 2, 9, 6, 3],
  [5, 8, 1, 6, 3, 4, 9, 2],
  [6, 3, 4, 9, 7, 2, 5, 1],
];

type PoolMode = "max" | "avg";
type WindowSize = 2 | 3;

export default function PoolVisualizer() {
  const [grid, setGrid] = useState<number[][]>(DEFAULT_GRID);
  const [mode, setMode] = useState<PoolMode>("max");
  const [windowSize, setWindowSize] = useState<WindowSize>(2);

  const output = useMemo(() => {
    const stride = windowSize;
    const outH = Math.floor((8 - windowSize) / stride) + 1;
    const outW = Math.floor((8 - windowSize) / stride) + 1;
    const result: number[][] = [];
    for (let oy = 0; oy < outH; oy++) {
      const row: number[] = [];
      for (let ox = 0; ox < outW; ox++) {
        const vals: number[] = [];
        for (let wy = 0; wy < windowSize; wy++) {
          for (let wx = 0; wx < windowSize; wx++) {
            vals.push(grid[oy * stride + wy][ox * stride + wx]);
          }
        }
        row.push(mode === "max" ? Math.max(...vals) : vals.reduce((a, b) => a + b, 0) / vals.length);
      }
      result.push(row);
    }
    return result;
  }, [grid, mode, windowSize]);

  const outH = output.length;
  const outW = output[0]?.length ?? 0;

  function updateCell(r: number, c: number, val: number) {
    setGrid((prev) => prev.map((row, ri) => ri === r ? row.map((v, ci) => ci === c ? val : v) : row));
  }

  const cellSize = 36;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-4 items-center">
        <div className="flex gap-1 p-1 rounded-md" style={{ backgroundColor: "var(--bg-sunken)" }}>
          <button
            onClick={() => setMode("max")}
            className="px-3 py-1 text-sm rounded-sm"
            style={{
              backgroundColor: mode === "max" ? "var(--bg-raised)" : "transparent",
              color: mode === "max" ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: mode === "max" ? "0 1px 0 0 var(--border-subtle), 0 0 0 1px var(--border-subtle) inset" : "none",
            }}
          >
            Max
          </button>
          <button
            onClick={() => setMode("avg")}
            className="px-3 py-1 text-sm rounded-sm"
            style={{
              backgroundColor: mode === "avg" ? "var(--bg-raised)" : "transparent",
              color: mode === "avg" ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: mode === "avg" ? "0 1px 0 0 var(--border-subtle), 0 0 0 1px var(--border-subtle) inset" : "none",
            }}
          >
            Average
          </button>
        </div>
        <div className="flex gap-1 p-1 rounded-md" style={{ backgroundColor: "var(--bg-sunken)" }}>
          <button
            onClick={() => setWindowSize(2)}
            className="px-3 py-1 text-sm rounded-sm"
            style={{
              backgroundColor: windowSize === 2 ? "var(--bg-raised)" : "transparent",
              color: windowSize === 2 ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: windowSize === 2 ? "0 1px 0 0 var(--border-subtle), 0 0 0 1px var(--border-subtle) inset" : "none",
            }}
          >
            2×2
          </button>
          <button
            onClick={() => setWindowSize(3)}
            className="px-3 py-1 text-sm rounded-sm"
            style={{
              backgroundColor: windowSize === 3 ? "var(--bg-raised)" : "transparent",
              color: windowSize === 3 ? "var(--text-primary)" : "var(--text-tertiary)",
              boxShadow: windowSize === 3 ? "0 1px 0 0 var(--border-subtle), 0 0 0 1px var(--border-subtle) inset" : "none",
            }}
          >
            3×3
          </button>
        </div>
      </div>

      <div className="flex gap-8 items-start">
        <div>
          <div className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
            Вход 8×8
          </div>
          <div
            className="grid gap-px"
            style={{
              gridTemplateColumns: `repeat(8, ${cellSize}px)`,
            }}
          >
            {grid.map((row, ri) =>
              row.map((val, ci) => (
                <input
                  key={`${ri}-${ci}`}
                  type="number"
                  value={val}
                  onChange={(e) => {
                    const v = parseInt(e.target.value);
                    if (!isNaN(v)) updateCell(ri, ci, v);
                  }}
                  className="text-center text-sm font-mono rounded-sm"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: "var(--bg-sunken)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              )),
            )}
          </div>
        </div>

        <div className="flex items-center text-2xl" style={{ color: "var(--text-tertiary)" }}>
          →
        </div>

        <div>
          <div className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>
            Выход {outW}×{outH} ({mode === "max" ? "Max" : "Avg"} Pool {windowSize}×{windowSize})
          </div>
          <div
            className="grid gap-px"
            style={{
              gridTemplateColumns: `repeat(${outW}, ${cellSize}px)`,
            }}
          >
            {output.map((row, ri) =>
              row.map((val, ci) => (
                <div
                  key={`${ri}-${ci}`}
                  className="flex items-center justify-center rounded-sm text-sm font-mono"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    backgroundColor: "var(--feature-map)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--accent)",
                  }}
                >
                  {Number.isInteger(val) ? val : val.toFixed(1)}
                </div>
              )),
            )}
          </div>
        </div>
      </div>

      <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
        <p>
          Формула выхода: H_out = ⌊(H_in − K) / S⌋ + 1 = ⌊(8 − {windowSize}) / {windowSize}⌋ + 1 = {outH}
        </p>
        <p className="mt-1">
          У max-pool нет обучаемых параметров — операция выбирает максимум в окне.
        </p>
      </div>
    </div>
  );
}
