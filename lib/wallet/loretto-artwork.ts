import sharp from "sharp";

/** The Loretto identity: warm parchment, charcoal, and the reversed R wordmark. */
export const LORETTO_BG = "#E9E4D8";
export const LORETTO_DARK = "#2E2E2E";
export const LORETTO_MUTED = "#524F47";

const brand = (y: number, fontSize: number, centerX = 562) => {
  const size = fontSize;
  // Draw a reversed Latin R with an SVG horizontal mirror, like the existing web logo.
  const left = centerX - 2.75 * size;
  return '<g font-family="Georgia,Times New Roman,serif" font-weight="bold" font-size="' + size + '" fill="' + LORETTO_DARK + '">' +
    '<text x="' + left + '" y="' + y + '" letter-spacing="' + Math.round(size * .06) + '">LO</text>' +
    '<g transform="translate(' + (left + size * 2.28) + ' 0) scale(-1 1)"><text x="0" y="' + y + '">R</text></g>' +
    '<text x="' + (left + size * 3.18) + '" y="' + y + '" letter-spacing="' + Math.round(size * .06) + '">ETTO</text></g>';
};

export async function renderLorettoArtwork(stamps: number, target: number, kind: "strip" | "logo" | "icon" = "strip") {
  if (kind === "icon") {
    return sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" rx="65" fill="' + LORETTO_BG + '"/><rect x="23" y="23" width="466" height="466" rx="48" stroke="' + LORETTO_MUTED + '" stroke-opacity=".45" stroke-width="3" fill="none"/><text x="256" y="326" text-anchor="middle" font-family="Georgia,serif" font-size="260" fill="' + LORETTO_DARK + '">L</text><path d="M153 369H359" stroke="' + LORETTO_MUTED + '" stroke-width="4"/></svg>')).png().toBuffer();
  }
  if (kind === "logo") {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="220" viewBox="0 0 1125 275"><rect width="1125" height="275" fill="' + LORETTO_BG + '"/>' +
      brand(157, 112) + '<path d="M265 191H860" stroke="' + LORETTO_MUTED + '" stroke-opacity=".6" stroke-width="2"/></svg>';
    return sharp(Buffer.from(svg)).png().toBuffer();
  }
  const safeTarget = Math.max(1, Math.min(12, Math.floor(target)));
  const safeStamps = Math.max(0, Math.min(safeTarget, Math.floor(stamps)));
  const perRow = safeTarget > 8 ? Math.ceil(safeTarget / 2) : safeTarget;
  const countRows = Math.ceil(safeTarget / perRow);
  const gap = 680 / perRow;
  const stampsSvg = Array.from({ length: safeTarget }, (_, i) => {
    const x = 222 + (i % perRow) * gap + gap / 2;
    const y = countRows === 1 ? 259 : 231 + Math.floor(i / perRow) * 73;
    const filled = i < safeStamps;
    const shape = '<circle cx="' + x + '" cy="' + y + '" r="26" fill="' + (filled ? LORETTO_DARK : "none") + '" stroke="' + LORETTO_DARK + '" stroke-width="2"/>';
    const mark = filled
      ? '<path d="M' + (x-10) + ' ' + y + ' l7 7 15 -17" fill="none" stroke="' + LORETTO_BG + '" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"/>'
      : '<circle cx="' + x + '" cy="' + y + '" r="5" fill="' + LORETTO_MUTED + '" opacity=".55"/>';
    return shape + mark;
  }).join("");
  const status = safeStamps >= safeTarget ? "REWARD READY" : String(safeStamps) + " / " + String(target) + " STAMPS";
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1125" height="432" viewBox="0 0 1125 432">' +
    '<rect width="1125" height="432" fill="' + LORETTO_BG + '"/>' +
    '<rect x="12" y="12" width="1101" height="408" rx="9" stroke="' + LORETTO_MUTED + '" stroke-opacity=".4" stroke-width="2" fill="none"/>' +
    brand(143, 91) +
    '<path d="M160 171H965" stroke="' + LORETTO_MUTED + '" stroke-opacity=".4"/>' +
    stampsSvg +
    '<text x="562" y="386" text-anchor="middle" font-family="DejaVu Sans,sans-serif" font-size="27" letter-spacing="5" fill="' + LORETTO_DARK + '">' + status + '</text></svg>';
  return sharp(Buffer.from(svg)).png().toBuffer();
}
