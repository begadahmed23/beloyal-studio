import sharp from "sharp";

// Match Loretto's saved café palette; leave the native Wallet card to display
// business name, member, reward, QR code and stamp count.
export const LORETTO_BG = "#E9E4D8";
export const LORETTO_DARK = "#2E2E2E";
export const LORETTO_MUTED = "#524F47";

const BACKGROUND = LORETTO_BG;
const INK = LORETTO_DARK;

export async function renderLorettoArtwork(
  stamps: number,
  target: number,
  kind: "strip" | "logo" | "icon" = "strip",
): Promise<Buffer> {
  if (kind === "icon") {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">
      <rect width="240" height="240" rx="32" fill="${BACKGROUND}"/>
      <text x="120" y="167" text-anchor="middle" font-size="160"
        font-family="Georgia,Times New Roman,serif" fill="${INK}">L</text>
    </svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  if (kind === "logo") {
    // The standalone mark remains compact; no decorative slogan or border.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="200" viewBox="0 0 900 200">
      <text x="450" y="141" text-anchor="middle" font-size="116"
        font-weight="bold" letter-spacing="7" font-family="Georgia,Times New Roman,serif"
        fill="${INK}">LORETTO</text>
    </svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
  }

  const count = Math.max(1, Math.min(12, Math.floor(target)));
  const completed = Math.max(0, Math.min(count, Math.floor(stamps)));
  const rows = count > 8 ? 2 : 1;
  const columns = Math.ceil(count / rows);
  const gap = 690 / columns;
  const stampCircles = Array.from({ length: count }, (_, i) => {
    const x = 218 + (i % columns) * gap + gap / 2;
    const y = rows === 1 ? 176 : 124 + Math.floor(i / columns) * 102;
    const active = i < completed;
    const circle = `<circle cx="${x}" cy="${y}" r="34" stroke="${INK}" stroke-width="2.5"
       fill="${active ? INK : "none"}"/>`;
    const mark = active
      ? `<path d="M${x-13} ${y}l9 9 18-21" fill="none" stroke="${BACKGROUND}"
          stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<circle cx="${x}" cy="${y}" r="5" fill="${LORETTO_MUTED}" opacity=".38"/>`;
    return circle + mark;
  }).join("");

  // Safe center region avoids Apple Wallet's edge cropping. The strip has no
  // repeated header, text or progress label: native fields carry those.
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1125" height="369" viewBox="0 0 1125 369">
     <rect width="1125" height="369" fill="${BACKGROUND}"/>
     <path d="M110 64H1015" stroke="${INK}" stroke-opacity=".16"/>
     ${stampCircles}
     <path d="M110 307H1015" stroke="${INK}" stroke-opacity=".16"/>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}
