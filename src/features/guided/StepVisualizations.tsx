import { Download, ExternalLink, FileJson, Pause, Play, RotateCcw, SkipForward, Upload } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import ConvPlayground from "../conv-playground/ConvPlayground";
import PoolVisualizer from "../pool-visualizer/PoolVisualizer";
import CodeBlock from "../../components/tour/CodeBlock";
import ShapeTag from "../../components/tour/ShapeTag";
import StatusTag from "../../components/tour/StatusTag";
import { answerKey, useProgress } from "../../tour/progress";
import { stepMetas } from "../../tour/steps";

const classes = [
  "airplane",
  "automobile",
  "bird",
  "cat",
  "deer",
  "dog",
  "frog",
  "horse",
  "ship",
  "truck",
];

const classRu: Record<string, string> = {
  airplane: "самолет",
  automobile: "автомобиль",
  bird: "птица",
  cat: "кошка",
  deer: "олень",
  dog: "собака",
  frog: "лягушка",
  horse: "лошадь",
  ship: "корабль",
  truck: "грузовик",
};

const forwardPresetImages: Record<string, string> = {
  cat: "/data/transfer-presets/cat.png",
  dog: "/data/transfer-presets/dog.png",
  automobile: "/data/transfer-presets/automobile.png",
  ship: "/data/transfer-presets/ship.png",
  frog: "/data/transfer-presets/frog.png",
};

type RunName = "scratch" | "feature_extractor" | "fine_tune";

const runOrder: RunName[] = ["scratch", "feature_extractor", "fine_tune"];
const runLabels: Record<RunName, string> = {
  scratch: "Scratch CNN",
  feature_extractor: "ResNet-18 feature extractor",
  fine_tune: "ResNet-18 fine-tune",
};

type TrainingRun = {
  name: RunName;
  display_name: string;
  epochs: number;
  train_loss: number[];
  train_acc: number[];
  val_loss: number[];
  val_acc: number[];
  test_acc: number;
  confusion: number[][];
  per_class_acc: Record<string, number>;
  misclassifications: {
    image_path: string | null;
    image_available?: boolean;
    true: string;
    pred: string;
    confidence: number;
  }[];
};

type SummaryRow = {
  id: RunName;
  name: string;
  trainable_params: number;
  time_min?: number | null;
  test_acc: number;
  real_metrics?: boolean;
};

type ForwardLayer = {
  name: string;
  shape: number[];
  file: string;
  dtype: "float32";
  params?: number;
};

