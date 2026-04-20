// Generates preset images as minimal PNGs — no native deps
// Run: node scripts/generate-presets.mjs

import { writeFileSync, mkdirSync } from "fs";
import { deflateSync } from "node:zlib";

// Minimal PNG writer: 8-bit RGB
function writePNG(width, height, pixels, path) {
  
  // Build raw image data with filter byte (0=None) per row
  const rawData = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 3)] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 3;
      const dstIdx = y * (1 + width * 3) + 1 + x * 3;
      rawData[dstIdx] = pixels[srcIdx];
      rawData[dstIdx + 1] = pixels[srcIdx + 1];
      rawData[dstIdx + 2] = pixels[srcIdx + 2];
    }
  }
  
  const compressed = deflateSync(rawData);
  
  // Build PNG file
  const chunks = [];
  
  // Signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  
  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const typeB = Buffer.from(type);
    const crcInput = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(crcInput) >>> 0);
    return Buffer.concat([len, typeB, data, crc]);
  }
  
  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  chunks.push(makeChunk("IHDR", ihdr));
  
  // IDAT
  chunks.push(makeChunk("IDAT", compressed));
  
  // IEND
  chunks.push(makeChunk("IEND", Buffer.alloc(0)));
  
  writeFileSync(path, Buffer.concat(chunks));
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return crc ^ 0xFFFFFFFF;
}

const S = 256;
const dir = "public/images/conv-presets";
mkdirSync(dir, { recursive: true });

function makeImage(fn) {
  const px = new Uint8Array(S * S * 3);
  fn(px);
  return px;
}

function setPixel(px, x, y, r, g, b) {
  const i = (y * S + x) * 3;
  px[i] = r; px[i+1] = g; px[i+2] = b;
}

function fillCircle(px, cx, cy, r, cr, cg, cb) {
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if ((x-cx)**2 + (y-cy)**2 <= r*r) setPixel(px, x, y, cr, cg, cb);
  }
}

function fillEllipse(px, cx, cy, rx, ry, cr, cg, cb) {
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (((x-cx)/rx)**2 + ((y-cy)/ry)**2 <= 1) setPixel(px, x, y, cr, cg, cb);
  }
}

// checker
const checker = makeImage((px) => {
  const tile = 16;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const v = (Math.floor(x/tile) + Math.floor(y/tile)) % 2 === 0 ? 0x55 : 0x22;
    setPixel(px, x, y, v, v, v);
  }
});
writePNG(S, S, checker, `${dir}/checker.png`);
console.log("  checker.png");

// cameraman
const cameraman = makeImage((px) => {
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const v = Math.floor(40 + 80 * (x/S) * (y/S));
    setPixel(px, x, y, v, v, v);
  }
  fillCircle(px, 128, 80, 30, 0x88, 0x88, 0x88);
  for (let y = 130; y < 230; y++) for (let x = 90; x < 166; x++) setPixel(px, x, y, 0x66, 0x66, 0x66);
});
writePNG(S, S, cameraman, `${dir}/cameraman.png`);
console.log("  cameraman.png");

// lena-crop
const lena = makeImage((px) => {
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) setPixel(px, x, y, 0xc4, 0x95, 0x6a);
  fillCircle(px, 128, 140, 60, 0xd4, 0xa5, 0x74);
  fillCircle(px, 108, 130, 6, 0x33, 0x33, 0x33);
  fillCircle(px, 148, 130, 6, 0x33, 0x33, 0x33);
});
writePNG(S, S, lena, `${dir}/lena-crop.png`);
console.log("  lena-crop.png");

// cat
const cat = makeImage((px) => {
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) setPixel(px, x, y, 0x2a, 0x2a, 0x3a);
  fillCircle(px, 128, 150, 70, 0xe8, 0xa8, 0x48);
  fillCircle(px, 108, 140, 8, 0x11, 0x11, 0x11);
  fillCircle(px, 148, 140, 8, 0x11, 0x11, 0x11);
});
writePNG(S, S, cat, `${dir}/cat.png`);
console.log("  cat.png");

// dog
const dog = makeImage((px) => {
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) setPixel(px, x, y, 0x3a, 0x4a, 0x3a);
  fillCircle(px, 128, 140, 65, 0xa0, 0x78, 0x4a);
  fillCircle(px, 108, 130, 8, 0x22, 0x22, 0x22);
  fillCircle(px, 148, 130, 8, 0x22, 0x22, 0x22);
  fillCircle(px, 128, 158, 6, 0x33, 0x33, 0x33);
});
writePNG(S, S, dog, `${dir}/dog.jpg`);
console.log("  dog.jpg");

// bird
const bird = makeImage((px) => {
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) setPixel(px, x, y, 0x1a, 0x2a, 0x4a);
  fillEllipse(px, 128, 140, 45, 55, 0x4a, 0x8a, 0xde);
  fillCircle(px, 118, 118, 5, 0x22, 0x22, 0x22);
});
writePNG(S, S, bird, `${dir}/bird.jpg`);
console.log("  bird.jpg");

// car
const car = makeImage((px) => {
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) setPixel(px, x, y, 0x4a, 0x4a, 0x5a);
  for (let y = 160; y < 200; y++) for (let x = 20; x < 236; x++) setPixel(px, x, y, 0xcc, 0x33, 0x33);
  fillCircle(px, 70, 200, 18, 0x33, 0x33, 0x33);
  fillCircle(px, 186, 200, 18, 0x33, 0x33, 0x33);
});
writePNG(S, S, car, `${dir}/car.jpg`);
console.log("  car.jpg");

// flower
const flower = makeImage((px) => {
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) setPixel(px, x, y, 0x1a, 0x3a, 0x1a);
  for (let i = 0; i < 6; i++) {
    const a = (i/6) * Math.PI * 2;
    fillEllipse(px, Math.round(128+Math.cos(a)*40), Math.round(128+Math.sin(a)*40), 25, 18, 
      i%2===0 ? 0xe8 : 0xd8, i%2===0 ? 0x48 : 0x38, i%2===0 ? 0x88 : 0x78);
  }
  fillCircle(px, 128, 128, 18, 0xf0, 0xc8, 0x30);
});
writePNG(S, S, flower, `${dir}/flower.jpg`);
console.log("  flower.jpg");

// food
const food = makeImage((px) => {
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) setPixel(px, x, y, 0x2a, 0x1a, 0x0a);
  fillCircle(px, 128, 128, 80, 0xd4, 0xa0, 0x60);
  fillCircle(px, 100, 110, 20, 0xcc, 0x33, 0x33);
  fillCircle(px, 150, 130, 15, 0xcc, 0x33, 0x33);
  fillCircle(px, 120, 150, 18, 0xcc, 0x33, 0x33);
  fillCircle(px, 145, 100, 14, 0x88, 0xcc, 0x44);
  fillCircle(px, 160, 155, 10, 0xf0, 0xc8, 0x30);
});
writePNG(S, S, food, `${dir}/food.jpg`);
console.log("  food.jpg");

console.log("Done.");
