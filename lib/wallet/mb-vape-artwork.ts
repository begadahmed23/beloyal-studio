import path from "node:path";
import sharp from "sharp";

import { MB_VAPE_IVORY, MB_VAPE_STAMP_PATH, MB_VAPE_WALNUT } from "../business/mb-vape";

const originalLogo = path.join(process.cwd(), "public/brands/mb-vape/logo.png");

export function renderMbVapeLogo(width: number, height: number, background = "#ffffff", padding = 0) {
  return sharp(originalLogo)
    .extract({ left: 197, top: 310, width: 733, height: 500 })
    .resize(width - 2 * padding, height - 2 * padding, {
      fit: "contain", background, position: width > height * 2 ? "left" : "centre",
    })
    .extend({ top: padding, bottom: padding, left: padding, right: padding, background })
    .png()
    .toBuffer();
}

function walnut(width: number, height: number) {
  return `<defs>
    <linearGradient id="walnut" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop stop-color="#94694D"/><stop offset=".6" stop-color="${MB_VAPE_WALNUT}"/><stop offset="1" stop-color="#40291E"/>
    </linearGradient>
    <pattern id="grain" width="53" height="37" patternUnits="userSpaceOnUse">
      <path d="M0 3C19 -1 37 6 53 3M0 11C19 7 37 14 53 11M0 23C19 19 37 26 53 23M0 33C19 29 37 36 53 33" fill="none" stroke="#F3CEAC" opacity=".13"/>
      <path d="M0 17C19 13 37 20 53 17M0 29C19 25 37 32 53 29" fill="none" stroke="#271911" opacity=".3"/>
    </pattern>
  </defs><rect width="${width}" height="${height}" fill="url(#walnut)"/>
  <rect width="${width}" height="${height}" fill="url(#grain)"/>`;
}

function stampGrid(stamps: number, target: number, width: number, centerY: number, maxColumns: number, size: number) {
  const rows = Math.ceil(target / maxColumns);
  const columns = Math.ceil(target / rows);
  const step = Math.min(size * 1.31, width * 0.78 / columns);
  const radius = Math.min(size / 2, step * 0.42);
  return Array.from({ length: target }, (_, index) => {
    const row = Math.floor(index / columns);
    const rowLength = Math.min(columns, target - row * columns);
    const x = width / 2 + (index % columns - (rowLength - 1) / 2) * step;
    const y = centerY + (row - (rows - 1) / 2) * step;
    const filled = index < stamps;
    const iconSize = radius * 1.32;
    const stroke = filled ? "#432B1D" : MB_VAPE_IVORY;
    return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${filled ? MB_VAPE_IVORY : "#493126"}" stroke="${MB_VAPE_IVORY}" stroke-width="${radius / 10}"/>
      <g transform="translate(${x - iconSize / 2},${y - iconSize / 2}) scale(${iconSize / 24})">
        <path d="${MB_VAPE_STAMP_PATH}" fill="none" stroke="${stroke}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
      </g>`;
  }).join("");
}

function renderStampArtwork(stamps: number, target: number, width: number, height: number) {
  const viewHeight = 375 * height / width;
  const rows = Math.ceil(target / 10);
  const size = rows === 1 ? 40 : Math.min(34, 102 / (rows * 1.31));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 375 ${viewHeight}">
    ${walnut(375, viewHeight)}
    ${stampGrid(stamps, target, 375, viewHeight / 2, 10, size)}
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export function renderMbVapeAppleStrip(stamps: number, target: number) {
  return renderStampArtwork(stamps, target, 1125, 432);
}

export function renderMbVapeGoogleArtwork(stamps: number, target: number) {
  return renderStampArtwork(stamps, target, 1032, 812);
}
