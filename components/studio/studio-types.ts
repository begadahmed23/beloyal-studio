export type BusinessType = "CAFE" | "BARBERSHOP";

export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED";

export type AttentionReason =
  | "SUSPENDED"
  | "PAST_DUE"
  | "MISSING_OWNER"
  | "TRIAL_ENDING_SOON"
  | "NO_ACTIVITY_30D";

export type StudioBusiness = {
  id: string;
  name: string;
  slug: string;
  businessType: BusinessType;

  logoUrl: string | null;
  theme: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;

  rewardTarget: number;
  rewardName: string;

  subscriptionStatus: SubscriptionStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  subscriptionStartedAt: string | null;
  subscriptionEndsAt: string | null;

  lastPaymentAt: string | null;
  monthlyPrice: number;

  isActive: boolean;

  createdAt: string;
  updatedAt: string;

  newCustomersThisMonth: number;

  operations: {
    loyaltyEventsLast30Days: number;
    lastActivityAt: string | null;
    needsAttention: boolean;
    attentionReasons: AttentionReason[];
  };

  user: {
    id: string;
    name: string;
    email: string;
  } | null;

  _count: {
    customers: number;
    transactions: number;
  };
};

export type StudioSummary = {
  totalCafes: number;
  cafeCount: number;
  barbershopCount: number;

  activeCafes: number;
  trialCafes: number;
  suspendedCafes: number;
  pastDueCafes: number;

  totalMembers: number;
  newMembersThisMonth: number;
  activeMembersThisMonth: number;

  loyaltyEventsThisMonth: number;
  rewardsRedeemedThisMonth: number;
  activeBusinessesThisMonth: number;

  needsAttentionBusinesses: number;

  moneyCollectedThisMonth: number;

  /*
   * Temporary compatibility fields.
   * We can remove these once the old money logic is completely gone.
   */
  monthlyRevenue: number;
  expectedRevenue: number;
};

export type StudioApiResponse = {
  generatedAt: string;

  cafes: StudioBusiness[];

  summary: StudioSummary;
};
