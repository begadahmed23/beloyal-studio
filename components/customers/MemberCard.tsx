"use client";
import { getReadableText } from "@/app/card/[token]/card-theme-utils";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";

import { useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Coffee,
  Store,
  Copy,
  ExternalLink,
  Gift,
  Link2,
  Pencil,
  Phone,
  Scissors,
  Share2,
  Trash2,
  X,
  TriangleAlert,
} from "lucide-react";

import { ActionButton } from "@/components/ui/action-button";
import MbVapeStamp from "@/components/brand/MbVapeStamp";
import PurchaseConfirmation from "@/components/dashboard/PurchaseConfirmation";
import { isSpendingTrackingEnabled } from "@/lib/business/spending-tracking";
import CustomerSpendingHistory from "./CustomerSpendingHistory";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { getLoyaltyProgressTarget } from "@/lib/business/loyalty-target";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import BirthdayRewardAction from "./BirthdayRewardAction";
import EditMemberDialog from "./EditMemberDialog";

type Customer = {
  id: string;
  memberNumber: string;
  publicToken: string | null;
  name: string;
  phone: string;
  birthday: string;
  stamps: number;
  rewardEarnedAt?: string | null;
  stampDates?: string[];
};

type StampResponse = {
  customer: Customer;
  stampCreatedAt: string;
  message: string;
};

type Props = {
  customer: Customer;
};

