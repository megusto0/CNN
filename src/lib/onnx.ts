import { InferenceSession, Tensor } from "onnxruntime-web";
import { preprocessForResNet, softmax } from "./imagePreprocess";

let classifierSession: InferenceSession | null = null;
let lastconvSession: InferenceSession | null = null;
let fcWeight: Float32Array | null = null;

export async function loadModel(): Promise<void> {
  const opts = { executionProviders: ["wasm"], graphOptimizationLevel: "all" as const };

  const [cls, lc, wResp] = await Promise.all([
    InferenceSession.create("/models/resnet50-int8.onnx", opts),
    InferenceSession.create("/models/resnet50-lastconv.onnx", opts),
    fetch("/models/resnet50-fc-weight.bin").then((r) => r.arrayBuffer()),
  ]);

  classifierSession = cls;
  lastconvSession = lc;
  fcWeight = new Float32Array(wResp);
}

export async function infer(img: HTMLImageElement): Promise<{ classId: number; probability: number; logits: Float32Array }> {
  if (!classifierSession) await loadModel();

  const input = preprocessForResNet(img);
  const tensor = new Tensor("float32", input, [1, 3, 224, 224]);
  const results = await classifierSession!.run({ input: tensor });
  const logits = results.logits.data as Float32Array;
  const probs = softmax(logits);
  let bestIdx = 0;
  let bestProb = 0;
  for (let i = 0; i < probs.length; i++) {
    if (probs[i] > bestProb) {
      bestProb = probs[i];
      bestIdx = i;
    }
  }
  return { classId: bestIdx, probability: bestProb, logits };
}

export async function computeCAM(img: HTMLImageElement, classId: number): Promise<Float32Array> {
  if (!lastconvSession || !fcWeight) await loadModel();

  const input = preprocessForResNet(img);
  const tensor = new Tensor("float32", input, [1, 3, 224, 224]);
  const results = await lastconvSession!.run({ input: tensor });
  const featureMap = results.feature_map.data as Float32Array;
  const [, channels, fmH, fmW] = results.feature_map.dims as number[];

  const cam = new Float32Array(fmH * fmW);

  for (let y = 0; y < fmH; y++) {
    for (let x = 0; x < fmW; x++) {
      let sum = 0;
      for (let c = 0; c < channels; c++) {
        sum += fcWeight![classId * channels + c] * featureMap[c * fmH * fmW + y * fmW + x];
      }
      cam[y * fmW + x] = sum;
    }
  }

  let camMin = Infinity, camMax = -Infinity;
  for (let i = 0; i < cam.length; i++) {
    if (cam[i] < camMin) camMin = cam[i];
    if (cam[i] > camMax) camMax = cam[i];
  }
  const range = camMax - camMin || 1;
  for (let i = 0; i < cam.length; i++) {
    cam[i] = (cam[i] - camMin) / range;
  }

  return cam;
}

export function isWasmAvailable(): boolean {
  return typeof WebAssembly !== "undefined";
}
