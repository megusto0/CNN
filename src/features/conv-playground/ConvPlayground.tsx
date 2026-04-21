import { useState, useRef, useEffect, useCallback } from "react";
import { convolve2d, outputSize } from "../../lib/conv";
import NumberInput from "../../components/primitives/NumberInput";

const presets: Record<string, number[]> = {
  "Edge (Sobel X)": [-1, 0, 1, -2, 0, 2, -1, 0, 1],
  "Edge (Sobel Y)": [-1, -2, -1, 0, 0, 0, 1, 2, 1],
  Laplacian: [0, 1, 0, 1, -4, 1, 0, 1, 0],
  "Blur (box 3×3)": [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9],
  Sharpen: [0, -1, 0, -1, 5, -1, 0, -1, 0],
  Emboss: [-2, -1, 0, -1, 1, 1, 0, 1, 2],
  Identity: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  Custom: [0, 0, 0, 0, 1, 0, 0, 0, 0],
};

const IMG_SIZE = 256;
const DISPLAY_SIZE = 320;

export default function ConvPlayground() {
  const [kernel, setKernel] = useState<number[]>(presets["Edge (Sobel X)"]);
  const [preset, setPreset] = useState("Edge (Sobel X)");
  const [stride, setStride] = useState(1);
  const [pad, setPad] = useState(0);
  const [useRelu, setUseRelu] = useState(false);
  const [presetName, setPresetName] = useState("checker");

  const inputCanvasRef = useRef<HTMLCanvasElement>(null);
  const outputCanvasRef = useRef<HTMLCanvasElement>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const [outDims, setOutDims] = useState<[number, number]>([254, 254]);
  const [hoverOut, setHoverOut] = useState<{ x: number; y: number } | null>(null);
  const rafRef = useRef(0);

  const recompute = useCallback(() => {
    if (!imageDataRef.current) return;
    const data = imageDataRef.current.data;
    const result = convolve2d(data, IMG_SIZE, IMG_SIZE, kernel, stride, pad, useRelu);

    const canvas = outputCanvasRef.current;
    if (!canvas) return;
    const [outW, outH] = outputSize(IMG_SIZE, IMG_SIZE, 3, stride, pad);
    setOutDims([outW, outH]);
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d")!;
    const outImg = ctx.createImageData(outW, outH);
    for (let i = 0; i < outW * outH; i++) {
      outImg.data[i * 4] = result[i];
      outImg.data[i * 4 + 1] = result[i];
      outImg.data[i * 4 + 2] = result[i];
      outImg.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(outImg, 0, 0);
  }, [kernel, stride, pad, useRelu]);

  useEffect(() => {
    const canvas = inputCanvasRef.current;
    if (!canvas) return;
    canvas.width = IMG_SIZE;
    canvas.height = IMG_SIZE;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, 0, 0, IMG_SIZE, IMG_SIZE);
      imageDataRef.current = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE);
      recompute();
    };
    img.onerror = () => {
      generateCheckerboard(ctx);
      imageDataRef.current = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE);
      recompute();
    };
    img.src = `/images/conv-presets/${presetName}.png`;
  }, [presetName, recompute]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(recompute);
    return () => cancelAnimationFrame(rafRef.current);
  }, [recompute]);

  function handleKernelChange(index: number, value: number) {
    setPreset("Custom");
    setKernel((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handlePreset(name: string) {
    setPreset(name);
    setKernel([...presets[name]]);
  }

  function handleDrop(e: React.DragEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = inputCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d")!;
        ctx.clearRect(0, 0, IMG_SIZE, IMG_SIZE);
        ctx.drawImage(img, 0, 0, IMG_SIZE, IMG_SIZE);
        imageDataRef.current = ctx.getImageData(0, 0, IMG_SIZE, IMG_SIZE);
        recompute();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  const scale = DISPLAY_SIZE / IMG_SIZE;
  const hoverInX = hoverOut ? (hoverOut.x * stride - pad) * scale : null;
  const hoverInY = hoverOut ? (hoverOut.y * stride - pad) * scale : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
            Входное изображение
          </span>
          <div className="relative" style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}>
            <canvas
              ref={inputCanvasRef}
              style={{
                width: DISPLAY_SIZE,
                height: DISPLAY_SIZE,
                imageRendering: "pixelated",
                border: "1px solid var(--border-subtle)",
                borderRadius: 6,
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            />
            {hoverInX != null && hoverInY != null && (
              <div
                className="absolute pointer-events-none"
                style={{
                  left: hoverInX - 1,
                  top: hoverInY - 1,
                  width: 3 * scale,
                  height: 3 * scale,
                  border: "2px solid var(--accent)",
                  opacity: 0.6,
                  borderRadius: 2,
                  transition: "all 0.05s ease-out",
                }}
              />
            )}
          </div>
          <div className="flex gap-2 mt-1">
            {["checker", "cameraman", "portrait", "cat"].map((name) => (
              <button
                key={name}
                onClick={() => setPresetName(name)}
                className="px-2 py-0.5 text-xs rounded-sm"
                style={{
                  backgroundColor:
                    presetName === name ? "var(--feature-map)" : "var(--bg-sunken)",
                  color:
                    presetName === name ? "var(--accent)" : "var(--text-tertiary)",
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
            Ядро 3×3
          </span>
          <div className="grid grid-cols-3 gap-1 w-fit">
            {kernel.map((val, i) => (
              <NumberInput
                key={i}
                value={val}
                onChange={(v) => handleKernelChange(i, v)}
                min={-5}
                max={5}
                step={0.1}
                className="w-14"
              />
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Пресет
              <select
                value={preset}
                onChange={(e) => handlePreset(e.target.value)}
                className="ml-2 px-2 py-0.5 rounded-sm text-xs"
                style={{
                  backgroundColor: "var(--bg-sunken)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                {Object.keys(presets).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Stride
              <select
                value={stride}
                onChange={(e) => setStride(Number(e.target.value))}
                className="ml-2 px-2 py-0.5 rounded-sm text-xs"
                style={{
                  backgroundColor: "var(--bg-sunken)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                {[1, 2, 3].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Padding
              <select
                value={pad}
                onChange={(e) => setPad(Number(e.target.value))}
                className="ml-2 px-2 py-0.5 rounded-sm text-xs"
                style={{
                  backgroundColor: "var(--bg-sunken)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                <option value={0}>0 (valid)</option>
                <option value={1}>1 (same)</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--text-secondary)" }}>
              <input
                type="checkbox"
                checked={useRelu}
                onChange={(e) => setUseRelu(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              ReLU после свёртки
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
            Выход
          </span>
          <span
            className="px-1.5 py-0.5 text-xs rounded-sm font-mono"
            style={{
              backgroundColor: "rgba(74,222,128,0.12)",
              color: "var(--positive)",
            }}
          >
            live
          </span>
          <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
            {IMG_SIZE}×{IMG_SIZE} → {outDims[0]}×{outDims[1]}
          </span>
        </div>
        <div
          className="relative"
          style={{ width: DISPLAY_SIZE, height: DISPLAY_SIZE }}
        >
          <canvas
            ref={outputCanvasRef}
            style={{
              width: DISPLAY_SIZE,
              height: DISPLAY_SIZE,
              imageRendering: "pixelated",
              border: "1px solid var(--border-subtle)",
              borderRadius: 6,
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.floor(
                ((e.clientX - rect.left) / rect.width) * outDims[0],
              );
              const y = Math.floor(
                ((e.clientY - rect.top) / rect.height) * outDims[1],
              );
              setHoverOut({ x, y });
            }}
            onMouseLeave={() => setHoverOut(null)}
          />
        </div>
      </div>
    </div>
  );
}

function generateCheckerboard(ctx: CanvasRenderingContext2D) {
  const size = 8;
  for (let y = 0; y < IMG_SIZE; y += size) {
    for (let x = 0; x < IMG_SIZE; x += size) {
      ctx.fillStyle =
        (Math.floor(x / size) + Math.floor(y / size)) % 2 === 0
          ? "#444"
          : "#222";
      ctx.fillRect(x, y, size, size);
    }
  }
}
