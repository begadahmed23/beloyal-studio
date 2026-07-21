import { prisma } from "@/lib/prisma";
import { validateCafeSettings } from "./validation";

export async function updateCafeSettings(
  cafeId: string,
  body: Record<string, unknown>,
) {
  const settings = validateCafeSettings(body);

  const cafe = await prisma.cafe.update({
    where: {
      id: cafeId,
    },
    data: {
      name: settings.name,
      logoUrl: settings.logoUrl,
      theme: settings.theme,
        primaryColor: settings.primaryColor,
    secondaryColor: settings.secondaryColor,
    backgroundColor: settings.backgroundColor,
      rewardTarget: settings.rewardTarget,
      rewardName: settings.rewardName,
      rewardDescription: settings.rewardDescription,
      eligiblePurchaseDescription: settings.eligiblePurchaseDescription,

      minimumPurchaseAmount: settings.minimumPurchaseAmount,

      whatsappBusinessNumber: settings.whatsappBusinessNumber,
      whatsappEnabled: settings.whatsappEnabled,
    },
  });

  return cafe;
}
