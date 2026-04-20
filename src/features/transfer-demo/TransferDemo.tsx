import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { springs } from "../../design/motion";
import { infer, inferNoNorm, computeCAM, isWasmAvailable } from "../../lib/onnx";
import { renderCAMOverlay } from "../../lib/cam";
import type { ImageNetClass } from "../../types";

const PRESET_IMAGES = [
  "cat.png",
  "dog.jpg",
  "bird.jpg",
  "car.jpg",
  "flower.jpg",
  "food.jpg",
];

const PREPROCESS_STEPS = [
  { label: "Resize 256", icon: "↔" },
  { label: "CenterCrop 224", icon: "✂" },
  { label: "ToTensor", icon: "⊞" },
  { label: "Normalize(ImageNet)", icon: "μσ" },
];

interface TopPrediction {
  classId: number;
  probability: number;
}

export default function TransferDemo() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preprocessStep, setPreprocessStep] = useState(-1);
  const [top5, setTop5] = useState<TopPrediction[]>([]);
  const [classNames, setClassNames] = useState<ImageNetClass[]>([]);
  const [showCAM, setShowCAM] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disableNorm, setDisableNorm] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const camCanvasRef = useRef<HTMLCanvasElement>(null);

  const wasmOk = isWasmAvailable();

  const runInference = useCallback(async () => {
    if (!imgRef.current || !imageUrl) return;
    setLoading(true);
    setError(null);
    setShowCAM(false);
    setTop5([]);

    try {
      if (classNames.length === 0) {
        const resp = await fetch("/data/imagenet-classes-ru.json");
        const data = await resp.json();
        setClassNames(data);
      }

      for (let i = 0; i < PREPROCESS_STEPS.length; i++) {
        setPreprocessStep(i);
        await new Promise((r) => setTimeout(r, 100));
      }

      const result = await (disableNorm ? inferNoNorm(imgRef.current) : infer(imgRef.current));
      setPreprocessStep(-1);

      const probs = new Float32Array(1000);
      const exps = new Float32Array(1000);
      let maxLogit = -Infinity;
      for (let i = 0; i < result.logits.length; i++) {
        if (result.logits[i] > maxLogit) maxLogit = result.logits[i];
      }
      let sum = 0;
      for (let i = 0; i < 1000; i++) {
        exps[i] = Math.exp(result.logits[i] - maxLogit);
        sum += exps[i];
      }
      for (let i = 0; i < 1000; i++) {
        probs[i] = exps[i] / sum;
      }

      const indexed = Array.from(probs).map((p, i) => ({ classId: i, probability: p }));
      indexed.sort((a, b) => b.probability - a.probability);
      setTop5(indexed.slice(0, 5));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка инференса");
    } finally {
      setLoading(false);
    }
  }, [imageUrl, classNames, disableNorm]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageUrl(URL.createObjectURL(file));
    }
  }, []);

  const handleCAM = useCallback(async () => {
    if (!imgRef.current || !imageUrl) return;
    try {
      if (top5.length === 0) return;
      const cam = await computeCAM(imgRef.current, top5[0].classId);
      if (camCanvasRef.current) {
        renderCAMOverlay(cam, 224, camCanvasRef.current);
        setShowCAM(true);
      }
    } catch {
      setError("Ошибка CAM");
    }
  }, [imageUrl, top5]);

  if (!wasmOk) {
    return (
      <div
        className="p-6 rounded-md border"
        style={{
          backgroundColor: "var(--bg-raised)",
          borderColor: "var(--border-strong)",
        }}
      >
        <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--warning)" }}>
          WebAssembly недоступна
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Для работы ResNet-50 в браузере необходима поддержка WebAssembly SIMD.
          Используйте Chrome 91+, Edge 91+ или Firefox 89+. Альтернатива:{" "}
          <a
            href="https://colab.research.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--accent)" }}
          >
            Google CoLab
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {!imageUrl && (
        <div
          className="flex items-center justify-center rounded-md border-2 border-dashed p-12"
          style={{ borderColor: "var(--border-strong)", backgroundColor: "var(--bg-raised)" }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
              Перетащите изображение или выберите из пресетов
            </p>
            <div className="flex gap-2 mt-3">
              {PRESET_IMAGES.map((name) => (
                <button
                  key={name}
                  onClick={() => setImageUrl(`/images/conv-presets/${name}`)}
                  className="px-2 py-1 text-xs rounded-sm"
                  style={{
                    backgroundColor: "var(--bg-sunken)",
                    color: "var(--text-tertiary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {name.split(".")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {imageUrl && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="relative">
            <img
              ref={imgRef}
              src={imageUrl}
              crossOrigin="anonymous"
              alt="Input"
              className="rounded-md"
              style={{ width: 320, height: 320, objectFit: "cover", border: "1px solid var(--border-subtle)" }}
            />
            {showCAM && camCanvasRef.current && (
              <canvas
                ref={camCanvasRef}
                className="absolute inset-0 rounded-md"
                style={{ width: 320, height: 320, pointerEvents: "none" }}
              />
            )}
            <canvas ref={camCanvasRef} className="hidden" />
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div className="flex gap-2">
              {PREPROCESS_STEPS.map((step, i) => (
                <div
                  key={step.label}
                  className="flex items-center gap-1 px-2 py-1 rounded-sm text-xs"
                  style={{
                    backgroundColor:
                      preprocessStep >= i ? "var(--feature-map)" : "var(--bg-sunken)",
                    color:
                      preprocessStep >= i ? "var(--accent)" : "var(--text-tertiary)",
                    transition: "all 0.15s ease-out",
                  }}
                >
                  <span>{step.icon}</span>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>

            {loading && (
              <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--bg-sunken)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    backgroundColor: "var(--accent)",
                    animation: "indeterminate 1.5s ease-in-out infinite",
                    width: "30%",
                  }}
                />
              </div>
            )}

            <AnimatePresence>
              {top5.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springs.smooth}
                  className="flex flex-col gap-2"
                >
                  {top5.map((pred, i) => {
                    const cls = classNames[pred.classId];
                    const pct = (pred.probability * 100).toFixed(1);
                    return (
                      <div key={pred.classId} className="flex items-center gap-2">
                        <div
                          className="h-5 rounded-sm"
                          style={{
                            width: `${Math.max(pred.probability * 100, 2)}%`,
                            backgroundColor: i === 0 ? "var(--accent)" : "var(--border-strong)",
                            minWidth: 4,
                            transition: "width 0.4s ease-out",
                          }}
                        />
                        <span className="text-xs font-mono" style={{ color: i === 0 ? "var(--accent)" : "var(--text-secondary)" }}>
                          {pct}%
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-primary)" }}>
                          {cls?.ru ?? `#${pred.classId}`}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          ({cls?.en ?? ""})
                        </span>
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {disableNorm && top5.length > 0 && (
              <p className="text-xs" style={{ color: "var(--warning)", maxWidth: "65ch" }}>
                Без нормализации сеть ломается: статистика входа не совпадает с той, на которой она обучалась.
              </p>
            )}

            {error && (
              <p className="text-xs" style={{ color: "var(--negative)" }}>
                {error}
              </p>
            )}

            <div className="flex gap-2 mt-2">
              <button
                onClick={runInference}
                disabled={loading}
                className="px-4 py-2 rounded-md text-sm font-medium disabled:opacity-40"
                style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
              >
                {loading ? "Обработка..." : "Классифицировать"}
              </button>
              <label className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                <input
                  type="checkbox"
                  checked={disableNorm}
                  onChange={(e) => setDisableNorm(e.target.checked)}
                  className="accent-[var(--accent)]"
                />
                Отключить Normalize
              </label>
              {top5.length > 0 && (
                <button
                  onClick={handleCAM}
                  disabled={loading}
                  className="px-4 py-2 rounded-md text-sm font-medium"
                  style={{
                    backgroundColor: "var(--bg-sunken)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  Показать, куда смотрит сеть
                </button>
              )}
              <button
                onClick={() => {
                  setImageUrl(null);
                  setTop5([]);
                  setShowCAM(false);
                  setError(null);
                }}
                className="px-4 py-2 rounded-md text-sm"
                style={{ color: "var(--text-tertiary)" }}
              >
                Сбросить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
