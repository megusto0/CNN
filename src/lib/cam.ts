export function upsample7x7(cam: Float32Array, targetSize: number): Float32Array {
  const srcH = 7, srcW = 7;
  const result = new Float32Array(targetSize * targetSize);
  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const sy = (y / targetSize) * srcH;
      const sx = (x / targetSize) * srcW;
      const sy0 = Math.min(Math.floor(sy), srcH - 1);
      const sx0 = Math.min(Math.floor(sx), srcW - 1);
      const sy1 = Math.min(sy0 + 1, srcH - 1);
      const sx1 = Math.min(sx0 + 1, srcW - 1);
      const fy = sy - sy0;
      const fx = sx - sx0;
      const v =
        cam[sy0 * srcW + sx0] * (1 - fy) * (1 - fx) +
        cam[sy0 * srcW + sx1] * (1 - fy) * fx +
        cam[sy1 * srcW + sx0] * fy * (1 - fx) +
        cam[sy1 * srcW + sx1] * fy * fx;
      result[y * targetSize + x] = v;
    }
  }
  return result;
}

const VIRIDIS: [number, number, number][] = [
  [68, 1, 84], [72, 36, 117], [65, 68, 135], [53, 95, 141],
  [42, 120, 142], [33, 145, 140], [34, 168, 132], [68, 191, 112],
  [122, 209, 81], [189, 223, 38], [253, 231, 37],
];

export function viridisColor(t: number): [number, number, number] {
  const idx = t * (VIRIDIS.length - 1);
  const i = Math.floor(idx);
  const f = idx - i;
  if (i >= VIRIDIS.length - 1) return VIRIDIS[VIRIDIS.length - 1];
  const a = VIRIDIS[i];
  const b = VIRIDIS[i + 1];
  return [
    Math.round(a[0] + (b[0] - a[0]) * f),
    Math.round(a[1] + (b[1] - a[1]) * f),
    Math.round(a[2] + (b[2] - a[2]) * f),
  ];
}

export function renderCAMOverlay(
  cam: Float32Array,
  targetSize: number,
  canvas: HTMLCanvasElement,
): void {
  const upsampled = upsample7x7(cam, targetSize);
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext("2d")!;
  const imgData = ctx.createImageData(targetSize, targetSize);

  for (let i = 0; i < targetSize * targetSize; i++) {
    const [r, g, b] = viridisColor(upsampled[i]);
    imgData.data[i * 4] = r;
    imgData.data[i * 4 + 1] = g;
    imgData.data[i * 4 + 2] = b;
    imgData.data[i * 4 + 3] = Math.round(upsampled[i] * 160);
  }

  ctx.putImageData(imgData, 0, 0);
}
