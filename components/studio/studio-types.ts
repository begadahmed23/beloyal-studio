export type BusinessType = "CAFE" | "BARBERSHOP";

export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED";

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
  newMembersThisMonth: number;
  monthlyRevenue: number;
  expectedRevenue: number;
};

export type StudioApiResponse = {
  cafes: StudioBusiness[];
  summary: StudioSummary;
};
