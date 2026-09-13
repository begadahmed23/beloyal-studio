export type SubscriptionStatus =
  | "TRIAL"
  | "ACTIVE"
  | "PAST_DUE"
  | "SUSPENDED"
  | "CANCELLED";

export type SubscriptionDraft = {
  subscriptionStatus: SubscriptionStatus;
  monthlyPrice: string;
  isActive: boolean;

  trialStartedAt: string;
  trialEndsAt: string;

  subscriptionStartedAt: string;
  subscriptionEndsAt: string;

  lastPaymentAt: string;

  paymentAmount: string;
  recordPayment: boolean;
};

export type SubscriptionChangeHandler = (
  patch: Partial<SubscriptionDraft>
) => void;