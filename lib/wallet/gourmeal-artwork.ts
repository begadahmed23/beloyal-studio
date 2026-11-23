import sharp from "sharp";
import { GOURMEAL } from "../business/gourmeal";
import { gourmealWordmark } from "../business/gourmeal-wordmark";

const { green, lime, stone, sand, butter } = GOURMEAL;

function shaker(color: string, filled: boolean) {
  return `<g stroke="${color}" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 8V4.5h7.5a2.5 2.5 0 0 1 2.5 2.5v1M10 8h15a2 2 0 0 1 2 2v3H8v-3a2 2 0 0 1 2-2Z" fill="none"/>
    <path d="M9.5 13 12 30.5a2 2 0 0 0 2 1.5h7a2 2 0 0 0 2-1.5L25.5 13" fill="none"/>
    ${filled
      ? '<path d="M12.1 21.8c3.7-2.5 6.9 2.7 10.8 0l-1.1 7.4a1.3 1.3 0 0 1-1.3 1.1h-5.8a1.3 1.3 0 0 1-1.3-1.1Z" stroke="none" fill="currentColor"/>'
      : '<path d="M17.5 19.5h3.8m-3.8 4h2.8" fill="none"/>'}
  </g>`;
}

export function renderGourmealStrip(stamps: number, target: number, platform: "apple" | "google" = "apple") {
  const width = 375;
  const height = 123;
  const rows = Math.ceil(target / 9);
  const columns = Math.ceil(target / rows);
  const step = Math.min(43, 295 / columns, 102 / rows);
  const scale = (step * 0.85) / 36;
  const cells = Array.from({ length: target }, (_, index) => {
    const row = Math.floor(index / columns);
    const rowLength = Math.min(columns, target - row * columns);
    const x = width / 2 + (index % columns - (rowLength - 1) / 2) * step;
    const y = height / 2 + (row - (rows - 1) / 2) * step;
    const filled = index < stamps;
    const last = index === target - 1;
    const tile = last ? butter : filled ? lime : stone;
    const stroke = filled || last ? green : "#5D7162";
    return `<g transform="translate(${x} ${y}) scale(${scale}) translate(-18 -18)" color="${green}">
      <rect width="36" height="36" rx="11" fill="${tile}" stroke="${stroke}" stroke-width="${last ? 1.45 : 0.8}"/>
      <g transform="translate(4.75 4.6) scale(.76)">${shaker(stroke, filled)}</g>
      ${last ? `<path d="M29 3.5v5.5m-2.75-2.75h5.5" stroke="${green}" stroke-width="1.1" stroke-linecap="round"/>` : ""}
    </g>`;
  }).join("");
  const [pixelsWide, pixelsHigh] = platform === "apple" ? [1125, 369] : [1032, 336];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelsWide}" height="${pixelsHigh}" viewBox="0 0 ${width} ${height}">
    <rect width="${width}" height="${height}" fill="${green}"/>
    <rect x="18" y="4" width="339" height="115" rx="15" fill="${sand}"/>
    <path d="M33 14h309m-309 95h309" stroke="${green}" stroke-width=".65" opacity=".23"/>
    ${cells}
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export function renderGourmealIcon(size: number) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="15" fill="${green}"/>
    <circle cx="32" cy="32" r="22" fill="${lime}"/>
    <g transform="translate(14.5 13.75)" color="${green}">${shaker(green, true)}</g>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export function renderGourmealWordmark(width: number, height: number, position: "left" | "centre" = "centre") {
  const mark = gourmealWordmark;
  const alignment = position === "left" ? "xMinYMid" : "xMidYMid";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"
    viewBox="0 0 ${mark.width} ${mark.height}" preserveAspectRatio="${alignment} meet">
    <path fill="${stone}" fill-rule="evenodd" d="${mark.path}"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
