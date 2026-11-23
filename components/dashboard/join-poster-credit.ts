import { BELOYAL_DOMAIN } from "@/lib/business/provider";

export const JOIN_POSTER_CREDIT = {
  title: "Powered by",
  domain: BELOYAL_DOMAIN,
  titleSize: 16,
  titleWeight: 700,
  domainSize: 11,
  domainWeight: 600,
};

export function drawJoinPosterCredit(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  titleColor: string,
  domainColor: string,
) {
  context.save();
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = titleColor;
  context.font = `${JOIN_POSTER_CREDIT.titleWeight} ${JOIN_POSTER_CREDIT.titleSize}px Arial, sans-serif`;
  context.fillText(JOIN_POSTER_CREDIT.title, x, y);
  context.fillStyle = domainColor;
  context.font = `${JOIN_POSTER_CREDIT.domainWeight} ${JOIN_POSTER_CREDIT.domainSize}px Arial, sans-serif`;
  context.fillText(JOIN_POSTER_CREDIT.domain, x, y + 19);
  context.restore();
}
