export function convolve2d(
  pixels: Uint8ClampedArray,
  w: number,
  h: number,
  kernel: number[],
  stride: number,
  pad: number,
  useRelu: boolean,
): Uint8ClampedArray {
  const kSize = 3;
  const outW = Math.floor((w - kSize + 2 * pad) / stride) + 1;
  const outH = Math.floor((h - kSize + 2 * pad) / stride) + 1;

  const gray = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = pixels[i * 4];
    const g = pixels[i * 4 + 1];
    const b = pixels[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  const out = new Uint8ClampedArray(outW * outH);

  for (let oy = 0; oy < outH; oy++) {
    for (let ox = 0; ox < outW; ox++) {
      let sum = 0;
      for (let ky = 0; ky < kSize; ky++) {
        for (let kx = 0; kx < kSize; kx++) {
          const ix = ox * stride - pad + kx;
          const iy = oy * stride - pad + ky;
          if (ix >= 0 && ix < w && iy >= 0 && iy < h) {
            sum += gray[iy * w + ix] * kernel[ky * kSize + kx];
          }
        }
      }
      if (useRelu) {
        sum = Math.max(0, sum);
      }
      out[oy * outW + ox] = Math.min(255, Math.max(0, Math.round(sum)));
    }
  }

  return out;
}

export function outputSize(inputW: number, inputH: number, kernel: number, stride: number, pad: number): [number, number] {
  const outW = Math.floor((inputW - kernel + 2 * pad) / stride) + 1;
  const outH = Math.floor((inputH - kernel + 2 * pad) / stride) + 1;
  return [outW, outH];
}
