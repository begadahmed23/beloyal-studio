import { requireAuth } from "@/lib/require-auth";

type AccessResult =
  | {
      allowed: true;
      authData: NonNullable<
        Awaited<ReturnType<typeof requireAuth>>
      >;
    }
  | {
      allowed: false;
      status: number;
      message: string;
    };

export async function requireActiveCafe(
  requestHeaders: Headers
): Promise<AccessResult> {
  const authData = await requireAuth(requestHeaders);

  if (!authData) {
    return {
      allowed: false,
      status: 401,
      message: "Unauthorized.",
    };
  }

  const cafe = authData.cafe;
  const now = new Date();

  if (!cafe.isActive) {
    return {
      allowed: false,
      status: 403,
      message:
        "This café account is suspended. Contact support.",
    };
  }

  if (cafe.subscriptionStatus === "TRIAL") {
    if (!cafe.trialEndsAt || cafe.trialEndsAt <= now) {
      return {
        allowed: false,
        status: 403,
        message:
          "Your 14-day trial has expired. Contact support to activate your subscription.",
      };
    }

    return {
      allowed: true,
      authData,
    };
  }

  if (cafe.subscriptionStatus === "ACTIVE") {
    if (
      !cafe.subscriptionEndsAt ||
      cafe.subscriptionEndsAt <= now
    ) {
      return {
        allowed: false,
        status: 403,
        message:
          "Your subscription has expired. Contact support to renew it.",
      };
    }

    return {
      allowed: true,
      authData,
    };
  }

  return {
    allowed: false,
    status: 403,
    message:
      "Your subscription is inactive. Contact support.",
  };
}