export function StepVisualization({ stepId }: { stepId: number }) {
  if (stepId === 1) return <CifarBrowser />;
  if (stepId === 2) return <ConvolutionStepper />;
  if (stepId === 3) return <DimensionCalculator />;
  if (stepId === 4) return <PoolingPanel />;
  if (stepId === 5) return <CnnBuilder />;
  if (stepId === 6) return <ForwardPassWalker />;
  if (stepId === 7) return <TransferLearningPanel />;
  if (stepId === 8) return <TransferModesDiagram />;
  if (stepId === 9) return <ColabPanel />;
  if (stepId === 10) return <AnalysisPanels />;
  return <ReportBuilder />;
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-md border p-4 ${className}`}
      style={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}
    >
      {children}
    </div>
  );
}

function CifarBrowser() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zoomRef = useRef<HTMLCanvasElement>(null);
  const [samples, setSamples] = useState<Uint8Array | null>(null);
  const [labels, setLabels] = useState<{ label: number; className: string; filename: string }[]>([]);
  const [selected, setSelected] = useState(0);
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [summary, setSummary] = useState<SummaryRow[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/data/cifar-samples.bin").then((res) => res.arrayBuffer()),
      fetch("/data/cifar-samples-labels.json").then((res) => res.json() as Promise<typeof labels>),
      fetch("/data/training-runs/summary.json").then((res) => res.json() as Promise<SummaryRow[]>).catch(() => []),
    ]).then(([buffer, nextLabels, nextSummary]) => {
      setSamples(new Uint8Array(buffer));
      setLabels(nextLabels);
      setSummary(nextSummary);
    }).catch(() => {
      setSamples(makeFallbackCifar());
      setLabels(Array.from({ length: 100 }, (_, index) => {
        const className = classes[Math.floor(index / 10)];
        return { label: Math.floor(index / 10), className, filename: `${className}_${index % 10}.png` };
      }));
    });
  }, []);

  const drawSample = useCallback((ctx: CanvasRenderingContext2D, index: number, dx: number, dy: number, scale: number) => {
    if (!samples) return;
    const imageData = ctx.createImageData(32, 32);
    const offset = index * 3 * 32 * 32;
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const pixel = y * 32 + x;
        imageData.data[pixel * 4] = samples[offset + pixel];
        imageData.data[pixel * 4 + 1] = samples[offset + 1024 + pixel];
        imageData.data[pixel * 4 + 2] = samples[offset + 2048 + pixel];
        imageData.data[pixel * 4 + 3] = 255;
      }
    }
    const temp = document.createElement("canvas");
    temp.width = 32;
    temp.height = 32;
    temp.getContext("2d")?.putImageData(imageData, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(temp, dx, dy, 32 * scale, 32 * scale);
  }, [samples]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !samples) return;
    canvas.width = 320;
    canvas.height = 320;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 320, 320);
    for (let i = 0; i < 100; i++) {
      drawSample(ctx, i, (i % 10) * 32, Math.floor(i / 10) * 32, 1);
    }
    if (hoverRow != null) {
      ctx.fillStyle = "rgba(124,155,255,0.14)";
      ctx.fillRect(0, hoverRow * 32, 320, 32);
    }
    ctx.strokeStyle = "#7C9BFF";
    ctx.lineWidth = 2;
    ctx.strokeRect((selected % 10) * 32 + 1, Math.floor(selected / 10) * 32 + 1, 30, 30);
  }, [drawSample, hoverRow, samples, selected]);

  useEffect(() => {
    const canvas = zoomRef.current;
    if (!canvas || !samples) return;
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 256, 256);
    drawSample(ctx, selected, 0, 0, 8);
  }, [drawSample, samples, selected]);

  const selectedLabel = labels[selected];

  return (
    <div className="grid gap-4 xl:grid-cols-[auto_1fr]">
      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">100 образцов CIFAR-10</p>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            10 классов x 10
          </span>
        </div>
        <canvas
          ref={canvasRef}
          className="block rounded-md border"
          style={{ width: 320, height: 320, imageRendering: "pixelated", borderColor: "var(--border-subtle)" }}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            setHoverRow(Math.floor(((event.clientY - rect.top) / rect.height) * 10));
          }}
          onMouseLeave={() => setHoverRow(null)}
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = Math.floor(((event.clientX - rect.left) / rect.width) * 10);
            const y = Math.floor(((event.clientY - rect.top) / rect.height) * 10);
            setSelected(y * 10 + x);
          }}
        />
        <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)" }}>
          {hoverRow == null ? "Наведите на строку, чтобы увидеть класс." : classRu[classes[hoverRow]]}
        </p>
      </Panel>

      <div className="grid gap-4">
        <Panel>
          <div className="grid gap-4 sm:grid-cols-[16rem_1fr]">
            <canvas
              ref={zoomRef}
              className="rounded-md border"
              style={{ width: 256, height: 256, imageRendering: "pixelated", borderColor: "var(--border-subtle)" }}
            />
            <div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Выбранный образец</p>
              <h3 className="mt-1 text-xl font-semibold">{classRu[selectedLabel?.className ?? "cat"] ?? "класс"}</h3>
              <p className="mt-2 font-mono text-sm" style={{ color: "var(--text-tertiary)" }}>
                {selectedLabel?.filename ?? "loading.bin"}
              </p>
              <p className="mt-4 max-w-prose text-sm" style={{ color: "var(--text-secondary)" }}>
                Увеличение nearest-neighbor специально оставляет пиксели грубыми: модель работает именно с таким низким разрешением, а не с красивой фотографией.
              </p>
            </div>
          </div>
        </Panel>
        <Panel>
          <h3 className="mb-3 text-sm font-semibold">Три конфигурации лабораторной</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left" style={{ borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}>
                  <th className="py-2 pr-4">Модель</th>
                  <th className="py-2 pr-4">Trainable params</th>
                  <th className="py-2 pr-4">T4</th>
                  <th className="py-2">Test acc</th>
                </tr>
              </thead>
              <tbody>
                {(summary.length ? summary : defaultSummary()).map((row) => (
                  <tr key={row.id} className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <td className="py-2 pr-4">{row.name}</td>
                    <td className="py-2 pr-4 font-mono">{row.trainable_params.toLocaleString("ru-RU")}</td>
                    <td className="py-2 pr-4">{formatTime(row.time_min)}</td>
                    <td className="py-2 font-mono">{formatPercent(row.test_acc)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ConvolutionStepper() {
  const initialGrid = useMemo(() => [
    [2, 3, 5, 7, 4, 1, 2, 8],
    [1, 4, 2, 9, 6, 2, 3, 5],
    [5, 7, 1, 4, 3, 7, 9, 1],
    [4, 2, 8, 1, 5, 6, 2, 3],
    [9, 1, 3, 5, 8, 4, 7, 2],
    [6, 5, 2, 7, 1, 9, 4, 8],
    [3, 8, 6, 2, 7, 5, 1, 4],
    [7, 9, 4, 6, 2, 3, 8, 5],
  ], []);
  const presets: Record<string, number[]> = {
    "Sobel X": [-1, 0, 1, -2, 0, 2, -1, 0, 1],
    "Sobel Y": [-1, -2, -1, 0, 0, 0, 1, 2, 1],
    Laplacian: [0, 1, 0, 1, -4, 1, 0, 1, 0],
    Blur: [1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9, 1 / 9],
    Identity: [0, 0, 0, 0, 1, 0, 0, 0, 0],
  };
  const [grid, setGrid] = useState(initialGrid);
  const [kernel, setKernel] = useState(presets["Sobel X"]);
  const [pos, setPos] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [tab, setTab] = useState<"numbers" | "image">("numbers");

  const outputs = useMemo(() => {
    const result: number[] = [];
    for (let y = 0; y < 6; y++) {
      for (let x = 0; x < 6; x++) {
        let sum = 0;
        for (let ky = 0; ky < 3; ky++) {
          for (let kx = 0; kx < 3; kx++) {
            sum += grid[y + ky][x + kx] * kernel[ky * 3 + kx];
          }
        }
        result.push(Math.round(sum * 100) / 100);
      }
    }
    return result;
  }, [grid, kernel]);

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => {
      setPos((current) => (current + 1) % 36);
    }, 800);
    return () => window.clearInterval(id);
  }, [playing]);

  const px = pos % 6;
  const py = Math.floor(pos / 6);
  const expression = kernel.map((weight, index) => {
    const x = index % 3;
    const y = Math.floor(index / 3);
    return `${grid[py + y][px + x]}*${formatNumber(weight)}`;
  }).join(" + ");

  if (tab === "image") {
    return (
      <Panel>
        <div className="mb-4 flex gap-2">
          <button type="button" onClick={() => setTab("numbers")} className="rounded-md px-3 py-1.5 text-sm" style={{ backgroundColor: "var(--bg-sunken)" }}>
            На числах
          </button>
          <button type="button" className="rounded-md px-3 py-1.5 text-sm" style={{ backgroundColor: "rgba(124,155,255,0.12)", color: "var(--accent)" }}>
            На реальной картинке
          </button>
        </div>
        <ConvPlayground />
      </Panel>
    );
  }

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap gap-2">
        <button type="button" className="rounded-md px-3 py-1.5 text-sm" style={{ backgroundColor: "rgba(124,155,255,0.12)", color: "var(--accent)" }}>
          На числах
        </button>
        <button type="button" onClick={() => setTab("image")} className="rounded-md px-3 py-1.5 text-sm" style={{ backgroundColor: "var(--bg-sunken)", color: "var(--text-secondary)" }}>
          На реальной картинке
        </button>
        <select
          value={Object.entries(presets).find(([, value]) => value.join(",") === kernel.join(","))?.[0] ?? "Custom"}
          onChange={(event) => {
            const next = presets[event.target.value];
            if (next) setKernel(next);
          }}
          className="rounded-md border px-3 py-1.5 text-sm"
          style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border-subtle)" }}
        >
          {Object.keys(presets).map((name) => <option key={name}>{name}</option>)}
        </select>
      </div>
      <div className="grid gap-6 xl:grid-cols-[auto_auto_auto]">
        <MatrixEditor grid={grid} active={{ x: px, y: py, size: 3 }} onChange={setGrid} title="Входная картинка 8x8" />
        <KernelEditor kernel={kernel} onChange={setKernel} />
        <OutputGrid values={outputs} revealed={pos} active={pos} />
      </div>
      <div className="mt-5 rounded-md border p-3 font-mono text-sm" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-sunken)" }}>
        {expression} = <span style={{ color: "var(--positive)" }}>{formatNumber(outputs[pos])}</span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setPlaying((value) => !value)} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm" style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
          автопрогон
        </button>
        <button type="button" onClick={() => setPos((value) => (value + 35) % 36)} className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)" }}>
          шаг назад
        </button>
        <button type="button" onClick={() => setPos((value) => (value + 1) % 36)} className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)" }}>
          шаг вперед
        </button>
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Позиция ({py}, {px})</span>
      </div>
    </Panel>
  );
}

function DimensionCalculator() {
  const [w, setW] = useState(32);
  const [k, setK] = useState(3);
  const [s, setS] = useState(1);
  const [p, setP] = useState(1);
  const out = Math.floor((w - k + 2 * p) / s) + 1;
  const presets = [
    { label: "same padding", values: [32, 3, 1, 1] },
    { label: "valid padding", values: [32, 3, 1, 0] },
    { label: "halving stride", values: [32, 3, 2, 1] },
  ];

  return (
    <Panel>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid gap-3">
          <RangeControl label="Входная сторона W" value={w} min={8} max={224} onChange={setW} />
          <RangeControl label="Размер ядра K" value={k} min={1} max={11} step={2} onChange={setK} />
          <RangeControl label="Stride S" value={s} min={1} max={4} onChange={setS} />
          <RangeControl label="Padding P" value={p} min={0} max={8} onChange={setP} />
          <div className="mt-2 flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setW(preset.values[0]);
                  setK(preset.values[1]);
                  setS(preset.values[2]);
                  setP(preset.values[3]);
                }}
                className="rounded-md border px-3 py-1.5 text-sm"
                style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="rounded-md border p-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-sunken)" }}>
            <p className="font-mono text-lg" style={{ color: "var(--text-primary)" }}>
              floor(({w} - {k} + 2*{p}) / {s}) + 1 = {out}
            </p>
            <Bar label={`Вход: ${w}`} value={w} max={Math.max(w, out)} color="var(--accent)" />
            <Bar label={`Выход: ${out}`} value={out} max={Math.max(w, out)} color="var(--positive)" />
            <p className="mt-4 text-sm" style={{ color: "var(--text-secondary)" }}>
              {out === w ? "Размер совпадает: это режим same padding для выбранных параметров." : "Измените padding или stride, чтобы увидеть, как меняется число позиций окна."}
            </p>
          </div>
        </div>
      </div>
    </Panel>
  );
}

function PoolingPanel() {
  return (
    <div className="grid gap-4">
      <Panel>
        <PoolVisualizer />
      </Panel>
      <Panel>
        <h3 className="mb-3 text-sm font-semibold">Max и Avg на одном окне</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <PoolMini mode="max" />
          <PoolMini mode="avg" />
        </div>
      </Panel>
    </div>
  );
}

const referenceLayers = [
  { type: "Conv2d", summary: "Conv2d(3, 32, 3, padding=1)", shape: [1, 32, 32, 32], params: 896 },
  { type: "ReLU", summary: "ReLU()", shape: [1, 32, 32, 32], params: 0 },
  { type: "MaxPool2d", summary: "MaxPool2d(2)", shape: [1, 32, 16, 16], params: 0 },
  { type: "Conv2d", summary: "Conv2d(32, 64, 3, padding=1)", shape: [1, 64, 16, 16], params: 18496 },
  { type: "ReLU", summary: "ReLU()", shape: [1, 64, 16, 16], params: 0 },
  { type: "MaxPool2d", summary: "MaxPool2d(2)", shape: [1, 64, 8, 8], params: 0 },
  { type: "Conv2d", summary: "Conv2d(64, 128, 3, padding=1)", shape: [1, 128, 8, 8], params: 73856 },
  { type: "ReLU", summary: "ReLU()", shape: [1, 128, 8, 8], params: 0 },
  { type: "MaxPool2d", summary: "MaxPool2d(2)", shape: [1, 128, 4, 4], params: 0 },
  { type: "Flatten", summary: "Flatten()", shape: [1, 2048], params: 0 },
  { type: "Linear", summary: "Linear(2048, 256)", shape: [1, 256], params: 524544 },
  { type: "ReLU", summary: "ReLU()", shape: [1, 256], params: 0 },
  { type: "Dropout", summary: "Dropout(0.3)", shape: [1, 256], params: 0 },
  { type: "Linear", summary: "Linear(256, 10)", shape: [1, 10], params: 2570 },
];

function CnnBuilder() {
  const [count, setCount] = useState(0);
  const complete = count === referenceLayers.length;
  const totalParams = referenceLayers.slice(0, count).reduce((sum, layer) => sum + layer.params, 0);
  const code = complete
    ? stepMetas[4].code ?? ""
    : `self.features = nn.Sequential(\n    ${referenceLayers.slice(0, Math.min(count, 9)).map((layer) => `nn.${layer.summary}`).join(",\n    ")}\n)`;

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap gap-2">
        {["Conv2d", "MaxPool2d", "Flatten", "Linear"].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setCount((value) => Math.min(referenceLayers.length, value + 1))}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-sunken)" }}
          >
            Добавить {type}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCount((value) => Math.min(referenceLayers.length, value + 1))}
          className="rounded-md px-3 py-2 text-sm font-medium"
          style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
        >
          Подсказать следующий слой
        </button>
        <button type="button" onClick={() => setCount(0)} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <RotateCcw size={15} /> Reset
        </button>
      </div>
      <div className="mb-4 rounded-md border p-3" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-sunken)" }}>
        <div className="flex flex-wrap items-center gap-2">
          <LayerBlock label="Input" shape={[1, 3, 32, 32]} params={0} />
          {referenceLayers.slice(0, count).map((layer, index) => (
            <LayerBlock key={`${layer.summary}-${index}`} label={layer.summary} shape={layer.shape} params={layer.params} />
          ))}
        </div>
      </div>
      <div className="mb-4 flex gap-4 text-sm" style={{ color: "var(--text-secondary)" }}>
        <span>Слоев добавлено: {count}/{referenceLayers.length}</span>
        <span>Параметров: <span className="font-mono">{totalParams.toLocaleString("ru-RU")}</span></span>
      </div>
      {complete && (
        <div className="mb-4 rounded-md border px-4 py-3 text-sm" style={{ borderColor: "rgba(74,222,128,0.45)", color: "var(--positive)" }}>
          Это та же самая архитектура, что и в задании.
        </div>
      )}
      <CodeBlock code={code} language="python" />
    </Panel>
  );
}

function ForwardPassWalker() {
  const [imageName, setImageName] = useState("cat");
  const [layer, setLayer] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [layers, setLayers] = useState<ForwardLayer[]>([]);
  const [activation, setActivation] = useState<Float32Array | null>(null);
  const fallbackLayers: ForwardLayer[] = referenceLayers.slice(0, 11).map((item, index) => ({
    name: item.type,
    shape: item.shape.length === 4 ? item.shape.slice(1) : item.shape,
    file: `layer_${String(index).padStart(2, "0")}.bin`,
    dtype: "float32",
    params: item.params,
  }));
  const visibleLayers = layers.length > 0 ? layers : fallbackLayers;
  const current = visibleLayers[Math.min(layer, visibleLayers.length - 1)];
  const channelCount = current.shape.length === 3 ? current.shape[0] : 1;
  const mapSize = current.shape.length === 3 ? current.shape[1] : Math.ceil(Math.sqrt(current.shape[0] ?? 1));
  const maps = Math.min(channelCount, 16);

  useEffect(() => {
    fetch(`/data/forward-pass/${imageName}/manifest.json`)
      .then((res) => res.json() as Promise<{ layers: ForwardLayer[] }>)
      .then((manifest) => {
        setLayers(manifest.layers);
        setLayer(1);
      })
      .catch(() => {
        setLayers([]);
        setLayer(1);
      });
  }, [imageName]);

  useEffect(() => {
    fetch(`/data/forward-pass/${imageName}/${current.file}`)
      .then((res) => res.arrayBuffer())
      .then((buffer) => setActivation(new Float32Array(buffer)))
      .catch(() => setActivation(null));
  }, [current.file, imageName]);

  return (
    <Panel>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {["cat", "dog", "automobile", "ship", "frog"].map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setImageName(name);
              setLayer(1);
            }}
            className="inline-flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
            style={{
              borderColor: imageName === name ? "rgba(124,155,255,0.45)" : "var(--border-subtle)",
              backgroundColor: imageName === name ? "rgba(124,155,255,0.12)" : "var(--bg-sunken)",
            }}
          >
            <img
              src={`/data/forward-pass/${name}/input.png`}
              alt=""
              className="h-8 w-8 rounded-sm object-cover"
              loading="eager"
              style={{ imageRendering: "pixelated" }}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = forwardPresetImages[name];
                event.currentTarget.style.imageRendering = "auto";
              }}
            />
            {name}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
          <input type="checkbox" checked={showFilters} onChange={(event) => setShowFilters(event.target.checked)} />
          Показать фильтры
        </label>
      </div>
      <div className="grid gap-5 lg:grid-cols-[18rem_1fr]">
        <div>
          <CifarThumbnail name={imageName} />
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => setLayer((value) => (value + visibleLayers.length - 1) % visibleLayers.length)} className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)" }}>
              шаг назад
            </button>
            <button type="button" onClick={() => setLayer((value) => (value + 1) % visibleLayers.length)} className="rounded-md px-3 py-2 text-sm" style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}>
              шаг вперед
            </button>
          </div>
          <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
            Сейчас: слой {layer + 1} из {visibleLayers.length} · {current.name}
          </p>
        </div>
        <div className="grid gap-3">
          {visibleLayers.map((item, index) => (
            <button
              key={`${item.name}-${index}`}
              type="button"
              onClick={() => setLayer(index)}
              className="grid grid-cols-[1fr_auto] items-center rounded-md border-l-2 px-3 py-2 text-left text-sm"
              style={{
                borderLeftColor: index === layer ? "var(--accent)" : "transparent",
                backgroundColor: index === layer ? "rgba(124,155,255,0.1)" : "var(--bg-sunken)",
                color: index === layer ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <span>{item.name}</span>
              <ShapeTag shape={item.shape} />
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h3 className="text-sm font-semibold">Активации после {current.name}</h3>
          <ShapeTag shape={current.shape} />
          <span className="text-sm" style={{ color: "var(--text-secondary)" }}>Params слоя: {(current.params ?? 0).toLocaleString("ru-RU")}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {Array.from({ length: maps }, (_, index) => (
            <FeatureCanvas
              key={`${imageName}-${layer}-${index}-${showFilters}`}
              seed={imageName.length * 97 + layer * 31 + index * 7 + (showFilters ? 500 : 0)}
              size={mapSize}
              data={activation && current.shape.length === 3
                ? activation.subarray(index * mapSize * mapSize, (index + 1) * mapSize * mapSize)
                : activation ?? undefined}
            />
          ))}
        </div>
        <p className="mt-4 rounded-md border p-3 text-sm" style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
          Наблюдение: {current.name.includes("Pool") ? "pool уменьшает сетку и оставляет самые сильные ответы." : "разные каналы реагируют на разные локальные структуры изображения."}
        </p>
      </div>
    </Panel>
  );
}

function TransferLearningPanel() {
  const [preset, setPreset] = useState("cat");
  const [normalize, setNormalize] = useState(true);
  const [showCam, setShowCam] = useState(false);
  const predictions = normalize ? transferPredictions[preset] : brokenPredictions;

  return (
    <Panel>
      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <div>
          <img
            src={`/data/transfer-presets/${preset}.png`}
            alt={preset}
            className="rounded-md border"
            style={{ width: 320, height: 320, objectFit: "cover", borderColor: "var(--border-subtle)" }}
          />
          {showCam && (
            <div className="pointer-events-none -mt-80 h-80 w-80 rounded-md" style={{
              background: "radial-gradient(circle at 55% 48%, rgba(253,231,37,0.42), rgba(33,145,140,0.28) 32%, transparent 58%)",
            }} />
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {["cat", "dog", "car", "pizza", "cifar-resize"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setPreset(name);
                  setShowCam(false);
                }}
                className="rounded-md border px-2 py-1 text-xs"
                style={{
                  borderColor: preset === name ? "rgba(124,155,255,0.45)" : "var(--border-subtle)",
                  backgroundColor: preset === name ? "rgba(124,155,255,0.12)" : "var(--bg-sunken)",
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-4 grid gap-2">
            {[
              ["Resize 256", "ResNet ожидает примерно квадратный вход."],
              ["CenterCrop 224", "Это точный размер ImageNet-препроцессинга."],
              ["ToTensor", "PyTorch работает с тензором в [0, 1]."],
              ["Normalize(ImageNet mean/std)", "Критично для BatchNorm и распределения входов."],
            ].map(([label, text], index) => (
              <div key={label} className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-sunken)" }}>
                <span className="font-mono" style={{ color: "var(--accent)" }}>{index + 1}. {label}</span>
                <span style={{ color: "var(--text-secondary)" }}> — {text}</span>
              </div>
            ))}
          </div>
          <label className="mb-4 flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <input type="checkbox" checked={!normalize} onChange={(event) => setNormalize(!event.target.checked)} />
            Отключить Normalize
          </label>
          <div className="grid gap-2">
            {predictions.map((prediction, index) => (
              <div key={prediction.label} className="grid grid-cols-[1fr_4rem] items-center gap-3">
                <div className="h-7 overflow-hidden rounded-sm" style={{ backgroundColor: "var(--bg-sunken)" }}>
                  <div
                    className="flex h-full items-center px-2 text-xs"
                    style={{
                      width: `${prediction.p * 100}%`,
                      minWidth: "2rem",
                      backgroundColor: index === 0 ? "var(--accent)" : "var(--border-strong)",
                      color: index === 0 ? "var(--accent-fg)" : "var(--text-secondary)",
                    }}
                  >
                    {prediction.label}
                  </div>
                </div>
                <span className="font-mono text-sm">{(prediction.p * 100).toFixed(1)}%</span>
              </div>
            ))}
          </div>
          {!normalize && (
            <p className="mt-4 text-sm" style={{ color: "var(--warning)" }}>
              Без Normalize сеть видит входы со статистикой, к которой она не готовилась; поэтому top-5 распадается.
            </p>
          )}
          <button type="button" onClick={() => setShowCam((value) => !value)} className="mt-4 rounded-md px-3 py-2 text-sm" style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}>
            CAM overlay
          </button>
        </div>
      </div>
    </Panel>
  );
}

function TransferModesDiagram() {
  const [mode, setMode] = useState<"feature" | "fine">("feature");
  const [summaryRows, setSummaryRows] = useState<SummaryRow[]>([]);
  const rows = [
    ["conv1 + bn1 + relu", false, false],
    ["maxpool", false, false],
    ["layer1 (64)", false, false],
    ["layer2 (128)", false, false],
    ["layer3 (256)", false, false],
    ["layer4 (512)", false, true],
    ["avgpool", false, false],
    ["fc 512 -> 10", true, true],
  ] as const;
  useEffect(() => {
    fetch("/data/training-runs/summary.json")
      .then((res) => res.json() as Promise<SummaryRow[]>)
      .then(setSummaryRows)
      .catch(() => setSummaryRows(defaultSummary()));
  }, []);
  const selectedRunId: RunName = mode === "feature" ? "feature_extractor" : "fine_tune";
  const selectedSummary = summaryRows.find((row) => row.id === selectedRunId)
    ?? defaultSummary().find((row) => row.id === selectedRunId);
  const summary = mode === "feature"
    ? { params: formatParams(selectedSummary?.trainable_params), memory: "Низкая", time: formatTime(selectedSummary?.time_min), acc: formatPercent(selectedSummary?.test_acc) }
    : { params: formatParams(selectedSummary?.trainable_params), memory: "Высокая", time: formatTime(selectedSummary?.time_min), acc: formatPercent(selectedSummary?.test_acc) };

  return (
    <Panel>
      <div className="mb-4 flex gap-1 rounded-md p-1" style={{ backgroundColor: "var(--bg-sunken)" }}>
        <button type="button" onClick={() => setMode("feature")} className="rounded-sm px-3 py-1.5 text-sm" style={{ backgroundColor: mode === "feature" ? "var(--bg-raised)" : "transparent" }}>
          feature extractor
        </button>
        <button type="button" onClick={() => setMode("fine")} className="rounded-sm px-3 py-1.5 text-sm" style={{ backgroundColor: mode === "fine" ? "var(--bg-raised)" : "transparent" }}>
          fine-tuning
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-md border p-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-sunken)" }}>
          <h3 className="mb-3 text-sm font-semibold">ResNet-18</h3>
          <div className="grid gap-2">
            {rows.map(([label, featureTrain, fineTrain]) => {
              const train = mode === "feature" ? featureTrain : fineTrain;
              return (
                <div key={label} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm" style={{
                  borderColor: train ? "rgba(124,155,255,0.45)" : "var(--border-subtle)",
                  color: train ? "var(--accent)" : "var(--text-secondary)",
                }}>
                  <span>{label}</span>
                  <span>{train ? "обучается" : "заморожен"}{mode === "fine" && label.includes("layer4") ? ", lr=1e-4" : ""}{label.startsWith("fc") ? ", lr=1e-3" : ""}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <tbody>
              {Object.entries({
                "Обучаемых params": summary.params,
                "Память обучения": summary.memory,
                "Время обучения": summary.time,
                "Test accuracy": summary.acc,
              }).map(([key, value]) => (
                <tr key={key} className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                  <td className="py-3 pr-4" style={{ color: "var(--text-secondary)" }}>{key}</td>
                  <td className="py-3 font-mono">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Panel>
  );
}

function ColabPanel() {
  return (
    <Panel>
      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div>
          <h3 className="text-xl font-semibold">Ноутбук cnn-lab.ipynb</h3>
          <ol className="mt-4 grid gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            <li>1. Загружает CIFAR-10.</li>
            <li>2. Обучает scratch CNN: 20 эпох.</li>
            <li>3. Обучает ResNet-18 feature extractor: 10 эпох.</li>
            <li>4. Обучает ResNet-18 fine-tune: 10 эпох.</li>
            <li>5. Сохраняет results.json.</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="https://colab.research.google.com/github/megusto0/CNN/blob/main/colab/cnn-lab.ipynb"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
            >
              <ExternalLink size={16} /> Открыть в Colab
            </a>
            <a
              href="/colab/cnn-lab.ipynb"
              download
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm"
              style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
            >
              <Download size={16} /> Скачать ноутбук
            </a>
          </div>
        </div>
        <div className="rounded-md border p-4" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-sunken)" }}>
          <h4 className="mb-2 text-sm font-semibold">Настройки Colab</h4>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Runtime → Change runtime type → GPU. Первый запуск скачает CIFAR-10 примерно 170 МБ. После последней ячейки скачайте results.json и перетащите его на шаг 10.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function AnalysisPanels() {
  const [runs, setRuns] = useState<TrainingRun[]>([]);
  const [epoch, setEpoch] = useState(10);
  const [active, setActive] = useState<RunName>("scratch");
  const [overlayName, setOverlayName] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/data/training-runs/scratch.json").then((res) => res.json() as Promise<TrainingRun>),
      fetch("/data/training-runs/feature-extractor.json").then((res) => res.json() as Promise<TrainingRun>),
      fetch("/data/training-runs/fine-tune.json").then((res) => res.json() as Promise<TrainingRun>),
    ]).then(setRuns).catch(() => setRuns(fallbackRuns()));
  }, []);

  const activeRun = runs.find((run) => run.name === active) ?? runs[0];
  const maxEpoch = Math.max(...runs.map((run) => run.epochs), 20);

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;
    file.text().then((text) => {
      const imported = normalizeImportedResults(JSON.parse(text));
      if (!imported) {
        setOverlayName("schema error: expected scratch, feature_extractor, fine_tune");
        return;
      }
      setRuns(imported);
      setActive("scratch");
      setEpoch(Math.max(...imported.map((run) => run.epochs), 1));
      setOverlayName(`${file.name} loaded`);
    }).catch(() => setOverlayName("schema error"));
  }

  return (
    <div className="grid gap-4">
      <div
        className="rounded-md border-2 border-dashed p-5 text-center text-sm"
        style={{ borderColor: "var(--border-strong)", color: "var(--text-secondary)" }}
        onDragOver={(event) => event.preventDefault()}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto mb-2" size={20} />
        Перетащите results.json из вашего Colab-запуска
        {overlayName && <p className="mt-2" style={{ color: overlayName.includes("error") ? "var(--warning)" : "var(--positive)" }}>{overlayName}</p>}
      </div>
      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <StatusTag kind="replay" />
          {runs.map((run) => (
            <button
              key={run.name}
              type="button"
              onClick={() => setActive(run.name)}
              className="rounded-md border px-3 py-1.5 text-sm"
              style={{
                borderColor: active === run.name ? "rgba(124,155,255,0.45)" : "var(--border-subtle)",
                backgroundColor: active === run.name ? "rgba(124,155,255,0.12)" : "var(--bg-sunken)",
              }}
            >
              {run.display_name}
            </button>
          ))}
        </div>
        <TrainingChart runs={runs} epoch={epoch} metric="val_acc" />
        <div className="mt-4 flex items-center gap-3">
          <input type="range" min={1} max={maxEpoch} value={epoch} onChange={(event) => setEpoch(Number(event.target.value))} className="w-full" />
          <span className="w-24 font-mono text-sm">epoch {epoch}</span>
          <button type="button" onClick={() => setEpoch(maxEpoch)} className="rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)" }}>
            <SkipForward size={16} />
          </button>
        </div>
      </Panel>
      {activeRun && (
        <div className="grid gap-4 xl:grid-cols-2">
          <Panel>
            <h3 className="mb-3 text-sm font-semibold">Confusion matrix: {activeRun.display_name}</h3>
            <ConfusionMatrix run={activeRun} />
          </Panel>
          <Panel>
            <h3 className="mb-3 text-sm font-semibold">Per-class accuracy</h3>
            <PerClassBars run={activeRun} />
          </Panel>
          <Panel className="xl:col-span-2">
            <h3 className="mb-3 text-sm font-semibold">Ошибки модели {activeRun.display_name}</h3>
            <MisclassGallery run={activeRun} />
          </Panel>
        </div>
      )}
    </div>
  );
}

function ReportBuilder() {
  const { progress } = useProgress();
  const [repo, setRepo] = useState("");
  const [answers, setAnswers] = useState(["", "", "", "", "", ""]);
  const validRepo = /^https:\/\/(github|gitlab)\.com\/[^/]+\/[^/]+\/?$/.test(repo);
  const report = useMemo(() => buildReport(repo, answers, progress.answers), [answers, progress.answers, repo]);

  function download() {
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "report.md";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-4">
      <Panel>
        <h3 className="mb-3 text-sm font-semibold">Completion summary</h3>
        <div className="grid gap-2">
          {stepMetas.map((step) => (
            <div key={step.id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)" }}>
              <span>Шаг {step.id}: {step.title}</span>
              <span style={{ color: progress.stepsCompleted.includes(step.id) ? "var(--positive)" : "var(--text-tertiary)" }}>
                {progress.stepsCompleted.includes(step.id) ? "ответы есть" : "не завершено"}
              </span>
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <h3 className="mb-3 text-sm font-semibold">Финальные вопросы</h3>
        {[
          "Какие две ошибки модели из Шага 10 показались вам самыми интересными и почему?",
          "Что вы попробовали бы улучшить в scratch CNN, если бы у вас было еще 2 часа?",
          "Какая часть лабораторной была самой неинтуитивной?",
          "Как вы объясните разницу между feature extractor и fine-tune?",
          "Какие метрики вашего запуска отличаются от эталона?",
          "Что именно в работе не получилось?",
        ].map((question, index) => (
          <label key={question} className="mb-3 block text-sm" style={{ color: "var(--text-secondary)" }}>
            {question}
            <textarea
              value={answers[index]}
              onChange={(event) => setAnswers((current) => current.map((answer, i) => (i === index ? event.target.value : answer)))}
              rows={3}
              className="mt-1 w-full rounded-md border px-3 py-2"
              style={{ backgroundColor: "var(--bg-sunken)", borderColor: answers[index].trim().length >= 100 ? "rgba(74,222,128,0.45)" : "var(--border-subtle)" }}
            />
          </label>
        ))}
        <label className="block text-sm" style={{ color: "var(--text-secondary)" }}>
          Repository link
          <input
            value={repo}
            onChange={(event) => setRepo(event.target.value)}
            className="mt-1 w-full rounded-md border px-3 py-2"
            style={{ backgroundColor: "var(--bg-sunken)", borderColor: validRepo || !repo ? "var(--border-subtle)" : "rgba(251,191,36,0.45)" }}
            placeholder="https://github.com/user/repo"
          />
        </label>
      </Panel>
      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Markdown preview</h3>
          <button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm" style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}>
            <FileJson size={16} /> Сформировать отчет
          </button>
        </div>
        <pre className="max-h-96 overflow-auto rounded-md border p-3 text-xs" style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border-subtle)" }}>
          {report}
        </pre>
      </Panel>
    </div>
  );
}

function MatrixEditor({
  grid,
  active,
  onChange,
  title,
}: {
  grid: number[][];
  active: { x: number; y: number; size: number };
  onChange: (grid: number[][]) => void;
  title: string;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>{title}</p>
      <div className="grid grid-cols-8 gap-px">
        {grid.map((row, y) => row.map((cell, x) => {
          const inWindow = x >= active.x && x < active.x + active.size && y >= active.y && y < active.y + active.size;
          return (
            <input
              key={`${x}-${y}`}
              value={cell}
              type="number"
              onChange={(event) => {
                const next = grid.map((line) => [...line]);
                next[y][x] = Number(event.target.value);
                onChange(next);
              }}
              className="h-9 w-9 rounded-sm border text-center font-mono text-sm"
              style={{
                borderColor: inWindow ? "var(--accent)" : "var(--border-subtle)",
                backgroundColor: inWindow ? "rgba(124,155,255,0.12)" : "var(--bg-sunken)",
              }}
            />
          );
        }))}
      </div>
    </div>
  );
}

function KernelEditor({ kernel, onChange }: { kernel: number[]; onChange: (kernel: number[]) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Ядро 3x3</p>
      <div className="grid grid-cols-3 gap-px">
        {kernel.map((cell, index) => (
          <input
            key={index}
            value={formatNumber(cell)}
            type="number"
            step={0.1}
            onChange={(event) => {
              const next = [...kernel];
              next[index] = Number(event.target.value);
              onChange(next);
            }}
            className="h-11 w-14 rounded-sm border text-center font-mono text-sm"
            style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-sunken)" }}
          />
        ))}
      </div>
    </div>
  );
}

function OutputGrid({ values, revealed, active }: { values: number[]; revealed: number; active: number }) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>Карта признаков 6x6</p>
      <div className="grid grid-cols-6 gap-px">
        {values.map((value, index) => (
          <div
            key={index}
            className="flex h-9 w-11 items-center justify-center rounded-sm border font-mono text-xs"
            style={{
              borderColor: index === active ? "var(--positive)" : "var(--border-subtle)",
              backgroundColor: index <= revealed ? "rgba(74,222,128,0.12)" : "var(--bg-sunken)",
              color: index <= revealed ? "var(--positive)" : "var(--text-tertiary)",
            }}
          >
            {index <= revealed ? formatNumber(value) : ""}
          </div>
        ))}
      </div>
    </div>
  );
}

function RangeControl({ label, value, min, max, step = 1, onChange }: { label: string; value: number; min: number; max: number; step?: number; onChange: (value: number) => void }) {
  return (
    <label className="grid grid-cols-[12rem_5rem_1fr] items-center gap-3 text-sm" style={{ color: "var(--text-secondary)" }}>
      <span>{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-md border px-2 py-1.5 font-mono"
        style={{ backgroundColor: "var(--bg-sunken)", borderColor: "var(--border-subtle)" }}
      />
      <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function Bar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="mt-4">
      <p className="mb-1 text-xs" style={{ color: "var(--text-secondary)" }}>{label}</p>
      <div className="h-4 rounded-sm" style={{ backgroundColor: "var(--bg-base)" }}>
        <div className="h-full rounded-sm" style={{ width: `${Math.max(4, (value / max) * 100)}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function PoolMini({ mode }: { mode: "max" | "avg" }) {
  const values = [1, 7, 3, 5];
  const result = mode === "max" ? Math.max(...values) : values.reduce((a, b) => a + b, 0) / values.length;
  return (
    <div className="rounded-md border p-3" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-sunken)" }}>
      <p className="mb-2 text-sm font-medium">{mode === "max" ? "MaxPool" : "AvgPool"}</p>
      <div className="flex items-center gap-4">
        <div className="grid grid-cols-2 gap-px">
          {values.map((value) => <div key={`${mode}-${value}`} className="grid h-10 w-10 place-items-center rounded-sm border font-mono" style={{ borderColor: "var(--border-subtle)" }}>{value}</div>)}
        </div>
        <span style={{ color: "var(--text-tertiary)" }}>→</span>
        <div className="grid h-12 w-12 place-items-center rounded-sm border font-mono" style={{ borderColor: "rgba(124,155,255,0.45)", color: "var(--accent)" }}>{formatNumber(result)}</div>
      </div>
    </div>
  );
}

