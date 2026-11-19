#!/usr/bin/env node
// Tạo hình cho game bằng Google Nano Banana Pro (gemini-3-pro-image), cắt nền trắng, thu nhỏ, lưu WebP.
// Cách làm theo dự án cay-thong-noel/tools/gen_art.mjs.
// Key: biến môi trường GEMINI_API_KEY (hoặc tools/gemini.local.json {"key": "..."}, đã git-ignore).
//   node tools/gen_art.mjs                 # tạo các ảnh còn thiếu
//   node tools/gen_art.mjs hero,coin --redo
// Ảnh gốc: tools/raw/<id>.png (git-ignore). Ảnh dùng trong game: <out>/<id>.webp
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { PROMPTS } from "./art_prompts.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const RAW = join(HERE, "raw");
const KEY_FILE = join(HERE, "gemini.local.json");
const MODEL = "gemini-3-pro-image";
const API = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const STYLE_LEAD = "The attached images are approved assets from the same game. Create a NEW one in exactly the same art style: " +
  "same painted look, line quality, proportions, lighting, saturation and level of detail. Do not copy the subjects of the reference images. Subject: ";

async function geminiKey() {
  if (existsSync(KEY_FILE)) {
    const { key } = JSON.parse((await readFile(KEY_FILE, "utf8")).replace(/^﻿/, ""));
    if (typeof key === "string" && key.trim()) return key.trim();
  }
  return process.env.GEMINI_API_KEY ?? "";
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateImage(key, text, refFiles, ratio) {
  const images = await Promise.all(refFiles.map(async (file) => ({
    inlineData: { mimeType: "image/png", data: (await readFile(file)).toString("base64") },
  })));
  for (let attempt = 0; ; attempt++) {
    const response = await fetch(API, {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [...images, { text }] }],
        generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: ratio } },
      }),
    });
    if ((response.status === 429 || response.status >= 500) && attempt < 5) {
      await sleep(3000 * 2 ** attempt);
      continue;
    }
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`gemini -> ${response.status}: ${body.error?.message?.slice(0, 300) ?? ""}`);
    const part = body.candidates?.[0]?.content?.parts?.find((c) => c.inlineData);
    if (part) return Buffer.from(part.inlineData.data, "base64");
    if (attempt >= 1) throw new Error(`gemini returned no image (${body.candidates?.[0]?.finishReason ?? "no candidates"})`);
  }
}

// Điểm ảnh gần màu nền nối với mép ảnh thành trong suốt (mép mềm); màu đó bên trong vật thể được giữ.
// Mặc định nền trắng, loang từ cả 4 mép. topOnly: nền là màu ở góc trên-trái, chỉ loang từ mép trên.
function cutBackground(context, width, height, { hard = 22, soft = 48, topOnly = false } = {}) {
  const data = context.getImageData(0, 0, width, height);
  const px = data.data;
  const ref = topOnly ? [px[0], px[1], px[2]] : [255, 255, 255];
  const dist = (i) => Math.max(Math.abs(px[i] - ref[0]), Math.abs(px[i + 1] - ref[1]), Math.abs(px[i + 2] - ref[2]));
  const seen = new Uint8Array(width * height);
  const stack = [];
  for (let x = 0; x < width; x++) stack.push(x);
  if (!topOnly) {
    for (let x = 0; x < width; x++) stack.push((height - 1) * width + x);
    for (let y = 0; y < height; y++) stack.push(y * width, y * width + width - 1);
  }
  while (stack.length) {
    const p = stack.pop();
    if (seen[p]) continue;
    seen[p] = 1;
    const d = dist(p * 4);
    if (d >= soft) continue;
    px[p * 4 + 3] = d <= hard ? 0 : Math.round(255 * (d - hard) / (soft - hard));
    if (d > hard) continue;
    const x = p % width;
    if (x > 0) stack.push(p - 1);
    if (x < width - 1) stack.push(p + 1);
    if (p >= width) stack.push(p - width);
    if (p < width * (height - 1)) stack.push(p + width);
  }
  context.putImageData(data, 0, 0);
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (px[(y * width + x) * 4 + 3] > 8) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  }
  if (maxX < 0) return { x: 0, y: 0, w: width, h: height };
  const pad = 6;
  const x0 = Math.max(0, minX - pad), y0 = Math.max(0, minY - pad);
  return { x: x0, y: y0, w: Math.min(width, maxX + pad + 1) - x0, h: Math.min(height, maxY + pad + 1) - y0 };
}

async function processImage(bytes, item) {
  const image = await loadImage(bytes);
  const canvas = createCanvas(image.width, image.height);
  const context = canvas.getContext("2d");
  context.drawImage(image, 0, 0);
  const box = item.cut === false
    ? { x: 0, y: 0, w: image.width, h: image.height }
    : cutBackground(context, image.width, image.height, { topOnly: item.cut === "top" });
  const scale = Math.min(1, item.maxSize / Math.max(box.w, box.h));
  const w = Math.round(box.w * scale), h = Math.round(box.h * scale);
  const out = createCanvas(w, h);
  const outCtx = out.getContext("2d");
  outCtx.imageSmoothingQuality = "high";
  outCtx.drawImage(canvas, box.x, box.y, box.w, box.h, 0, 0, w, h);
  return out.encode("webp", 88);
}

const args = process.argv.slice(2);
const redo = args.includes("--redo");
const reprocess = args.includes("--reprocess"); // chỉ xử lý lại từ tools/raw, không gọi API
const ids = args[0] && !args[0].startsWith("--") && args[0] !== "all" ? args[0].split(",") : Object.keys(PROMPTS);
const key = await geminiKey();
if (!key) { console.error("Cần GEMINI_API_KEY."); process.exit(1); }
await mkdir(RAW, { recursive: true });

let failed = false;
for (const id of ids) {
  const item = PROMPTS[id];
  if (!item) { console.error(`không có mục ${id}`); failed = true; continue; }
  const out = join(ROOT, item.out, `${id}.webp`);
  const rawFile = join(RAW, `${id}.png`);
  if (reprocess && existsSync(rawFile)) {
    await writeFile(out, await processImage(await readFile(rawFile), item));
    console.log(`↻ ${id}`);
    continue;
  }
  if (existsSync(out) && !redo) { console.log(`= ${id} đã có`); continue; }
  try {
    const refs = (item.refs ?? []).map((r) => join(RAW, `${r}.png`)).filter((f) => existsSync(f));
    const text = (refs.length ? STYLE_LEAD : "") + item.prompt + " " + item.style;
    const bytes = await generateImage(key, text, refs, item.ratio);
    await writeFile(join(RAW, `${id}.png`), bytes);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, await processImage(bytes, item));
    console.log(`✓ ${id}`);
  } catch (error) {
    failed = true;
    console.error(`✗ ${id}: ${error.message}`);
  }
}
process.exit(failed ? 1 : 0);
