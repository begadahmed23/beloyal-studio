import sharp from "sharp";
import { businessCardArtwork, isArtworkBusinessType } from "@/lib/business/card-artwork";
import { getBusinessBrandColors, getDefaultBusinessTheme } from "@/lib/cafe-theme";
import { renderMbVapeAppleStrip, renderMbVapeGoogleArtwork, renderMbVapeLogo } from "@/lib/wallet/mb-vape-artwork";

export const runtime = "nodejs";

const imageResponse = (png: Buffer) => new Response(new Uint8Array(png), {
  headers: {
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=3600, s-maxage=86400",
    "X-Content-Type-Options": "nosniff",
  },
});

export async function GET(request: Request, { params }: { params: Promise<{ businessType: string }> }) {
  const { businessType } = await params;
  const colors = new URL(request.url).searchParams;
  if (businessType === "mb-vape") {
    const asset = colors.get("asset");
    if (asset === "logo") return imageResponse(await renderMbVapeLogo(696, 485));
    if (asset === "icon") return imageResponse(await renderMbVapeLogo(720, 720, "#ffffff", 112));
    if (asset !== null && asset !== "strip") return new Response(null, { status: 404 });

    const targetText = colors.get("target") ?? "6";
    const stampsText = colors.get("stamps") ?? "0";
    const validCount = /^(?:0|[1-9][0-9]?)$/;
    const target = Number(targetText);
    const stamps = Number(stampsText);
    if (!validCount.test(targetText) || !validCount.test(stampsText) || target === 0 || stamps > target) {
      return new Response(null, { status: 400 });
    }
    const render = asset === "strip" ? renderMbVapeAppleStrip : renderMbVapeGoogleArtwork;
    return imageResponse(await render(stamps, target));
  }

  if (!isArtworkBusinessType(businessType)) return new Response(null, { status: 404 });
  const [primary, secondary, background] = getBusinessBrandColors(getDefaultBusinessTheme(businessType), {
    primaryColor: colors.get("primary") ? `#${colors.get("primary")}` : null,
    secondaryColor: colors.get("secondary") ? `#${colors.get("secondary")}` : null,
    backgroundColor: colors.get("background") ? `#${colors.get("background")}` : null,
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 375 125">
    <rect width="375" height="125" fill="${background}" />
    <rect width="375" height="125" fill="${secondary}" opacity=".12" />
    ${businessCardArtwork(businessType, primary, 0.8)}
    <rect x="22" y="29" width="59" height="3" rx="1.5" fill="${primary}" />
  </svg>`;
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return imageResponse(png);
}
