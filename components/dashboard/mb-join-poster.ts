import { BELOYAL_DOMAIN } from "@/lib/business/provider";
import { MB_VAPE_IVORY, MB_VAPE_WALNUT } from "@/lib/business/mb-vape";

export function drawMbJoinPoster(
  ctx: CanvasRenderingContext2D, logo: HTMLImageElement, name: string, tagline: string,
  progress: string, reward: string,
) {
  const ink = "#432B1D";
  const border = "#A47B60";
  const walnut = ctx.createLinearGradient(0, 0, 420, 204);
  walnut.addColorStop(0, "#94694D");
  walnut.addColorStop(0.54, MB_VAPE_WALNUT);
  walnut.addColorStop(1, "#40291E");

  ctx.fillStyle = MB_VAPE_IVORY;
  ctx.fillRect(0, 0, 420, 720);
  ctx.fillStyle = walnut;
  ctx.fillRect(0, 0, 420, 204);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, 420, 204);
  ctx.clip();
  for (let y = 3; y < 210; y += 7) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x < 420; x += 53) {
      ctx.bezierCurveTo(x + 19, y - 4, x + 37, y + 3, x + 53, y);
    }
    ctx.strokeStyle = y % 3 === 0 ? "#27191155" : "#F3CEAC30";
    ctx.stroke();
  }
  ctx.restore();

  const rounded = (x: number, y: number, w: number, h: number, r: number, fill: string | null, stroke?: string) => {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  };
  function text(value: string, y: number, font: string, color = ink, width = 336) {
    ctx.fillStyle = color;
    ctx.font = font;
    ctx.fillText(value, 210, y, width);
  }

  rounded(10, 10, 400, 700, 8, null, border);
  ctx.fillStyle = border;
  ctx.fillRect(0, 203, 420, 1);
  rounded(144, 36, 132, 77, 11, MB_VAPE_IVORY);

  // The shared logo image has a white background. Multiply keeps the original mark on ivory.
  ctx.save();
  ctx.globalCompositeOperation = "multiply";
  const logoWidth = 106;
  const logoHeight = logoWidth * logo.naturalHeight / logo.naturalWidth;
  ctx.drawImage(logo, (420 - logoWidth) / 2, 74.5 - logoHeight / 2, logoWidth, logoHeight);
  ctx.restore();

  text(name, 142, "bold 28px Georgia, serif", MB_VAPE_IVORY);
  ctx.letterSpacing = "2px";
  text(tagline.toUpperCase(), 171, "bold 10px Arial, sans-serif", MB_VAPE_IVORY);
  ctx.letterSpacing = "0px";
  rounded(70, 227, 280, 280, 13, "#E4D3C4");
  rounded(70, 223, 280, 280, 13, "#FFFFFF", border);
  text(progress, 534, "bold 20px Arial, sans-serif");
  text(reward, 560, "bold 28px Georgia, serif");
  text("Scan the QR code to join.", 593, "13px Arial, sans-serif", MB_VAPE_WALNUT);
  ctx.fillStyle = border;
  ctx.fillRect(42, 624, 336, 0.75);
  ctx.letterSpacing = "1.4px";
  text("Powered by", 642, "bold 8px Arial, sans-serif", MB_VAPE_WALNUT);
  ctx.letterSpacing = "0px";
  text(BELOYAL_DOMAIN, 662, "bold 14px Arial, sans-serif");
}
