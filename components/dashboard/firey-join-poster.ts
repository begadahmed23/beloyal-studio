import { drawJoinPosterCredit } from "./join-poster-credit";

export const fireyJoinPosterCopy = {
  title: "Collect your Flames",
  instruction: "Scan to join and start earning.",
};

export function drawFireyJoinPoster(ctx: CanvasRenderingContext2D, wordmark: HTMLImageElement, branch: string) {
  const gradient = ctx.createLinearGradient(0, 0, 420, 720);
  gradient.addColorStop(0, "#35231e");
  gradient.addColorStop(0.48, "#211a17");
  gradient.addColorStop(1, "#181716");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 420, 720);

  ctx.strokeStyle = "#755046";
  ctx.lineWidth = 1;
  ctx.strokeRect(19.5, 19.5, 381, 681);
  const width = 218;
  const height = width * wordmark.naturalHeight / wordmark.naturalWidth;
  ctx.drawImage(wordmark, (420 - width) / 2, 69, width, height);

  ctx.direction = "rtl";
  ctx.fillStyle = "#f6f0e9";
  ctx.font = "700 25px Arial, sans-serif";
  ctx.fillText(branch, 210, 177, 322);

  ctx.beginPath();
  ctx.roundRect(84, 225, 252, 252, 21);
  ctx.fillStyle = "#fff";
  ctx.fill();

  ctx.direction = "ltr";
  ctx.fillStyle = "#ff8746";
  ctx.font = "700 29px Arial, sans-serif";
  ctx.fillText(fireyJoinPosterCopy.title, 210, 526, 336);
  ctx.fillStyle = "#e5dcd4";
  ctx.font = "500 15px Arial, sans-serif";
  ctx.fillText(fireyJoinPosterCopy.instruction, 210, 561, 320);

  ctx.strokeStyle = "#61443a";
  ctx.beginPath();
  ctx.moveTo(72, 603);
  ctx.lineTo(348, 603);
  ctx.stroke();
  drawJoinPosterCredit(ctx, 210, 637, "#f6f0e9", "#b9a497");
}
