import { GOURMEAL } from "@/lib/business/gourmeal";
import { gourmealWordmark } from "@/lib/business/gourmeal-wordmark";
import { drawJoinPosterCredit } from "./join-poster-credit";

export function drawGourmealJoinPoster(
  context: CanvasRenderingContext2D,
  location: string,
  progress: string,
  reward: string,
) {
  const { green, lime, sand, stone } = GOURMEAL;
  const text = (value: string, y: number, size: number, weight: number, color: string) => {
    context.fillStyle = color;
    context.font = `${weight} ${size}px Arial, sans-serif`;
    context.fillText(value, 210, y, 340);
  };

  context.fillStyle = stone;
  context.fillRect(0, 0, 420, 720);
  context.fillStyle = green;
  context.fillRect(0, 0, 420, 174);
  context.fillStyle = lime;
  context.fillRect(0, 174, 420, 8);

  const wordmarkWidth = 286;
  context.save();
  context.translate((420 - wordmarkWidth) / 2, 48);
  context.scale(wordmarkWidth / gourmealWordmark.width, wordmarkWidth / gourmealWordmark.width);
  context.fillStyle = stone;
  context.fill(new Path2D(gourmealWordmark.path), "evenodd");
  context.restore();

  text(location, 132, 17, 600, stone);
  text("Scan to join", 218, 28, 700, green);
  context.fillStyle = sand;
  context.beginPath();
  context.roundRect(79, 247, 262, 262, 27);
  context.fill();
  context.fillStyle = "#FFFFFF";
  context.beginPath();
  context.roundRect(89, 257, 242, 242, 19);
  context.fill();

  text(progress, 548, 22, 700, green);
  text(reward, 579, 18, 500, green);
  context.fillStyle = green;
  context.fillRect(0, 638, 420, 82);
  drawJoinPosterCredit(context, 210, 669, stone, stone);
}
