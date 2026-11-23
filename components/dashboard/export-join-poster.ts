import { drawMbJoinPoster } from "./mb-join-poster";
import { drawGourmealJoinPoster } from "./gourmeal-join-poster";
import { GOURMEAL } from "@/lib/business/gourmeal";
import { drawJoinPosterCredit } from "./join-poster-credit";

export const POSTER_WIDTH = 420;
export const POSTER_HEIGHT = 720;

export async function exportJoinPoster(
  poster: HTMLElement,
  name: string,
  tagline: string,
  progress: string,
  reward: string,
  brand?: "mb-vape" | "gourmeal",
): Promise<Blob> {
  const qr = poster.querySelector("svg");
  const modules = qr?.viewBox.baseVal.width;
  const path = qr?.querySelector("path:last-of-type")?.getAttribute("d");
  if (!modules || !path) throw new Error("QR code is unavailable.");

  const scale = 3;
  const canvas = document.createElement("canvas");
  canvas.width = POSTER_WIDTH * scale;
  canvas.height = POSTER_HEIGHT * scale;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is unavailable.");

  context.scale(scale, scale);
  context.fillStyle = "#fff";
  context.fillRect(0, 0, POSTER_WIDTH, POSTER_HEIGHT);
  context.textAlign = "center";
  context.textBaseline = "middle";

  const text = (value: string, y: number, size: number, weight: number, color = "#111") => {
    context.fillStyle = color;
    context.font = `${weight} ${size}px Arial, sans-serif`;
    context.fillText(value, POSTER_WIDTH / 2, y, 330);
  };

  const logo = poster.querySelector("img");
  if (logo) await logo.decode().catch(() => {});
  if (brand === "gourmeal") {
    drawGourmealJoinPoster(context, tagline, progress, reward);
  } else if (brand === "mb-vape") {
    if (!logo?.naturalWidth || !logo.naturalHeight) throw new Error("MB logo is unavailable.");
    drawMbJoinPoster(context, logo, name, tagline, progress, reward);
  } else {
    if (logo?.naturalWidth && logo.naturalHeight) {
      const ratio = 96 / Math.max(logo.naturalWidth, logo.naturalHeight);
      const width = logo.naturalWidth * ratio;
      const height = logo.naturalHeight * ratio;
      context.drawImage(logo, (POSTER_WIDTH - width) / 2, 44 + (96 - height) / 2, width, height);
      text(name, 174, 26, 700);
    } else {
      text(name, 134, 30, 700);
    }
    text(tagline.toUpperCase(), 208, 11, 600, "#737373");

    text(progress, 510, 22, 700);
    text(reward, 538, 22, 700);
    text("Scan the QR code to join.", 570, 13, 500, "#737373");
    context.fillStyle = "#e5e5e5";
    context.fillRect(42, 616, 336, 1);
    drawJoinPosterCredit(context, POSTER_WIDTH / 2, 641, "#111111", "#737373");
  }

  // Use whole output pixels per module and leave at least four white modules on all sides.
  const pixelsPerModule = Math.floor(210 * scale / modules);
  const qrSize = modules * pixelsPerModule;
  context.save();
  context.setTransform(pixelsPerModule, 0, 0, pixelsPerModule,
    Math.floor((canvas.width - qrSize) / 2),
    brand ? Math.floor((brand === "gourmeal" ? 378 : 363) * scale - qrSize / 2) : 251 * scale);
  context.fillStyle = brand === "gourmeal" ? GOURMEAL.green : "#111";
  context.fill(new Path2D(path));
  context.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not encode the QR poster."));
    }, "image/png");
  });
}