function LayerBlock({ label, shape, params }: { label: string; shape: number[]; params: number }) {
  return (
    <div className="rounded-md border px-3 py-2" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-raised)" }}>
      <p className="max-w-48 truncate font-mono text-xs">{label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-2">
        <ShapeTag shape={shape} />
        <span className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{params}</span>
      </div>
    </div>
  );
}

function CifarThumbnail({ name }: { name: string }) {
  return (
    <div
      className="overflow-hidden rounded-md border"
      style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-sunken)" }}
    >
      <img
        src={`/data/forward-pass/${name}/input.png`}
        alt={classRu[name] ?? name}
        className="h-64 w-64 object-cover"
        loading="eager"
        style={{ imageRendering: "pixelated" }}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = forwardPresetImages[name];
          event.currentTarget.style.imageRendering = "auto";
        }}
      />
      <div className="border-t px-3 py-2 text-sm" style={{ borderColor: "var(--border-subtle)" }}>
        <span style={{ color: "var(--text-secondary)" }}>Исходное изображение: </span>
        <span className="font-medium">{classRu[name] ?? name}</span>
      </div>
    </div>
  );
}

function FeatureCanvas({ seed, size, data }: { seed: number; size: number; data?: Float32Array }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dimension = Math.max(4, Math.min(32, size));
    canvas.width = dimension;
    canvas.height = dimension;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const image = ctx.createImageData(dimension, dimension);
    let min = Infinity;
    let max = -Infinity;
    if (data && data.length > 0) {
      for (let i = 0; i < Math.min(data.length, dimension * dimension); i++) {
        min = Math.min(min, data[i]);
        max = Math.max(max, data[i]);
      }
    }
    const range = max > min ? max - min : 1;
    for (let y = 0; y < dimension; y++) {
      for (let x = 0; x < dimension; x++) {
        const raw = data?.[y * dimension + x];
        const fallback = (Math.sin((x + seed) * 0.47) + Math.cos((y - seed) * 0.31) + Math.sin((x + y + seed) * 0.18)) / 3;
        const value = data ? raw ?? min : fallback;
        const t = data
          ? Math.max(0, Math.min(1, (value - min) / range))
          : Math.max(0, Math.min(1, (value + 1) / 2));
        const [r, g, b] = viridis(t);
        const index = (y * dimension + x) * 4;
        image.data[index] = r;
        image.data[index + 1] = g;
        image.data[index + 2] = b;
        image.data[index + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
  }, [data, seed, size]);
  return <canvas ref={ref} className="aspect-square w-full rounded-sm border" style={{ imageRendering: "pixelated", borderColor: "var(--border-subtle)" }} />;
}

function TrainingChart({ runs, epoch, metric }: { runs: TrainingRun[]; epoch: number; metric: "val_acc" }) {
  const width = 720;
  const height = 260;
  const pad = 34;
  const colors: Record<RunName, string> = {
    scratch: "#7C9BFF",
    feature_extractor: "#4ADE80",
    fine_tune: "#FBBF24",
  };
  const pathFor = (run: TrainingRun) => {
    const values = run[metric];
    return values.map((value, index) => {
      const x = pad + (index / (values.length - 1)) * (width - pad * 2);
      const y = height - pad - value * (height - pad * 2);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  };
  const cursorX = pad + ((epoch - 1) / (Math.max(...runs.map((run) => run.epochs), 20) - 1)) * (width - pad * 2);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-md border" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-sunken)" }}>
      {[0.5, 0.7, 0.9].map((tick) => (
        <g key={tick}>
          <line x1={pad} x2={width - pad} y1={height - pad - tick * (height - pad * 2)} y2={height - pad - tick * (height - pad * 2)} stroke="var(--border-subtle)" />
          <text x={8} y={height - pad - tick * (height - pad * 2) + 4} fill="var(--text-tertiary)" fontSize="12">{tick.toFixed(1)}</text>
        </g>
      ))}
      {runs.map((run) => <path key={run.name} d={pathFor(run)} fill="none" stroke={colors[run.name]} strokeWidth="2.5" />)}
      <line x1={cursorX} x2={cursorX} y1={pad} y2={height - pad} stroke="var(--text-secondary)" strokeDasharray="4 4" />
      <text x={pad} y={22} fill="var(--text-secondary)" fontSize="13">validation accuracy</text>
    </svg>
  );
}

