#!/usr/bin/env node
// Genera los PNG de la PWA a partir del arte del matraz.
// Uso:  cd scripts && npm install sharp && node gen-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "icons");
mkdirSync(outDir, { recursive: true });

// Versión a sangre completa (sin esquinas redondeadas): el sistema operativo
// aplica su propia máscara. El matraz queda dentro de la "zona segura" central.
const fullBleedSVG = `<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4A90E2"/>
      <stop offset="1" stop-color="#1A73E8"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <g fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">
    <line x1="206" y1="150" x2="306" y2="150"/>
    <path d="M226 154 V224 L158 352 a70 70 0 0 0 62 102 h72 a70 70 0 0 0 62 -102 L286 224 V154"/>
  </g>
  <path d="M192 306 q64 32 128 0 l26 48 a70 70 0 0 1 -56 100 h-68 a70 70 0 0 1 -56 -100 z" fill="#ffffff" opacity="0.92"/>
  <circle cx="230" cy="400" r="11" fill="#1A73E8" opacity="0.5"/>
  <circle cx="276" cy="418" r="8" fill="#1A73E8" opacity="0.5"/>
  <circle cx="252" cy="376" r="6" fill="#1A73E8" opacity="0.5"/>
</svg>`;

const svgBuffer = Buffer.from(fullBleedSVG);
const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const t of targets) {
  await sharp(svgBuffer, { density: 384 })
    .resize(t.size, t.size)
    .flatten({ background: "#1A73E8" }) // sin transparencia (importante para iOS)
    .png()
    .toFile(join(outDir, t.file));
  console.log(`✅ ${t.file} (${t.size}×${t.size})`);
}
console.log("Iconos generados en /icons");
