export const dashboardSettingsSections = {
  general: ["name", "logoUrl"],
  branding: ["theme"],
  loyalty: ["rewardTarget", "rewardName", "rewardDescription", "eligiblePurchaseDescription", "minimumPurchaseAmount"],
  feedback: ["feedbackEnabled", "feedbackRewardEnabled"],
  reviews: ["googleReviewUrl"],
} as const;

export type DashboardSettingsSection = keyof typeof dashboardSettingsSections;