function ConfusionMatrix({ run }: { run: TrainingRun }) {
  const max = Math.max(...run.confusion.flat());
  return (
    <div className="grid grid-cols-[5rem_repeat(10,minmax(1.8rem,1fr))] gap-px text-[10px]">
      <span />
      {classes.map((name) => <span key={name} className="truncate text-center" style={{ color: "var(--text-tertiary)" }}>{name.slice(0, 3)}</span>)}
      {run.confusion.map((row, y) => [
        <span key={`label-${classes[y]}`} className="truncate pr-2 text-right" style={{ color: "var(--text-tertiary)" }}>{classes[y]}</span>,
        ...row.map((value, x) => (
          <div
            key={`${classes[y]}-${classes[x]}`}
            title={`true=${classes[y]}, predicted=${classes[x]}: ${value}`}
            className="grid aspect-square place-items-center rounded-sm font-mono"
            style={{
              backgroundColor: `rgba(124,155,255,${0.08 + (value / max) * 0.55})`,
              outline: x === y ? "1px solid rgba(74,222,128,0.6)" : "none",
            }}
          >
            {value}
          </div>
        )),
      ])}
    </div>
  );
}

function PerClassBars({ run }: { run: TrainingRun }) {
  const entries = Object.entries(run.per_class_acc).sort((a, b) => a[1] - b[1]);
  return (
    <div className="grid gap-2">
      {entries.map(([name, value]) => (
        <div key={name} className="grid grid-cols-[7rem_1fr_4rem] items-center gap-3 text-sm">
          <span style={{ color: "var(--text-secondary)" }}>{classRu[name]}</span>
          <div className="h-5 rounded-sm" style={{ backgroundColor: "var(--bg-sunken)" }}>
            <div className="h-full rounded-sm" style={{ width: `${value * 100}%`, backgroundColor: "var(--accent)" }} />
          </div>
          <span className="font-mono">{(value * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}

function MisclassGallery({ run }: { run: TrainingRun }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {run.misclassifications.slice(0, 6).map((item, index) => {
        const imagePath = item.image_available !== false && item.image_path
          ? `/data/misclassifications/${run.name}/${item.image_path}`
          : null;
        return (
          <div key={`${item.true}-${item.pred}-${index}`} className="rounded-md border p-3" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-sunken)" }}>
            {imagePath ? (
              <img src={imagePath} alt={`${item.true} predicted ${item.pred}`} className="mb-3 h-24 w-24 rounded-sm object-cover" />
            ) : (
              <div className="mb-3 grid h-24 w-24 place-items-center rounded-sm border px-2 text-center text-xs" style={{ borderColor: "var(--border-subtle)", color: "var(--text-tertiary)" }}>
                image not exported
              </div>
            )}
            <p className="text-sm">истина: {classRu[item.true]}</p>
            <p className="text-sm">предсказано: {classRu[item.pred]}</p>
            <p className="font-mono text-xs" style={{ color: "var(--text-tertiary)" }}>{formatPercent(item.confidence)}</p>
          </div>
        );
      })}
    </div>
  );
}

function buildReport(repo: string, finalAnswers: string[], storedAnswers: Record<string, unknown>) {
  const lines = [
    "# Лабораторная №N — отчёт",
    "",
    `**Автор**: ${repo || "<repo URL>"}`,
    `**Дата генерации**: ${new Date().toISOString()}`,
    "",
    "## 1. Задача",
    "Классификация CIFAR-10 тремя конфигурациями: scratch CNN, ResNet-18 feature extractor, ResNet-18 fine-tune.",
    "",
    "## 2. Архитектура scratch CNN",
    finalAnswers[1] || "<заполните вывод>",
    "",
    "## 3. Результаты обучения",
    "См. results.json из Colab и анализ шага 10.",
    "",
    "## 4. Анализ ошибок",
    finalAnswers[0] || "<заполните анализ>",
    "",
    "## 5. Ответы на контрольные вопросы",
  ];
  for (const step of stepMetas) {
    lines.push(`### Шаг ${step.id}. ${step.title}`);
    step.checks.forEach((question, index) => {
      const value = storedAnswers[answerKey(step.id, index)];
      lines.push(`- ${question.prompt}: ${JSON.stringify(value ?? null)}`);
    });
  }
  lines.push("", "## 6. Что не сработало", finalAnswers[5] || "<честное описание>");
  return lines.join("\n");
}

function formatPercent(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : "n/a";
}

function formatTime(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? `~${value.toFixed(value % 1 === 0 ? 0 : 1)} мин` : "not recorded";
}

function formatParams(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value.toLocaleString("ru-RU") : "n/a";
}

function normalizeImportedResults(parsed: unknown): TrainingRun[] | null {
  if (!isRecord(parsed)) return null;
  const runs = runOrder.map((runName) => {
    const raw = parsed[runName];
    return isRecord(raw) ? normalizeImportedRun(runName, raw) : null;
  });
  return runs.every(Boolean) ? runs as TrainingRun[] : null;
}

function normalizeImportedRun(runName: RunName, raw: Record<string, unknown>): TrainingRun {
  return {
    name: runName,
    display_name: readString(raw, "display_name", runLabels[runName]),
    epochs: readNumber(raw, "epochs"),
    train_loss: readNumberArray(raw.train_loss),
    train_acc: readNumberArray(raw.train_acc),
    val_loss: readNumberArray(raw.val_loss),
    val_acc: readNumberArray(raw.val_acc),
    test_acc: readNumber(raw, "test_acc"),
    confusion: readNumberMatrix(raw.confusion),
    per_class_acc: readNumberRecord(raw.per_class_acc),
    misclassifications: readMisclassifications(raw.misclassifications),
  };
}

function readMisclassifications(value: unknown): TrainingRun["misclassifications"] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item, index) => {
    const imageAvailable = item.image_available === true;
    const imagePath = typeof item.image_path === "string" && imageAvailable
      ? item.image_path
      : null;
    return {
      true: readString(item, "true", classes[index % classes.length]),
      pred: readString(item, "pred", classes[(index + 1) % classes.length]),
      confidence: readNumber(item, "confidence"),
      image_path: imagePath,
      image_available: imageAvailable,
    };
  });
}

function readNumberRecord(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, Number(entry)]));
}

