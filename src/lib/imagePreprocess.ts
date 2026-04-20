const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];

export function preprocessForResNet(img: HTMLImageElement): Float32Array {
  const canvas = document.createElement("canvas");
  canvas.width = 224;
  canvas.height = 224;
  const ctx = canvas.getContext("2d")!;

  const scale = Math.max(256 / img.width, 256 / img.height);
  const sw = img.width * scale;
  const sh = img.height * scale;
  const ox = (sw - 224) / 2;
  const oy = (sh - 224) / 2;
  ctx.drawImage(img, -ox, -oy, sw, sh);

  const imageData = ctx.getImageData(0, 0, 224, 224);
  const pixels = imageData.data;
  const tensor = new Float32Array(3 * 224 * 224);

  for (let y = 0; y < 224; y++) {
    for (let x = 0; x < 224; x++) {
      const i = y * 224 + x;
      const pi = i * 4;
      tensor[i] = (pixels[pi] / 255 - IMAGENET_MEAN[0]) / IMAGENET_STD[0];
      tensor[224 * 224 + i] = (pixels[pi + 1] / 255 - IMAGENET_MEAN[1]) / IMAGENET_STD[1];
      tensor[2 * 224 * 224 + i] = (pixels[pi + 2] / 255 - IMAGENET_MEAN[2]) / IMAGENET_STD[2];
    }
  }

  return tensor;
}

export function softmax(logits: Float32Array): Float32Array {
  const max = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return new Float32Array(exps.map((e) => e / sum));
}
