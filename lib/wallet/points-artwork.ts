import path from "node:path";
import sharp from "sharp";
import { fireyNashBrand } from "../business/points";

const fireyAsset = (asset: "flame" | "logo") =>
  path.join(process.cwd(), "public", "brand", fireyNashBrand.slug, asset + ".png");

export function fireyWalletLogo(width: number, height: number, asset: "flame" | "logo" = "logo") {
  return sharp(fireyAsset(asset)).resize(width, height, {
    fit: "contain", background: "#00000000",
  }).png().toBuffer();
}

export async function renderPointsStrip(background: string, firey: boolean, width = 1125, height = 369) {
  const strip = sharp({ create: { width, height, channels: 4, background } });
  if (firey) {
    const markHeight = Math.round(height * .56);
    const markWidth = Math.round(markHeight * .71);
    strip.composite([{ input: await fireyWalletLogo(markWidth, markHeight, "flame"),
      left: Math.round((width - markWidth) / 2), top: Math.round((height - markHeight) / 2) }]);
  }
  return strip.png().toBuffer();
}