function readNumberMatrix(value: unknown): number[][] {
  if (!Array.isArray(value)) return [];
  return value.map((row) => Array.isArray(row) ? row.map(Number) : []);
}

function readNumberArray(value: unknown): number[] {
  return Array.isArray(value) ? value.map(Number) : [];
}

function readNumber(raw: Record<string, unknown>, key: string) {
  const value = raw[key];
  return typeof value === "number" ? value : Number(value ?? 0);
}

function readString(raw: Record<string, unknown>, key: string, fallback: string) {
  const value = raw[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function defaultSummary(): SummaryRow[] {
  return [
    { id: "scratch", name: "Scratch CNN", trainable_params: 620362, time_min: 10, test_acc: 0.742 },
    { id: "feature_extractor", name: "ResNet-18 feature extractor", trainable_params: 5130, time_min: 4, test_acc: 0.821 },
    { id: "fine_tune", name: "ResNet-18 fine-tune", trainable_params: 8390666, time_min: 10, test_acc: 0.883 },
  ];
}

function fallbackRuns(): TrainingRun[] {
  return defaultSummary().map((row) => makeRun(row.id, row.name, row.id === "scratch" ? 20 : 10, row.test_acc));
}

function makeRun(name: RunName, displayName: string, epochs: number, testAcc: number): TrainingRun {
  const curve = Array.from({ length: epochs }, (_, index) => {
    const t = index / Math.max(1, epochs - 1);
    const ceiling = testAcc - 0.03;
    return 0.2 + (ceiling - 0.2) * (1 - Math.exp(-4 * t)) - (name === "scratch" && index > 11 ? (index - 11) * 0.006 : 0);
  });
  const confusion = classes.map((_, y) => classes.map((__, x) => x === y ? Math.round(testAcc * 100) : Math.round((1 - testAcc) * (x === (y + 1) % 10 ? 12 : 2))));
  return {
    name,
    display_name: displayName,
    epochs,
    train_loss: curve.map((value) => 2.2 - value * 1.7),
    train_acc: curve.map((value, index) => Math.min(0.98, value + index * 0.012)),
    val_loss: curve.map((value) => 2.1 - value * 1.5),
    val_acc: curve,
    test_acc: testAcc,
    confusion,
    per_class_acc: Object.fromEntries(classes.map((className, index) => [className, Math.max(0.55, Math.min(0.96, testAcc + (index - 5) * 0.01))])),
    misclassifications: Array.from({ length: 12 }, (_, index) => ({
      image_path: `miss_${String(index).padStart(3, "0")}.png`,
      true: classes[(index + 3) % classes.length],
      pred: classes[(index + 4) % classes.length],
      confidence: 0.55 + index * 0.03,
    })),
  };
}

function makeFallbackCifar() {
  const data = new Uint8Array(100 * 3 * 32 * 32);
  for (let sample = 0; sample < 100; sample++) {
    const cls = Math.floor(sample / 10);
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const pixel = y * 32 + x;
        data[sample * 3072 + pixel] = (x * 7 + cls * 23) % 256;
        data[sample * 3072 + 1024 + pixel] = (y * 7 + cls * 17) % 256;
        data[sample * 3072 + 2048 + pixel] = ((x + y) * 5 + cls * 11) % 256;
      }
    }
  }
  return data;
}

