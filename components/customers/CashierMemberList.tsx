"use client";
import { useBeLoyalLanguage } from "@/components/language/LanguageToggle";

import {
  Cake,
  CheckCircle2,
  Gift,
  LoaderCircle,
   Search,
  Stamp,
  TriangleAlert,
 } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ActionButton } from "@/components/ui/action-button";
import BirthdayRewardAction from "@/components/customers/BirthdayRewardAction";
import MbVapeStamp from "@/components/brand/MbVapeStamp";
import KatoMark from "@/components/brand/KatoMark";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";
import { isSpendingTrackingEnabled } from "@/lib/business/spending-tracking";
import PurchaseConfirmation from "@/components/dashboard/PurchaseConfirmation";
import RewardCycleSpending from "@/components/customers/RewardCycleSpending";

type Member = {
  id: string;
  memberNumber: string;
  publicToken: string | null;
  name: string;
  instagram: string | null;
  stamps: number;
  stampDates: string[];
  rewardReady: boolean;
  birthdayNotice: string | null;
};

type CashierMembersResponse = {
  summary: {
    totalCustomers: number;
    newToday: number;
  };
  reward: {
    target: number;
    name: string;
  };
  members: Member[];
};

export default function CashierMemberList() {
  const { t } = useBeLoyalLanguage();
  const { theme, cafe } = useCafeTheme();
  const spendingEnabled = isSpendingTrackingEnabled(cafe);
  const [pendingMember, setPendingMember] = useState<Member | null>(null);
  const [pendingOperation, setPendingOperation] = useState<"stamp" | "redeem" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const isBarbershop =
    cafe.businessType === "BARBERSHOP";
  const normalizedCafeName = cafe.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isKato =
    cafe.slug.toLowerCase().includes("kato") ||
    normalizedCafeName.includes("kato");
  const StampIcon = cafe.businessType === "VAPE" ? MbVapeStamp : Stamp;
  const unit = isBarbershop ? "visit" : "stamp";

  const [data, setData] =
    useState<CashierMembersResponse | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requests = useRef(new Set<string>());
  const memberRead = useRef(0);
  const [actions, setActions] = useState<Record<string, {
    status: "pending" | "success" | "error";
    operation?: "stamp" | "redeem";
    text: string;
  }>>({});

  const loadMembers = useCallback(async (searchValue = "") => {
    const read = ++memberRead.current;
    try {
      setError("");

      const query = searchValue.trim();
      const response = await fetch(
        query
          ? `/api/cashier/members?search=${encodeURIComponent(query)}`
          : "/api/cashier/members",
        { cache: "no-store" },
      );

      const body = (await response.json()) as
        | CashierMembersResponse
        | { message?: string };

      if (!response.ok) {
        throw new Error(
          "message" in body && body.message
            ? body.message
            : "Failed to load members.",
        );
      }

      if (read === memberRead.current) setData(body as CashierMembersResponse);
    } catch (error) {
      if (read !== memberRead.current) return;
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load members.",
      );
    } finally {
      if (read === memberRead.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadMembers(search);
    }, search.trim() ? 250 : 0);

    function handleMembersUpdated() {
      void loadMembers(search);
    }

    window.addEventListener(
      "members-updated",
      handleMembersUpdated,
    );

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(
        "members-updated",
        handleMembersUpdated,
      );
    };
  }, [loadMembers, search]);

  const filteredMembers = data?.members ?? [];

  async function runAction(
    memberId: string,
    operation: "stamp" | "redeem",
    purchaseAmount?: number | null,
  ) {
    if (requests.current.has(memberId)) return;
    requests.current.add(memberId);

    setActions((previous) => ({
      ...previous,
      [memberId]: { status: "pending", operation, text: operation === "redeem" ? t("Redeeming reward…") : isBarbershop ? t("Recording visit…") : t("Adding stamp…") },
    }));

    try {
      const response = await fetch(`/api/customers/${operation}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: memberId,
          ...(operation === "stamp" && spendingEnabled ? { purchaseAmount: purchaseAmount ?? null } : {}),
        }),
      });

      const body = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          body.message || "Action failed.",
        );
      }

      await loadMembers(search);
      setPendingMember(null);
      setPendingOperation(null);
      setActions((previous) => ({
        ...previous,
        [memberId]: { status: "success", operation, text: body.message || (operation === "redeem" ? "Reward redeemed." : "Card updated.") },
      }));
    } catch (error) {
      setActions((previous) => ({
        ...previous,
        [memberId]: { status: "error", text: error instanceof Error ? error.message : t("Could not update the card. Try again.") },
      }));
    } finally {
      requests.current.delete(memberId);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-52 items-center justify-center">
        <LoaderCircle
          size={28}
          className="animate-spin"
          style={{ color: theme.accent }}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="rounded-[24px] border p-7 text-center"
        style={{
          borderColor: `${theme.danger}40`,
          backgroundColor: `${theme.danger}10`,
        }}
      >
        <TriangleAlert
          className="mx-auto"
          size={26}
          style={{ color: theme.danger }}
        />
        <p className="mt-3 text-sm">
          {t(error || "Members could not load.")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div
          role="status"
          className="rounded-[18px] border px-4 py-3 text-sm"
          style={{
            borderColor: `${theme.danger}45`,
            backgroundColor: `${theme.danger}10`,
            color: theme.danger,
          }}
        >
          {t(error)}
        </div>
      )}

      <div
        className="flex h-12 items-center border px-4"
        style={{
          borderColor: theme.inputBorder,
          backgroundColor: theme.inputBackground,
          borderRadius: theme.radiusMedium,
        }}
      >
        <Search
          size={17}
          className="mr-3 shrink-0"
          style={{ color: theme.textMuted }}
        />

        <input
          type="search"
          name="beloyal-cashier-customer-query"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          enterKeyHint="search"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder={t("Search name, phone, Instagram, or member number")}
          className="w-full bg-transparent text-base outline-none sm:text-sm"
          style={{ color: theme.textPrimary }}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filteredMembers.map((member) => {
          const action = actions[member.id];
          const busy = action?.status === "pending";

          return (
            <div
              key={member.id}
              className="rounded-[22px] border p-5"
              style={{
                borderColor: member.rewardReady
                  ? `${theme.success}65`
                  : theme.border,
                backgroundColor: theme.surface,
                boxShadow: theme.cardShadow,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">
                    {isKato
                      ? member.name.trim().charAt(0).toUpperCase() +
                        member.name.trim().slice(1)
                      : member.name}
                  </p>

                  <p
                    className="mt-1 text-sm"
                    style={{ color: theme.textMuted }}
                  >
                    {member.stamps} / {data.reward.target}{" "}
                    {isBarbershop ? "visits" : "stamps"}
                  </p>
                </div>

                {member.rewardReady && (
                  <div
                    className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      backgroundColor: `${theme.success}15`,
                      color: theme.success,
                    }}
                  >
                    <Gift size={12} />{t("Reward ready")}</div>
                )}
              </div>

              {member.birthdayNotice && (
                <div className="mt-4 space-y-3">
                  <div
                    className="flex items-center gap-2 rounded-[14px] border px-3 py-2 text-xs font-semibold"
                    style={{
                      borderColor: `${theme.accent}45`,
                      backgroundColor: theme.accentSoft,
                      color: theme.accent,
                    }}
                  >
                    <Cake size={14} />
                    {member.birthdayNotice}
                  </div>

                  <BirthdayRewardAction
                    customerId={member.id}
                    active
                    onRedeemed={() => void loadMembers(search)}
                  />
                </div>
              )}

              <div
                className={
                  isKato
                    ? "mt-5 grid gap-1 overflow-x-auto pb-1"
                    : "mt-5 grid gap-2 overflow-x-auto pb-1"
                }
                style={{
                  gridTemplateColumns:
                    `repeat(${data.reward.target}, minmax(44px, 1fr))`,
                }}
              >
                {Array.from({
                  length: data.reward.target,
                }).map((_, index) => {
                  const filled =
                    index < member.stamps;
                  const stampDate =
                    member.stampDates[index];

                  const stampMoment =
                    filled && stampDate
                      ? new Date(stampDate)
                      : null;

                  const validStampMoment =
                    stampMoment !== null &&
                    !Number.isNaN(
                      stampMoment.getTime(),
                    );

                  const formattedDate =
                    validStampMoment
                      ? new Intl.DateTimeFormat(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            timeZone: cafe.timezone,
                          },
                        ).format(stampMoment!)
                      : "—";

                  const formattedTime =
                    validStampMoment
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
                        className={
                          isKato
                            ? "flex aspect-square items-center justify-center"
                            : "flex aspect-square items-center justify-center border"
                        }
                        style={
                          isKato
                            ? {
                                color: filled
                                  ? theme.accent
                                  : theme.textMuted,
                                filter: "none",
                              }
                            : {
                                borderColor: filled
                                  ? `${theme.accent}70`
                                  : theme.border,
                                backgroundColor: filled
                                  ? theme.accentSoft
                                  : theme.surfaceRaised,
                                borderRadius: "12px",
                              }
                        }
                      >
                        {isKato ? (
                          <KatoMark
                            size={29}
                          />
                        ) : (
                          <StampIcon
                            size={17}
                            style={{
                              color: filled
                                ? theme.accent
                                : theme.textMuted,
                            }}
                          />
                        )}
                      </div>

                      <div
                        className="mt-1.5 min-h-8 text-[10px] font-medium leading-3.5"
                        style={{
                          color: filled
                            ? theme.textMuted
                            : "transparent",
                        }}
                      >
                        <p>{formattedDate}</p>
                        <p className="mt-0.5 opacity-80">
                          {formattedTime}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <ActionButton
                  type="button"
                  disabled={busy || member.rewardReady}
                  pending={busy && action?.operation === "stamp"}
                  icon={action?.status === "success" && action.operation === "stamp" ? <CheckCircle2 size={16} /> : <StampIcon size={16} />}
                  onClick={() => {
                    if (spendingEnabled) {
                      setPendingMember(member);
                      setPendingOperation("stamp");
                    } else void runAction(member.id, "stamp");
                  }}
                  className="flex min-h-11 px-2 items-center justify-center gap-2 text-sm font-semibold transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-45"
                  style={{
                    backgroundColor: theme.accent,
                    color: theme.buttonText,
                    borderRadius: theme.radiusMedium,
                  }}
                >
                  {t(unit === "visit" ? "Add visit" : "Add stamp")}
                </ActionButton>

                <ActionButton
                  type="button"
                  disabled={busy || !member.rewardReady}
                  pending={busy && action?.operation === "redeem"}
                  icon={<CheckCircle2 size={16} />}
                  onClick={() => {
                    if (spendingEnabled) {
                      setPendingMember(member);
                      setPendingOperation("redeem");
                    } else void runAction(member.id, "redeem");
                  }}
                  className="flex min-h-11 px-2 items-center justify-center gap-2 border text-sm font-semibold transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    borderColor: member.rewardReady
                      ? `${theme.success}70`
                      : theme.border,
                    backgroundColor: member.rewardReady
                      ? `${theme.success}10`
                      : theme.surfaceRaised,
                    color: member.rewardReady
                      ? theme.success
                      : theme.textMuted,
                    borderRadius: theme.radiusMedium,
                  }}
                >{t("Redeem reward")}</ActionButton>
              </div>
              <p
                role="status"
                className="mt-1.5 h-8 overflow-y-auto text-xs leading-4"
                style={{ color: action?.status === "error" ? theme.danger : action?.status === "success" ? theme.success : theme.textSecondary }}
              >
                {action && t(action.text)}
              </p>
            </div>
          );
        })}
      </div>

      {pendingMember && pendingOperation === "stamp" && spendingEnabled && (
        <PurchaseConfirmation
          submitting={confirming}
          error={actions[pendingMember.id]?.status === "error" ? actions[pendingMember.id]?.text : undefined}
          onConfirm={amount => {
            setConfirming(true);
            void runAction(pendingMember.id, "stamp", amount).finally(() => setConfirming(false));
          }}
          onCancel={() => { if (!confirming) { setPendingMember(null); setPendingOperation(null); } }}
        />
      )}
      {pendingMember && pendingOperation === "redeem" && spendingEnabled && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm" role="presentation">
          <div role="dialog" aria-modal="true" aria-label="Confirm reward redemption"
            className="w-full max-w-md space-y-4 rounded-3xl border p-5 shadow-2xl"
            style={{ backgroundColor: theme.surface, borderColor: theme.border, color: theme.textPrimary }}>
            <h3 className="text-lg font-semibold">Redeem reward for {pendingMember.name}?</h3>
            <RewardCycleSpending customerId={pendingMember.id} active={true} />
            <p className="text-sm" style={{ color: theme.textMuted }}>This starts a new stamp card. Past purchase history is kept.</p>
            <button type="button" disabled={confirming} onClick={() => {
              setConfirming(true);
              void runAction(pendingMember.id, "redeem").finally(() => setConfirming(false));
            }} className="min-h-12 w-full rounded-xl px-4 font-semibold disabled:opacity-50"
              style={{ backgroundColor: theme.success, color: theme.buttonText }}>
              {confirming ? "Redeeming..." : "Confirm redemption"}
            </button>
            <button type="button" disabled={confirming} onClick={() => { setPendingMember(null); setPendingOperation(null); }}
              className="min-h-11 w-full rounded-xl border px-4 text-sm" style={{ borderColor: theme.border }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {filteredMembers.length === 0 && (
        <div
          className="rounded-[22px] border border-dashed p-10 text-center"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
          }}
        >
          <p className="font-medium">
            No matching customers
          </p>
        </div>
      )}
    </div>
  );
}
