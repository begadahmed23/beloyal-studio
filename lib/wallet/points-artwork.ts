import path from "node:path";
import sharp from "sharp";

const directory = path.join(process.cwd(), "public", "brand", "firey-nash");

export function renderFireyWalletMark(asset: "wallet-icon" | "wordmark", width: number, height: number) {
  return sharp(path.join(directory, asset + ".png")).resize(width, height, {
    fit: "contain", background: "#00000000",
  }).png().toBuffer();
}

export function renderPointsStrip(background: string, firey: boolean) {
  return firey
    ? sharp(path.join(directory, "wallet-strip-v2.png")).png().toBuffer()
    : sharp({ create: { width: 1125, height: 369, channels: 4, background } }).png().toBuffer();
}