const transferPredictions: Record<string, { label: string; p: number }[]> = {
  cat: [{ label: "табби, кошка", p: 0.64 }, { label: "тигровая кошка", p: 0.18 }, { label: "египетская кошка", p: 0.09 }],
  dog: [{ label: "ретривер", p: 0.58 }, { label: "лабрадор", p: 0.21 }, { label: "гончая", p: 0.07 }],
  car: [{ label: "sports car", p: 0.61 }, { label: "car wheel", p: 0.13 }, { label: "racer", p: 0.1 }],
  pizza: [{ label: "pizza", p: 0.72 }, { label: "cheeseburger", p: 0.06 }, { label: "plate", p: 0.05 }],
  "cifar-resize": [{ label: "ship", p: 0.42 }, { label: "airliner", p: 0.24 }, { label: "container ship", p: 0.12 }],
};

const brokenPredictions = [
  { label: "нижнее белье", p: 0.04 },
  { label: "клавиатура", p: 0.03 },
  { label: "штора", p: 0.025 },
  { label: "пакет", p: 0.021 },
];

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function viridis(t: number): [number, number, number] {
  const stops: [number, number, number][] = [
    [68, 1, 84],
    [59, 82, 139],
    [33, 145, 140],
    [94, 201, 98],
    [253, 231, 37],
  ];
  const scaled = t * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const mix = scaled - index;
  const a = stops[index];
  const b = stops[index + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * mix),
    Math.round(a[1] + (b[1] - a[1]) * mix),
    Math.round(a[2] + (b[2] - a[2]) * mix),
  ];
}
