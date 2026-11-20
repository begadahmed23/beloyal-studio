import type { BusinessType } from "@prisma/client";

export const MB_VAPE_ARTWORK_PATH = "/api/wallet/artwork/mb-vape";
export const MB_VAPE_LOGO_URL = MB_VAPE_ARTWORK_PATH + "?asset=logo&v=2";
export const MB_VAPE_WALNUT = "#6A4937";
export const MB_VAPE_IVORY = "#F7F2E9";
export const MB_VAPE_WOOD_BACKGROUND = "repeating-linear-gradient(90deg, #25170e38 0 1px, transparent 1px 6px, #ffffff28 7px 8px, transparent 8px 23px), linear-gradient(125deg, #94694D, #6A4937 64%, #40291E)";
export const MB_VAPE_STAMP_PATH = "M10 6V3h4v3m-5 0h6a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Zm3 5v3";

export function isMbVape(business: { slug: string; businessType: BusinessType }) {
  return business.slug === "mb-vape" && business.businessType === "VAPE";
}

export function walletBusinessName(business: Parameters<typeof isMbVape>[0] & { name: string }) {
  return isMbVape(business) ? "MB Store" : business.name;
}

type BrandColors = {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  backgroundColor?: string | null;
};

export function getMbVapeBrandColors<T extends BrandColors & { slug: string; businessType: BusinessType; theme: string }>(business: T): T {
  const warmSand = business.theme === "COFFEE_CLASSIC"
    && business.primaryColor?.toLowerCase() === "#7b4f35"
    && business.secondaryColor?.toLowerCase() === "#6f4a35"
    && business.backgroundColor?.toLowerCase() === "#f3ede5";
  if (business.businessType !== "VAPE" || (isMbVape(business) && !warmSand)) return business;

  return { ...business, theme: isMbVape(business) ? business.theme : "MODERN_MINIMAL", primaryColor: MB_VAPE_WALNUT, secondaryColor: "#A47B60", backgroundColor: MB_VAPE_IVORY };
}
