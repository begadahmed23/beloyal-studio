import sharp from "sharp";
import { businessCardArtwork, isArtworkBusinessType } from "@/lib/business/card-artwork";
import { getBusinessBrandColors, getDefaultBusinessTheme } from "@/lib/cafe-theme";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ businessType: string }> }) {
  const { businessType } = await params;
  if (!isArtworkBusinessType(businessType)) return new Response(null, { status: 404 });

  const colors = new URL(request.url).searchParams;
  const [primary, secondary, background] = getBusinessBrandColors(getDefaultBusinessTheme(businessType), businessType, {
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
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