export default function MemberCard({
  customer: originalCustomer,
}: Props) {
  const { t, arabic } = useBeLoyalLanguage();
  const { theme, cafe } = useCafeTheme();
  const isBarbershop = cafe.businessType === "BARBERSHOP";
  const spendingEnabled = isSpendingTrackingEnabled(cafe);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const LoyaltyIcon = { CAFE: Coffee, BARBERSHOP: Scissors, VAPE: MbVapeStamp, OTHER: Store }[cafe.businessType];
  const personLabel = isBarbershop ? "client" : "member";
  const loyaltyUnit = isBarbershop ? "visit" : "stamp";

  const [customer, setCustomer] =
    useState<Customer>({
      ...originalCustomer,
      stampDates:
        originalCustomer.stampDates ?? [],
    });

  const [profileOpen, setProfileOpen] =
    useState(false);

  const [editOpen, setEditOpen] =
    useState(false);

  const [redeemOpen, setRedeemOpen] =
    useState(false);

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; title: string; text: string } | null>(null);

  const [pendingAction, setPendingAction] = useState<"stamp" | "redeem" | "delete" | null>(null);
  const requestInFlight = useRef(false);
  const loading = pendingAction !== null;

  const [stampFeedback, setStampFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const paidStampTarget = getLoyaltyProgressTarget(cafe);

  const rewardReady =
    Boolean(customer.rewardEarnedAt) ||
    customer.stamps >= paidStampTarget;

  const visibleStamps = rewardReady
    ? paidStampTarget
    : Math.min(
        customer.stamps,
        paidStampTarget,
      );

  const cardGlowsGreen = rewardReady;

  const formattedBirthday = useMemo(() => {
    const date = new Date(
      customer.birthday,
    );

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return new Intl.DateTimeFormat(
      "en-GB",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      },
    ).format(date);
  }, [customer.birthday]);

  function showMessage(type: "success" | "error", title: string, text: string) {
    setMessage({ type, title, text });
  }

  function notifyDashboard() {
    window.dispatchEvent(
      new Event("members-updated"),
    );
  }

  function getCardUrl() {
    if (!customer.publicToken) {
      return null;
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://getbeloyal.app";

    return `${baseUrl}/card/${customer.publicToken}`;
  }

  function openCard() {
    const cardUrl = getCardUrl();

    if (!cardUrl) {
      showMessage(
        "error",
        "Card unavailable",
        `This ${personLabel} does not have a secure card token yet.`,
      );

      return;
    }

    window.open(
      cardUrl,
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function copyCardLink() {
    const cardUrl = getCardUrl();

    if (!cardUrl) {
      showMessage(
        "error",
        "Card unavailable",
        `This ${personLabel} does not have a secure card token yet.`,
      );

      return;
    }

    try {
      await navigator.clipboard.writeText(
        cardUrl,
      );

      showMessage(
        "success",
        "Link copied",
        `The ${personLabel} card link is ready to paste.`,
      );
    } catch (error) {
      console.error(error);

      showMessage(
        "error",
        "Copy failed",
        "The browser could not copy the card link.",
      );
    }
  }

  async function shareCard() {
    const cardUrl = getCardUrl();

    if (!cardUrl) {
      showMessage(
        "error",
        "Card unavailable",
        `This ${personLabel} does not have a secure card token yet.`,
      );

      return;
    }

    const text = arabic
      ? `أهلاً يا ${customer.name} في ${cafe.name}. ده كارت الولاء بتاعك.`
      : `Welcome to ${cafe.name}, ${customer.name}. Here is your digital loyalty card.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${cafe.name} — ${t("Loyalty card")}`,
          text,
          url: cardUrl,
        });

        return;
      }

      await navigator.clipboard.writeText(
        `${text}\n${cardUrl}`,
      );

      showMessage(
        "success",
        "Message copied",
        "Native sharing is unavailable, so the message and link were copied.",
      );
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(error);

      showMessage(
        "error",
        "Share failed",
        `The browser could not share the ${personLabel} card.`,
      );
    }
  }

  async function addStamp(amount: number | null = null) {
    if (requestInFlight.current || rewardReady) {
      return;
    }

    requestInFlight.current = true;
    setPendingAction("stamp");

    try {
      setStampFeedback(null);

      const response = await fetch(
        "/api/customers/stamp",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: customer.id,
            ...(spendingEnabled ? { purchaseAmount: amount } : {}),
          }),
        },
      );

      const responseText =
        await response.text();

      let data:
        | StampResponse
        | { message?: string };

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          "The server returned an invalid response.",
        );
      }

      if (!response.ok) {
        throw new Error(
          "message" in data &&
          data.message
            ? data.message
            : `Failed to record ${loyaltyUnit}.`,
        );
      }

      const stampData =
        data as StampResponse;

      setCustomer({
        ...stampData.customer,
        stampDates: [
          ...(customer.stampDates ?? []),
          stampData.stampCreatedAt,
        ],
      });

      notifyDashboard();

      setStampFeedback({
        type: "success",
        text: isBarbershop ? "Visit recorded." : "Stamp added.",
      });
    } catch (error) {
      console.error(error);

      setStampFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Something went wrong.",
      });
    } finally {
      requestInFlight.current = false;
      setPendingAction(null);
    }
  }

  async function redeemReward() {
    if (requestInFlight.current || !rewardReady) {
      return;
    }

    requestInFlight.current = true;
    setPendingAction("redeem");

    try {

      const response = await fetch(
        "/api/customers/redeem",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            id: customer.id,
          }),
        },
      );

      const responseText =
        await response.text();

      let data:
        | Customer
        | { message?: string };

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        throw new Error(
          "The server returned an invalid response.",
        );
      }

      if (!response.ok) {
        throw new Error(
          "message" in data &&
          data.message
            ? data.message
            : "Failed to redeem reward.",
        );
      }

      setCustomer({
        ...(data as Customer),
        stampDates: [],
      });

      setRedeemOpen(false);

      notifyDashboard();

      showMessage(
        "success",
        "Reward redeemed",
        arabic ? `تم صرف مكافأة ${cafe.rewardName}.` : `${cafe.rewardName} was redeemed successfully.`,
      );
    } catch (error) {
      console.error(error);

      showMessage(
        "error",
        "Could not redeem reward",
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      requestInFlight.current = false;
      setPendingAction(null);
    }
  }

  async function deleteMember() {
    if (requestInFlight.current) {
      return;
    }

    requestInFlight.current = true;
    setPendingAction("delete");

    try {

      const response = await fetch(
        `/api/customers/${customer.id}`,
        {
          method: "DELETE",
        },
      );

      const responseText =
        await response.text();

      let data: {
        message?: string;
      } = {};

      if (responseText) {
        try {
          data = JSON.parse(
            responseText,
          );
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Failed to delete ${personLabel}.`,
        );
      }

      setDeleteOpen(false);
      setProfileOpen(false);

      notifyDashboard();
    } catch (error) {
      console.error(error);

      showMessage(
        "error",
        "Delete failed",
        error instanceof Error
          ? error.message
          : "Something went wrong.",
      );
    } finally {
      requestInFlight.current = false;
      setPendingAction(null);
    }
  }

  function handleMemberUpdated(
    updatedCustomer: Customer,
  ) {
    setCustomer({
      ...updatedCustomer,
      stampDates:
        customer.stampDates ?? [],
    });

    notifyDashboard();

    showMessage(
      "success",
      isBarbershop ? "Client updated" : "Member updated",
      `The ${personLabel} details were saved successfully.`,
    );
  }

  function openEditDialog() {
    setProfileOpen(false);

    window.setTimeout(() => {
      setEditOpen(true);
    }, 150);
  }

  const standardButtonStyle = {
    borderColor: theme.border,
    backgroundColor:
      theme.surfaceRaised,
    color: theme.textPrimary,
    borderRadius:
      theme.radiusMedium,
  };

  return (
    <>
      {spendingEnabled && <Dialog open={purchaseOpen} onOpenChange={setPurchaseOpen}><DialogContent><DialogTitle>Stamp confirmation</DialogTitle><PurchaseConfirmation submitting={pendingAction === "stamp"} onCancel={() => setPurchaseOpen(false)} onConfirm={amount => { setPurchaseOpen(false); void addStamp(amount); }} /></DialogContent></Dialog>}
      <button
        type="button"
        onClick={() => {
          setStampFeedback(null);
          setProfileOpen(true);
        }}
        className="group w-full border p-5 text-left transition duration-200 pointer-fine:motion-safe:hover:-translate-y-0.5 hover:brightness-105"
        style={{
          borderColor: cardGlowsGreen
            ? `${theme.success}90`
            : theme.border,
          backgroundColor:
            cardGlowsGreen
              ? `${theme.success}12`
              : theme.surface,
          color: theme.textPrimary,
          borderRadius:
            theme.radiusMedium,
          boxShadow: cardGlowsGreen
            ? `0 0 0 1px ${theme.success}35, 0 0 24px ${theme.success}30`
            : theme.cardShadow,
        }}
      >
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">

            <h4
              className="truncate text-lg font-semibold tracking-tight"
              style={{
                color:
                  theme.textPrimary,
              }}
            >
              {customer.name}
            </h4>

            <div
              className="mt-2 flex items-center gap-2 text-sm"
              style={{
                color:
                  theme.textMuted,
              }}
            >
              <Phone size={14} />
              <span>
                {customer.phone}
              </span>
            </div>
          </div>

          <div
            className="shrink-0 border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor:
                cardGlowsGreen
                  ? `${theme.success}65`
                  : theme.border,
              backgroundColor:
                cardGlowsGreen
                  ? `${theme.success}18`
                  : theme.accentSoft,
              color:
                cardGlowsGreen
                  ? theme.success
                  : theme.textSecondary,
              borderRadius: "999px",
            }}
          >
            {rewardReady
              ? t("Reward available")
              : `${visibleStamps}/${paidStampTarget}`}
          </div>
        </div>

        <div
          className="mt-5 grid gap-1.5"
          style={{
            gridTemplateColumns:
              `repeat(${paidStampTarget}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({
            length: paidStampTarget,
          }).map((_, index) => {
            const filled =
              index < visibleStamps;

            return (
              <div
                key={index}
                className={`flex items-center justify-center border ${
                  isBarbershop ? "h-16" : "aspect-square"
                }`}
                style={{
                  borderColor:
                    filled
                      ? `${theme.accent}70`
                      : theme.border,
                  backgroundColor:
                    filled
                      ? theme.accentSoft
                      : theme.surfaceRaised,
                  borderRadius:
                    "10px",
                }}
              >
                <LoyaltyIcon
                  size={15}
                  style={{
                    color: filled
                      ? theme.accent
                      : theme.textMuted,
                    fill: filled
                      ? theme.accent
                      : "transparent",
                  }}
                />
              </div>
            );
          })}
        </div>
      </button>

      <Dialog
        open={profileOpen}
        onOpenChange={
          setProfileOpen
        }
      >
        <DialogContent
          showCloseButton={false}
          className="fixed bottom-2 left-2 top-auto z-50 flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-[28px] border p-0 shadow-[0_28px_90px_rgba(0,0,0,0.34)] sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[90vh] sm:w-[calc(100%-2rem)] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2"
          style={{
            borderColor: theme.border,
            backgroundColor:
              theme.surface,
            color: theme.textPrimary,
          }}
        >
          <div
            className="relative shrink-0 px-4 pb-4 pt-3 sm:px-6 sm:pb-5 sm:pt-5"
            style={{
              background: `linear-gradient(145deg, ${theme.accentSoft}, ${theme.surface} 72%)`,
            }}
          >
            <div
              className="mx-auto mb-3 h-1 w-9 rounded-full opacity-70 sm:hidden"
              style={{ backgroundColor: theme.textMuted }}
            />

            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold uppercase"
                  style={{
                    backgroundColor: theme.accent,
                    color: theme.buttonText,
                    boxShadow: `0 10px 24px ${theme.accent}28`,
                  }}
                >
                  {customer.name.trim().charAt(0) || "?"}
                </div>

                <div className="min-w-0">
                  <DialogTitle
                    className="truncate text-xl font-semibold leading-tight tracking-[-0.025em] sm:text-2xl"
                    style={{ color: theme.textPrimary }}
                  >
                    {customer.name}
                  </DialogTitle>

                  <div
                    className="mt-1.5 flex items-center gap-1.5 text-xs font-medium"
                    style={{ color: theme.textMuted }}
                  >
                    <span style={{ color: rewardReady ? theme.success : theme.textSecondary }}>
                      {rewardReady ? t("Reward ready") : `${visibleStamps}/${paidStampTarget} ${loyaltyUnit}s`}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setProfileOpen(false)}
                aria-label={t("Close customer details")}
                className="flex h-9 w-9 shrink-0 touch-manipulation items-center justify-center rounded-full border transition duration-150 active:opacity-80 hover:opacity-80"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.surface,
                  color: theme.textSecondary,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={openEditDialog}
                className="flex h-10 flex-1 touch-manipulation items-center justify-center gap-2 border text-sm font-semibold transition duration-150 active:opacity-80 hover:opacity-90"
                style={{
                  borderColor: `${theme.accent}45`,
                  backgroundColor: theme.accentSoft,
                  color: theme.accent,
                  borderRadius: theme.radiusMedium,
                }}
              >
                <Pencil size={15} />
                {t("Edit details")}
              </button>

              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                aria-label={`Delete ${personLabel}`}
                className="flex h-10 w-10 shrink-0 touch-manipulation items-center justify-center border transition duration-150 active:opacity-80 hover:opacity-80"
                style={{
                  borderColor: `${theme.danger}35`,
                  backgroundColor: `${theme.danger}0D`,
                  color: theme.danger,
                  borderRadius: theme.radiusMedium,
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 sm:px-6 sm:pb-6">
            {spendingEnabled && <CustomerSpendingHistory customerId={customer.id} active={profileOpen} />}
            <div
              className="overflow-hidden border"
              style={{
                borderColor: theme.border,
                backgroundColor: theme.surfaceRaised,
                borderRadius: theme.radiusMedium,
              }}
            >
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: theme.accentSoft,
                    color: theme.accent,
                  }}
                >
                  <Phone size={14} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium" style={{ color: theme.textMuted }}>{t("Phone number")}</p>
                  <p className="mt-0.5 break-all text-sm font-medium" style={{ color: theme.textPrimary }}>
                    {customer.phone}
                  </p>
                </div>
              </div>

              <div className="mx-4 h-px" style={{ backgroundColor: theme.border }} />

              <div className="flex items-center gap-3 px-4 py-3.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: theme.accentSoft,
                    color: theme.accent,
                  }}
                >
                  <CalendarDays size={14} />
                </div>
                <div>
                  <p className="text-[11px] font-medium" style={{ color: theme.textMuted }}>{t("Birthday")}</p>
                  <p className="mt-0.5 text-sm font-medium" style={{ color: theme.textPrimary }}>
                    {formattedBirthday}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="border p-5"
              style={{
                borderColor:
                  theme.border,
                backgroundColor:
                  theme.surfaceRaised,
                borderRadius:
                  theme.radiusMedium,
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color:
                        theme.textPrimary,
                    }}
                  >
                    {isBarbershop
                      ? "Digital visit card"
                      : "Digital stamp card"}
                  </p>

                  <p
                    className="mt-1 text-xs"
                    style={{
                      color:
                        theme.textMuted,
                    }}
                  >
                    {cafe.eligiblePurchaseDescription ||
                      (isBarbershop
                        ? "One visit for every eligible service"
                        : "One stamp for every eligible purchase")}
                  </p>
                </div>

                <p
                  className="text-sm font-semibold"
                  style={{
                    color:
                      rewardReady
                        ? theme.success
                        : theme.textSecondary,
                  }}
                >
                  {rewardReady
                    ? t("Reward ready")
                    : `${visibleStamps}/${paidStampTarget}`}
                </p>
              </div>

              <div
                className="mt-5 grid gap-2 overflow-x-auto pb-1"
                style={{
                  gridTemplateColumns:
                    `repeat(${paidStampTarget}, minmax(44px, 1fr))`,
                }}
              >
                {Array.from({
                  length:
                    paidStampTarget,
                }).map(
                  (_, index) => {
                    const filled =
                      index <
                      visibleStamps;

                    const stampDate =
                      customer
                        .stampDates?.[
                        index
                      ];

                    const stampMoment =
                      filled && stampDate
                        ? new Date(stampDate)
                        : null;

                    const hasValidStampMoment =
                      stampMoment !== null &&
                      !Number.isNaN(
                        stampMoment.getTime(),
                      );

                    const formattedStampDate =
                      hasValidStampMoment
                        ? new Intl.DateTimeFormat(
                            "en-GB",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              timeZone: cafe.timezone,
                            },
                          ).format(stampMoment!)
                        : "—";

                    const formattedStampTime =
                      hasValidStampMoment
                        ? new Intl.DateTimeFormat(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                              timeZone: cafe.timezone,
                            },
                          ).format(stampMoment!)
                        : "—";

                    return (
                      <div
                        key={index}
                        className="min-w-0 text-center"
                      >
                        <div
                          className={`flex items-center justify-center border ${
                            isBarbershop ? "h-20" : "aspect-square"
                          }`}
                          style={{
                            borderColor:
                              filled
                                ? `${theme.accent}70`
                                : theme.border,
                            backgroundColor:
                              filled
                                ? theme.accentSoft
                                : theme.surface,
                            borderRadius:
                              "12px",
                          }}
                        >
                          <LoyaltyIcon
                            size={20}
                            style={{
                              color:
                                filled
                                  ? theme.accent
                                  : theme.textMuted,
                              fill:
                                isBarbershop || !filled
                                  ? "transparent"
                                  : theme.accent,
                            }}
                          />
                        </div>

                        <div
                          className="mt-1.5 min-h-8 text-[10px] font-medium leading-3.5"
                          style={{
                            color:
                              filled
                                ? theme.textMuted
                                : "transparent",
                          }}
                        >
                          <p>{formattedStampDate}</p>
                          <p className="mt-0.5 opacity-80">
                            {formattedStampTime}
                          </p>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </div>

            <div>
              <p
                className="mb-3 text-xs font-medium uppercase tracking-[0.14em]"
                style={{
                  color:
                    theme.textMuted,
                }}
              >
                {isBarbershop ? "Client card" : t("Customer card")}
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={openCard}
                  disabled={
                    !customer.publicToken
                  }
                  className="flex h-11 items-center justify-center gap-2 border text-xs font-semibold transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  style={
                    standardButtonStyle
                  }
                >
                  <ExternalLink
                    size={15}
                  />
                  Open
                </button>

                <button
                  type="button"
                  onClick={
                    copyCardLink
                  }
                  disabled={
                    !customer.publicToken
                  }
                  className="flex h-11 items-center justify-center gap-2 border text-xs font-semibold transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  style={
                    standardButtonStyle
                  }
                >
                  <Copy size={15} />
                  Copy
                </button>

                <button
                  type="button"
                  onClick={shareCard}
                  disabled={
                    !customer.publicToken
                  }
                  className="flex h-11 items-center justify-center gap-2 border text-xs font-semibold transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    borderColor:
                      `${theme.accent}60`,
                    backgroundColor:
                      theme.accentSoft,
                    color:
                      theme.textSecondary,
                    borderRadius:
                      theme.radiusMedium,
                  }}
                >
                  <Share2 size={15} />
                  Share
                </button>
              </div>

              {!customer.publicToken && (
                <div
                  className="mt-3 flex items-center gap-2 border px-3 py-2 text-xs"
                  style={{
                    borderColor:
                      `${theme.warning}45`,
                    backgroundColor:
                      `${theme.warning}12`,
                    color:
                      theme.warning,
                    borderRadius:
                      theme.radiusMedium,
                  }}
                >
                  <Link2 size={14} />
                  This {personLabel} needs a
                  secure card token.
                </div>
              )}
            </div>

            <BirthdayRewardAction
              customerId={customer.id}
              active={profileOpen}
              onRedeemed={notifyDashboard}
            />

          </div>

          <div
            className="shrink-0 border-t px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] sm:px-6"
            style={{ borderColor: theme.border }}
          >
            <ActionButton
              onClick={rewardReady ? () => setRedeemOpen(true) : spendingEnabled ? () => setPurchaseOpen(true) : () => void addStamp()}
              disabled={loading}
              pending={pendingAction === "stamp"}
              icon={rewardReady ? <Gift size={18} /> : stampFeedback?.type === "success" ? <CheckCircle2 size={18} /> : <LoyaltyIcon size={18} />}
              className="flex min-h-12 w-full items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold pointer-fine:hover:opacity-90 active:opacity-80 disabled:opacity-75"
              style={{
                backgroundColor: rewardReady ? theme.success : theme.accent,
                color: rewardReady ? getReadableText(theme.success) : theme.buttonText,
                borderRadius: theme.radiusMedium,
              }}
            >
              {rewardReady ? `Redeem ${cafe.rewardName}` : isBarbershop ? t("Record Visit") : t("Add Stamp")}
            </ActionButton>
            <p
              role="status"
              className="mt-1.5 h-8 overflow-y-auto text-xs leading-4"
              style={{
                color: stampFeedback?.type === "error" ? theme.danger : stampFeedback?.type === "success" ? theme.success : theme.textSecondary,
              }}
            >
              {pendingAction === "stamp"
                ? (isBarbershop ? t("Recording visit…") : t("Adding stamp…"))
                : stampFeedback && t(stampFeedback.text)}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {editOpen && (
        <EditMemberDialog customer={customer} onOpenChange={setEditOpen} onUpdated={handleMemberUpdated} />
      )}

      <AlertDialog
        open={redeemOpen}
        onOpenChange={
          setRedeemOpen
        }
      >
        <AlertDialogContent
          className="border"
          style={{
            borderColor: theme.border,
            backgroundColor:
              theme.surface,
            color: theme.textPrimary,
            borderRadius:
              theme.radiusLarge,
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Redeem")}{" "}
              {cafe.rewardName}?
            </AlertDialogTitle>

            <AlertDialogDescription
              style={{
                color:
                  theme.textMuted,
              }}
            >
              This will reset the
              completed card for{" "}
              {customer.name} to 0/
              {paidStampTarget}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="border hover:opacity-80"
              style={
                standardButtonStyle
              }
            >{t("Cancel")}</AlertDialogCancel>

            <AlertDialogAction
              onClick={redeemReward}
              className="hover:opacity-90"
              style={{
                backgroundColor:
                  theme.success,
                color: getReadableText(theme.success),
              }}
            >
              {loading
                ? "Redeeming..."
                : "Confirm Redemption"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={
          setDeleteOpen
        }
      >
        <AlertDialogContent
          className="border"
          style={{
            borderColor: theme.border,
            backgroundColor:
              theme.surface,
            color: theme.textPrimary,
            borderRadius:
              theme.radiusLarge,
          }}
        >
          <AlertDialogHeader>
            <div
              className="mb-2 flex h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  `${theme.danger}18`,
                color:
                  theme.danger,
              }}
            >
              <Trash2 size={22} />
            </div>

            <AlertDialogTitle>
              Delete {personLabel}?
            </AlertDialogTitle>

            <AlertDialogDescription
              style={{
                color:
                  theme.textMuted,
              }}
            >
              This permanently deletes{" "}
              <strong
                style={{
                  color:
                    theme.textPrimary,
                }}
              >
                {customer.name}
              </strong>
              , their digital loyalty
              card, and their complete{" "}
              {isBarbershop ? "visit" : "stamp"} history. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="border hover:opacity-80"
              style={
                standardButtonStyle
              }
            >{t("Cancel")}</AlertDialogCancel>

            <AlertDialogAction
              onClick={
                deleteMember
              }
              className="text-white hover:opacity-90"
              style={{
                backgroundColor:
                  theme.danger,
              }}
            >
              {loading
                ? "Deleting..."
                : `Delete ${isBarbershop ? "Client" : "Member"}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={message !== null}
        onOpenChange={(open) => { if (!open) setMessage(null); }}
      >
        <AlertDialogContent
          className="border"
          style={{
            borderColor: theme.border,
            backgroundColor:
              theme.surface,
            color: theme.textPrimary,
            borderRadius:
              theme.radiusLarge,
          }}
        >
          <AlertDialogHeader>
            <div
              className="mb-2 flex h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor:
                  `${message?.type === "error" ? theme.danger : theme.success}18`,
                color:
                  message?.type === "error" ? theme.danger : theme.success,
              }}
            >
              {message?.type === "error" ? <TriangleAlert size={22} aria-hidden /> : <CheckCircle2 size={22} aria-hidden />}
            </div>

            <AlertDialogTitle>
              {t(message?.title ?? "")}
            </AlertDialogTitle>

            <AlertDialogDescription
              style={{
                color:
                  theme.textMuted,
              }}
            >
              {t(message?.text ?? "")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() =>
                setMessage(null)
              }
              className="hover:opacity-90"
              style={{
                backgroundColor:
                  theme.accent,
                color:
                  theme.buttonText,
              }}
            >{t("Close")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
