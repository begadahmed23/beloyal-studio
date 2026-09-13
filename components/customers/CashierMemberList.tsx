"use client";

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
  useMemo,
  useState,
} from "react";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type Member = {
  id: string;
  name: string;
  stamps: number;
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
  const { theme, cafe } = useCafeTheme();
  const isBarbershop =
    cafe.businessType === "BARBERSHOP";
  const unit = isBarbershop ? "visit" : "stamp";

  const [data, setData] =
    useState<CashierMembersResponse | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] =
    useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadMembers = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(
        "/api/cashier/members",
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

      setData(body as CashierMembersResponse);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load members.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const filteredMembers = useMemo(() => {
    if (!data) return [];

    const value = search.trim().toLowerCase();

    if (!value) {
      return data.members;
    }

    return data.members.filter((member) =>
      member.name.toLowerCase().includes(value),
    );
  }, [data, search]);

  async function runAction(
    memberId: string,
    endpoint: string,
  ) {
    try {
      setBusyId(memberId);
      setMessage("");
      setError("");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: memberId,
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

      setMessage(
        body.message || "Updated successfully.",
      );

      await loadMembers();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Action failed.",
      );
    } finally {
      setBusyId(null);
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
          {error || "Members could not load."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {(error || message) && (
        <div
          className="rounded-[18px] border px-4 py-3 text-sm"
          style={{
            borderColor: error
              ? `${theme.danger}45`
              : `${theme.success}45`,
            backgroundColor: error
              ? `${theme.danger}10`
              : `${theme.success}10`,
            color: error
              ? theme.danger
              : theme.success,
          }}
        >
          {error || message}
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
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search by customer name"
          className="w-full bg-transparent text-sm outline-none"
          style={{ color: theme.textPrimary }}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {filteredMembers.map((member) => {
          const busy = busyId === member.id;

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
                    {member.name}
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
                    <Gift size={12} />
                    Reward ready
                  </div>
                )}
              </div>

              {member.birthdayNotice && (
                <div
                  className="mt-4 flex items-center gap-2 rounded-[14px] border px-3 py-2 text-xs font-semibold"
                  style={{
                    borderColor: `${theme.accent}45`,
                    backgroundColor: theme.accentSoft,
                    color: theme.accent,
                  }}
                >
                  <Cake size={14} />
                  {member.birthdayNotice}
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={busy || member.rewardReady}
                  onClick={() =>
                    runAction(
                      member.id,
                      "/api/customers/stamp",
                    )
                  }
                  className="flex h-11 items-center justify-center gap-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45"
                  style={{
                    backgroundColor: theme.accent,
                    color: theme.buttonText,
                    borderRadius: theme.radiusMedium,
                  }}
                >
                  {busy ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <Stamp size={16} />
                  )}
                  Add {unit}
                </button>

                <button
                  type="button"
                  disabled={busy || !member.rewardReady}
                  onClick={() =>
                    runAction(
                      member.id,
                      "/api/customers/redeem",
                    )
                  }
                  className="flex h-11 items-center justify-center gap-2 border text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
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
                >
                  <CheckCircle2 size={16} />
                  Redeem
                </button>
              </div>
            </div>
          );
        })}
      </div>

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
