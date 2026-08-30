import { NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/require-auth";

const MAX_REQUEST_BODY_BYTES = 4_000;

const birthdaySettingsSchema = z
  .object({
    enabled: z.boolean(),
    rewardName: z.string().trim().max(80),
    rewardDescription: z.string().trim().max(300),
    purchaseRequirement: z.string().trim().max(300),
    validityDays: z.number().int().min(1).max(7),
    reminderEnabled: z.boolean(),
    reminderDaysBefore: z.number().int().min(1).max(30),
    birthdayDayMessageEnabled: z.boolean(),
    friendDiscountEnabled: z.boolean(),
    oneFriendDiscount: z.number().int().min(0).max(100),
    groupDiscount: z.number().int().min(0).max(100),
    timezone: z.string().trim().min(1).max(100),
  })
  .superRefine((value, ctx) => {
    if (value.enabled && !value.rewardName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rewardName"],
        message: "Birthday reward name is required when the feature is enabled.",
      });
    }

    if (
      value.friendDiscountEnabled &&
      value.groupDiscount < value.oneFriendDiscount
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["groupDiscount"],
        message:
          "The 2+ friends discount cannot be lower than the 1 friend discount.",
      });
    }

    try {
      new Intl.DateTimeFormat("en", {
        timeZone: value.timezone,
      }).format();
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["timezone"],
        message: "Please enter a valid timezone.",
      });
    }
  });

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      Pragma: "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function optionalText(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function serializeSettings(cafe: {
  birthdayRewardsEnabled: boolean;
  birthdayRewardName: string | null;
  birthdayRewardDescription: string | null;
  birthdayPurchaseRequirement: string | null;
  birthdayValidityDays: number;
  birthdayReminderEnabled: boolean;
  birthdayReminderDaysBefore: number;
  birthdayDayMessageEnabled: boolean;
  birthdayFriendDiscountEnabled: boolean;
  birthdayOneFriendDiscount: number;
  birthdayGroupDiscount: number;
  timezone: string;
}) {
  return {
    enabled: cafe.birthdayRewardsEnabled,
    rewardName: cafe.birthdayRewardName ?? "",
    rewardDescription: cafe.birthdayRewardDescription ?? "",
    purchaseRequirement: cafe.birthdayPurchaseRequirement ?? "",
    validityDays: cafe.birthdayValidityDays,
    reminderEnabled: cafe.birthdayReminderEnabled,
    reminderDaysBefore: cafe.birthdayReminderDaysBefore,
    birthdayDayMessageEnabled: cafe.birthdayDayMessageEnabled,
    friendDiscountEnabled: cafe.birthdayFriendDiscountEnabled,
    oneFriendDiscount: cafe.birthdayOneFriendDiscount,
    groupDiscount: cafe.birthdayGroupDiscount,
    timezone: cafe.timezone,
  };
}

async function getAuthorizedCafe(request: NextRequest) {
  const authData = await requireAuth(request.headers);

  if (!authData || authData.isSuperAdmin || !authData.cafeId) {
    return null;
  }

  return authData;
}

export async function GET(request: NextRequest) {
  try {
    const authData = await getAuthorizedCafe(request);

    if (!authData) {
      return jsonResponse(
        { message: "You are not authorized to access birthday settings." },
        403,
      );
    }

    const cafe = await prisma.cafe.findUnique({
      where: { id: authData.cafeId },
      select: {
        birthdayRewardsEnabled: true,
        birthdayRewardName: true,
        birthdayRewardDescription: true,
        birthdayPurchaseRequirement: true,
        birthdayValidityDays: true,
        birthdayReminderEnabled: true,
        birthdayReminderDaysBefore: true,
        birthdayDayMessageEnabled: true,
        birthdayFriendDiscountEnabled: true,
        birthdayOneFriendDiscount: true,
        birthdayGroupDiscount: true,
        timezone: true,
      },
    });

    if (!cafe) {
      return jsonResponse(
        { message: "Business not found." },
        404,
      );
    }

    return jsonResponse({ settings: serializeSettings(cafe) });
  } catch (error) {
    console.error("GET birthday settings error:", error);

    return jsonResponse(
      { message: "Unable to load birthday settings." },
      500,
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authData = await getAuthorizedCafe(request);

    if (!authData) {
      return jsonResponse(
        { message: "You are not authorized to update birthday settings." },
        403,
      );
    }

    const declaredLength = Number(request.headers.get("content-length"));

    if (
      Number.isFinite(declaredLength) &&
      declaredLength > MAX_REQUEST_BODY_BYTES
    ) {
      return jsonResponse(
        { message: "Request body is too large." },
        413,
      );
    }

    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).length > MAX_REQUEST_BODY_BYTES) {
      return jsonResponse(
        { message: "Request body is too large." },
        413,
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(rawBody);
    } catch {
      return jsonResponse(
        { message: "Invalid JSON request." },
        400,
      );
    }

    const parsed = birthdaySettingsSchema.safeParse(body);

    if (!parsed.success) {
      return jsonResponse(
        {
          message:
            parsed.error.issues[0]?.message ??
            "Invalid birthday settings.",
        },
        400,
      );
    }

    const settings = parsed.data;

    const cafe = await prisma.cafe.update({
      where: { id: authData.cafeId },
      data: {
        birthdayRewardsEnabled: settings.enabled,
        birthdayRewardName: optionalText(settings.rewardName),
        birthdayRewardDescription: optionalText(
          settings.rewardDescription,
        ),
        birthdayPurchaseRequirement: optionalText(
          settings.purchaseRequirement,
        ),
        birthdayValidityDays: settings.validityDays,
        birthdayReminderEnabled: settings.reminderEnabled,
        birthdayReminderDaysBefore: settings.reminderDaysBefore,
        birthdayDayMessageEnabled:
          settings.birthdayDayMessageEnabled,
        birthdayFriendDiscountEnabled:
          settings.friendDiscountEnabled,
        birthdayOneFriendDiscount: settings.oneFriendDiscount,
        birthdayGroupDiscount: settings.groupDiscount,
        timezone: settings.timezone,
      },
      select: {
        birthdayRewardsEnabled: true,
        birthdayRewardName: true,
        birthdayRewardDescription: true,
        birthdayPurchaseRequirement: true,
        birthdayValidityDays: true,
        birthdayReminderEnabled: true,
        birthdayReminderDaysBefore: true,
        birthdayDayMessageEnabled: true,
        birthdayFriendDiscountEnabled: true,
        birthdayOneFriendDiscount: true,
        birthdayGroupDiscount: true,
        timezone: true,
      },
    });

    return jsonResponse({
      message: "Birthday reward settings saved.",
      settings: serializeSettings(cafe),
    });
  } catch (error) {
    console.error("PATCH birthday settings error:", error);

    return jsonResponse(
      { message: "Unable to save birthday settings." },
      500,
    );
  }
}
