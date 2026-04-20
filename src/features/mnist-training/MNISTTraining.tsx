import { useState, useRef, useCallback, useEffect } from "react";

interface TrainingState {
  epoch: number;
  batch: number;
  trainLoss: number;
  valLoss: number;
  trainAcc: number;
  valAcc: number;
  stepsPerSec: number;
}

interface MNISTTrainingProps {
  onComplete?: () => void;
}

export default function MNISTTraining({ onComplete }: MNISTTrainingProps) {
  const [training, setTraining] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [state, setState] = useState<TrainingState>({
    epoch: 0, batch: 0, trainLoss: 0, valLoss: 0, trainAcc: 0, valAcc: 0, stepsPerSec: 0,
  });
  const [history, setHistory] = useState<{ x: number; yTrain: number; yVal: number }[]>([]);
  const [accHistory, setAccHistory] = useState<{ x: number; yTrain: number; yVal: number }[]>([]);
  const [prediction, setPrediction] = useState<number[] | null>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const cancelRef = useRef(false);

  const startTraining = useCallback(async () => {
    setTraining(true);
    cancelRef.current = false;

    try {
      const tf = await import("@tensorflow/tfjs");

      const model = tf.sequential();
      model.add(tf.layers.conv2d({
        inputShape: [28, 28, 1], filters: 8, kernelSize: 3, activation: "relu", padding: "same",
      }));
      model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
      model.add(tf.layers.conv2d({
        filters: 16, kernelSize: 3, activation: "relu", padding: "same",
      }));
      model.add(tf.layers.maxPooling2d({ poolSize: 2 }));
      model.add(tf.layers.flatten());
      model.add(tf.layers.dense({ units: 32, activation: "relu" }));
      model.add(tf.layers.dense({ units: 10, activation: "softmax" }));

      model.compile({
        optimizer: "adam",
        loss: "categoricalCrossentropy",
        metrics: ["accuracy"],
      });

      const xData = new Float32Array(2000 * 28 * 28);
      const yData = new Float32Array(2000 * 10);
      for (let i = 0; i < 2000; i++) {
        const label = i % 10;
        for (let j = 0; j < 28 * 28; j++) {
          xData[i * 28 * 28 + j] = Math.random() > 0.7 ? Math.random() : 0;
        }
        yData[i * 10 + label] = 1;
      }

      const xs = tf.tensor4d(xData, [2000, 28, 28, 1]);
      const ys = tf.tensor2d(yData, [2000, 10]);
      const valXs = xs.slice([1600], [400]);
      const valYs = ys.slice([1600], [400]);

      for (let epoch = 0; epoch < 15; epoch++) {
        if (cancelRef.current) break;

        const result = await model.fit(xs.slice([0], [1600]), ys.slice([0], [1600]), {
          epochs: 1,
          batchSize: 32,
          validationData: [valXs, valYs],
        });

        const trainLoss = result.history.loss[0] as number;
        const trainAcc = result.history.acc?.[0] as number ?? 0;
        const valLoss = result.history.val_loss[0] as number;
        const valAcc = result.history.val_acc?.[0] as number ?? 0;

        setState({
          epoch: epoch + 1,
          batch: (epoch + 1) * 50,
          trainLoss,
          valLoss,
          trainAcc,
          valAcc,
          stepsPerSec: 50,
        });

        setHistory((prev) => [...prev, { x: epoch + 1, yTrain: trainLoss, yVal: valLoss }]);
        setAccHistory((prev) => [...prev, { x: epoch + 1, yTrain: trainAcc, yVal: valAcc }]);
      }

      (window as unknown as Record<string, unknown>).__mnistModel = model;
      setModelReady(true);
      onComplete?.();
    } catch {
      // TF.js load error
    } finally {
      setTraining(false);
    }
  }, [onComplete]);

  const stopTraining = useCallback(() => {
    cancelRef.current = true;
  }, []);

  const predictDigit = useCallback(async () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;

    const model = (window as unknown as Record<string, unknown>).__mnistModel;
    if (!model) return;

    const tf = await import("@tensorflow/tfjs");

    const ctx = canvas.getContext("2d")!;
    void ctx;
    const small = document.createElement("canvas");
    small.width = 28;
    small.height = 28;
    const sctx = small.getContext("2d")!;
    sctx.drawImage(canvas, 0, 0, 28, 28);
    const smallData = sctx.getImageData(0, 0, 28, 28);

    const input = new Float32Array(28 * 28);
    for (let i = 0; i < 28 * 28; i++) {
      input[i] = smallData.data[i * 4] / 255;
    }

    const tensor = tf.tensor4d(input, [1, 28, 28, 1]);
    const pred = (model as { predict: (t: unknown) => { dataSync: () => Float32Array } }).predict(tensor);
    const probs = pred.dataSync();
    setPrediction(Array.from(probs));
    tensor.dispose();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3">
        {!training ? (
          <button
            onClick={startTraining}
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{ backgroundColor: "var(--accent)", color: "var(--accent-fg)" }}
          >
            Начать обучение
          </button>
        ) : (
          <button
            onClick={stopTraining}
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{ backgroundColor: "var(--negative)", color: "#fff" }}
          >
            Остановить
          </button>
        )}
      </div>

      {(state.epoch > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Эпоха", value: state.epoch },
            { label: "Батчей", value: state.batch },
            { label: "Train Loss", value: state.trainLoss.toFixed(3) },
            { label: "Val Accuracy", value: (state.valAcc * 100).toFixed(1) + "%" },
          ].map((m) => (
            <div
              key={m.label}
              className="p-3 rounded-md border"
              style={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}
            >
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{m.label}</div>
              <div className="text-lg font-mono font-medium" style={{ color: "var(--text-primary)" }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {history.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-4">
          <div
            className="p-4 rounded-md border"
            style={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}
          >
            <div className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>Loss</div>
            <SimpleChart data={history} />
          </div>
          <div
            className="p-4 rounded-md border"
            style={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}
          >
            <div className="text-xs mb-2" style={{ color: "var(--text-tertiary)" }}>Accuracy</div>
            <SimpleChart data={accHistory} />
          </div>
        </div>
      )}

      {modelReady && (
        <div
          className="p-4 rounded-md border"
          style={{ backgroundColor: "var(--bg-raised)", borderColor: "var(--border-subtle)" }}
        >
          <div className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
            Нарисуйте цифру для распознавания
          </div>
          <div className="flex gap-4 items-start">
            <DrawingCanvas ref={drawCanvasRef} />
            <button
              onClick={predictDigit}
              className="px-3 py-1.5 text-sm rounded-md"
              style={{
                backgroundColor: "var(--bg-sunken)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              Распознать
            </button>
            {prediction && (
              <div className="flex gap-1 items-end">
                {prediction.map((p, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div
                      className="w-4 rounded-sm"
                      style={{
                        height: `${p * 48}px`,
                        backgroundColor: i === prediction.indexOf(Math.max(...prediction)) ? "var(--accent)" : "var(--border-strong)",
                        minHeight: 2,
                      }}
                    />
                    <span className="text-xs font-mono" style={{ color: "var(--text-tertiary)" }}>
                      {i}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SimpleChart({ data }: { data: { x: number; yTrain: number; yVal: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const W = 200, H = 120;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;
    canvas.width = W * 2;
    canvas.height = H * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, W, H);

    const allY = data.flatMap((d) => [d.yTrain, d.yVal]);
    const yMin = Math.min(...allY);
    const yMax = Math.max(...allY);
    const yRange = yMax - yMin || 1;
    const xRange = data.length - 1 || 1;

    function toX(i: number) { return (i / xRange) * (W - 8) + 4; }
    function toY(v: number) { return H - 4 - ((v - yMin) / yRange) * (H - 8); }

    ctx.strokeStyle = "var(--accent)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    data.forEach((d, i) => { i === 0 ? ctx.moveTo(toX(i), toY(d.yTrain)) : ctx.lineTo(toX(i), toY(d.yTrain)); });
    ctx.stroke();

    ctx.strokeStyle = "var(--positive)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    data.forEach((d, i) => { i === 0 ? ctx.moveTo(toX(i), toY(d.yVal)) : ctx.lineTo(toX(i), toY(d.yVal)); });
    ctx.stroke();
    ctx.setLineDash([]);
  }, [data]);

  return <canvas ref={canvasRef} style={{ width: W, height: H }} />;
}

import { forwardRef, useImperativeHandle } from "react";

const DrawingCanvas = forwardRef<HTMLCanvasElement>(function DrawingCanvas(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  useImperativeHandle(ref, () => canvasRef.current!);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 280;
    canvas.height = 280;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, 280, 280);
  }, []);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: 140, height: 140, borderRadius: 6, border: "1px solid var(--border-subtle)",
        cursor: "crosshair", imageRendering: "pixelated",
      }}
      onMouseDown={(e) => {
        drawing.current = true;
        const ctx = canvasRef.current!.getContext("2d")!;
        const { x, y } = getPos(e);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x * 2, y * 2, 8, 0, Math.PI * 2);
        ctx.fill();
      }}
      onMouseMove={(e) => {
        if (!drawing.current) return;
        const ctx = canvasRef.current!.getContext("2d")!;
        const { x, y } = getPos(e);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x * 2, y * 2, 8, 0, Math.PI * 2);
        ctx.fill();
      }}
      onMouseUp={() => { drawing.current = false; }}
      onMouseLeave={() => { drawing.current = false; }}
      onTouchStart={(e) => {
        e.preventDefault();
        drawing.current = true;
      }}
      onTouchMove={(e) => {
        e.preventDefault();
        if (!drawing.current) return;
        const ctx = canvasRef.current!.getContext("2d")!;
        const { x, y } = getPos(e);
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(x * 2, y * 2, 8, 0, Math.PI * 2);
        ctx.fill();
      }}
      onTouchEnd={() => { drawing.current = false; }}
    />
  );
});
