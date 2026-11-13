// Loretto-only pilot. Use immutable business IDs so a rename cannot enable access.
export const WALLET_CAMPAIGN_PILOT_CAFE_ID = "cmrnxo1gv0000w8ribn162ssp";
export function walletCampaignsEnabledForCafe(cafeId: string | null | undefined) {
  return cafeId === WALLET_CAMPAIGN_PILOT_CAFE_ID;
}
