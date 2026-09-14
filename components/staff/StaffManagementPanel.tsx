"use client";

import {
  Activity,
  CheckCircle2,
  LoaderCircle,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useOptionalCafeTheme } from "@/components/theme/CafeThemeProvider";

type Role = "CAFE_ADMIN" | "CASHIER";

type Staff = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isEnabled: boolean;
  createdAt: string;
  lastActivityAt: string | null;
  activityCount: number;
  isCurrentUser: boolean;
};

type ActivityRow = {
  id: string;
  type: "ADD" | "REDEEM" | "BIRTHDAY_REDEEM";
  description: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
  customer: {
    id: string;
    name: string;
    memberNumber: string;
  };
};

type ResponseData = {
  staff: Staff[];
  activity: ActivityRow[];
  activityLoaded?: boolean;
  activityLimit?: number;
};

type Props = {
  endpoint: string;
  canCreateAdmins?: boolean;
  title?: string;
};

function formatDateTime(value: string | null) {
  if (!value) return "No activity yet";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "No activity yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default function StaffManagementPanel({
  endpoint,
  canCreateAdmins = false,
  title = "Staff & activity",
}: Props) {
  const cafeTheme = useOptionalCafeTheme();
  const themed = Boolean(cafeTheme);
  const theme = cafeTheme?.theme;

  const [data, setData] =
    useState<ResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] =
    useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] =
    useState<Role>("CASHIER");

  const [staffFilter, setStaffFilter] =
    useState("ALL");
  const [actionFilter, setActionFilter] =
    useState("ALL");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] =
    useState("7D");
  const [activityOpen, setActivityOpen] =
    useState(false);
  const [activityLoading, setActivityLoading] =
    useState(false);
  const [activityLimit, setActivityLimit] =
    useState(50);
  const [resetUserId, setResetUserId] =
    useState<string | null>(null);
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const load = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(endpoint, {
        cache: "no-store",
      });

      const body = (await response.json()) as
        | ResponseData
        | { message?: string };

      if (!response.ok) {
        throw new Error(
          "message" in body && body.message
            ? body.message
            : "Failed to load staff.",
        );
      }

      const next = body as ResponseData;

      setData((current) => ({
        ...next,
        activity:
          next.activityLoaded === false
            ? current?.activity ?? []
            : next.activity,
      }));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load staff.",
      );
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  const loadActivity = useCallback(async () => {
    try {
      setActivityLoading(true);
      setError("");

      const url = new URL(endpoint, window.location.origin);
      url.searchParams.set("activity", "1");
      url.searchParams.set("limit", String(activityLimit));
      url.searchParams.set("dateRange", dateFilter);

      if (staffFilter !== "ALL") {
        url.searchParams.set("staffId", staffFilter);
      }

      if (actionFilter !== "ALL") {
        url.searchParams.set("action", actionFilter);
      }

      const cleanSearch = search.trim();

      if (cleanSearch) {
        url.searchParams.set("search", cleanSearch);
      }

      const response = await fetch(url.toString(), {
        cache: "no-store",
      });

      const body = (await response.json()) as
        | ResponseData
        | { message?: string };

      if (!response.ok) {
        throw new Error(
          "message" in body && body.message
            ? body.message
            : "Failed to load staff activity.",
        );
      }

      const next = body as ResponseData;

      setData((current) => ({
        ...next,
        staff: next.staff ?? current?.staff ?? [],
        activity: next.activity ?? [],
      }));
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load staff activity.",
      );
    } finally {
      setActivityLoading(false);
    }
  }, [
    endpoint,
    activityLimit,
    dateFilter,
    staffFilter,
    actionFilter,
    search,
  ]);

  useEffect(() => {
    if (!activityOpen) {
      return;
    }

    const timeout = window.setTimeout(() => {
      void loadActivity();
    }, search.trim() ? 300 : 0);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [activityOpen, loadActivity, search]);


  async function createAccount() {
    if (saving) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          ...(canCreateAdmins ? { role } : {}),
        }),
      });

      const body = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          body.message || "Failed to create account.",
        );
      }

      setName("");
      setEmail("");
      setPassword("");
      setRole("CASHIER");
      setSuccess("Account created successfully.");
      await load();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to create account.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(staff: Staff) {
    if (!canCreateAdmins) return;

    try {
      setBusyId(staff.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${endpoint}/${staff.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            newPassword,
            confirmPassword,
          }),
        },
      );

      const body = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          body.message || "Failed to reset password.",
        );
      }

      setResetUserId(null);
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(
        body.message ||
          "Password changed and sessions revoked.",
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to reset password.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function toggleAccount(
    staff: Staff,
  ) {
    try {
      setBusyId(staff.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${endpoint}/${staff.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isEnabled: !staff.isEnabled,
          }),
        },
      );

      const body = (await response.json()) as {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          body.message || "Failed to update account.",
        );
      }

      setSuccess(
        staff.isEnabled
          ? "Account disabled."
          : "Account enabled.",
      );
      await load();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to update account.",
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-40 items-center justify-center">
        <LoaderCircle
          size={25}
          className="animate-spin"
          style={{
            color: themed ? theme?.accent : undefined,
          }}
        />
      </div>
    );
  }

  const sectionStyle = themed
    ? {
        borderColor: theme!.border,
        backgroundColor: theme!.surface,
        color: theme!.textPrimary,
        boxShadow: theme!.cardShadow,
      }
    : undefined;

  const raisedStyle = themed
    ? {
        borderColor: theme!.border,
        backgroundColor: theme!.surfaceRaised,
        color: theme!.textPrimary,
      }
    : undefined;

  const inputStyle = themed
    ? {
        borderColor: theme!.inputBorder,
        backgroundColor: theme!.inputBackground,
        color: theme!.textPrimary,
      }
    : undefined;

  const mutedStyle = themed
    ? { color: theme!.textMuted }
    : undefined;

  return (
    <section
      className={`space-y-5 border p-5 sm:p-6 ${
        themed
          ? ""
          : "rounded-[26px] border-black/[0.08] bg-white shadow-[0_12px_40px_rgba(15,23,42,0.05)]"
      }`}
      style={{
        ...sectionStyle,
        borderRadius: themed
          ? theme!.radiusLarge
          : undefined,
      }}
    >
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} />
          <h2 className="text-lg font-semibold">
            {title}
          </h2>
        </div>

        <p
          className={`mt-1 text-sm ${
            themed ? "" : "text-[#77777E]"
          }`}
          style={mutedStyle}
        >
          Manage staff access without deleting their historical activity.
        </p>
      </div>

      {(error || success) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || success}
        </div>
      )}

      <div
        className={`border p-4 ${
          themed
            ? ""
            : "rounded-2xl border-black/[0.07] bg-[#F8F8F9]"
        }`}
        style={{
          ...raisedStyle,
          borderRadius: themed
            ? theme!.radiusMedium
            : undefined,
        }}
      >
        <div className="flex items-center gap-2">
          <Plus size={16} />
          <p className="text-sm font-semibold">
            Add account
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Name"
            className={`h-11 border px-3 text-sm outline-none ${
              themed
                ? ""
                : "rounded-xl border-black/[0.10] bg-white"
            }`}
            style={{
              ...inputStyle,
              borderRadius: themed
                ? theme!.radiusMedium
                : undefined,
            }}
          />

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Email"
            className={`h-11 border px-3 text-sm outline-none ${
              themed
                ? ""
                : "rounded-xl border-black/[0.10] bg-white"
            }`}
            style={{
              ...inputStyle,
              borderRadius: themed
                ? theme!.radiusMedium
                : undefined,
            }}
          />

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Temporary password"
            className={`h-11 border px-3 text-sm outline-none ${
              themed
                ? ""
                : "rounded-xl border-black/[0.10] bg-white"
            }`}
            style={{
              ...inputStyle,
              borderRadius: themed
                ? theme!.radiusMedium
                : undefined,
            }}
          />

          {canCreateAdmins ? (
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as Role)
              }
              className={`h-11 border px-3 text-sm outline-none ${
              themed
                ? ""
                : "rounded-xl border-black/[0.10] bg-white"
            }`}
            style={{
              ...inputStyle,
              borderRadius: themed
                ? theme!.radiusMedium
                : undefined,
            }}
            >
              <option value="CASHIER">
                Cashier
              </option>
              <option value="CAFE_ADMIN">
                Admin
              </option>
            </select>
          ) : (
            <div
              className={`flex h-11 items-center border px-3 text-sm ${
                themed
                  ? ""
                  : "rounded-xl border-black/[0.08] bg-white text-[#66666D]"
              }`}
              style={{
                ...inputStyle,
                color: themed
                  ? theme!.textSecondary
                  : undefined,
                borderRadius: themed
                  ? theme!.radiusMedium
                  : undefined,
              }}
            >
              Cashier access
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={createAccount}
          disabled={saving}
          className={`mt-3 flex h-11 items-center justify-center gap-2 px-4 text-sm font-semibold disabled:opacity-50 ${
            themed
              ? ""
              : "rounded-xl bg-[#1D1D1F] text-white"
          }`}
          style={
            themed
              ? {
                  backgroundColor: theme!.accent,
                  color: theme!.buttonText,
                  borderRadius: theme!.radiusMedium,
                }
              : undefined
          }
        >
          {saving ? (
            <LoaderCircle
              size={16}
              className="animate-spin"
            />
          ) : (
            <Plus size={16} />
          )}
          Create {canCreateAdmins ? "account" : "cashier"}
        </button>

        <p
          className={`mt-2 text-xs ${
            themed ? "" : "text-[#8E8E94]"
          }`}
          style={mutedStyle}
        >
          Passwords require 12+ characters with uppercase, lowercase, and a number.
        </p>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Users size={17} />
          <p className="text-sm font-semibold">
            Accounts
          </p>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          {(data?.staff ?? []).map((staff) => (
            <div
              key={staff.id}
              className={`border p-4 ${
                themed
                  ? ""
                  : "rounded-2xl border-black/[0.07] bg-[#FAFAFB]"
              }`}
              style={{
                ...raisedStyle,
                borderRadius: themed
                  ? theme!.radiusMedium
                  : undefined,
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {staff.role === "CAFE_ADMIN" ? (
                      <ShieldCheck size={15} />
                    ) : (
                      <UserRound size={15} />
                    )}
                    <p className="truncate font-medium">
                      {staff.name}
                    </p>
                  </div>

                  <p className={`mt-1 truncate text-xs ${
                    themed ? "" : "text-[#77777E]"
                  }`}
                  style={mutedStyle}>
                    {staff.email}
                  </p>

                  <p
                    className={`mt-2 text-xs ${
                      themed ? "" : "text-[#9999A0]"
                    }`}
                    style={mutedStyle}
                  >
                    {staff.role === "CAFE_ADMIN"
                      ? "Admin"
                      : "Cashier"}{" "}
                    · {staff.activityCount} actions ·{" "}
                    {formatDateTime(
                      staff.lastActivityAt,
                    )}
                  </p>
                </div>

                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    themed
                      ? ""
                      : staff.isEnabled
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-red-50 text-red-700"
                  }`}
                  style={
                    themed
                      ? {
                          backgroundColor: staff.isEnabled
                            ? `${theme!.success}18`
                            : `${theme!.danger}18`,
                          color: staff.isEnabled
                            ? theme!.success
                            : theme!.danger,
                        }
                      : undefined
                  }
                >
                  {staff.isEnabled
                    ? "Enabled"
                    : "Disabled"}
                </span>
              </div>

              {!staff.isCurrentUser &&
                (canCreateAdmins ||
                  staff.role === "CASHIER") && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        toggleAccount(staff)
                      }
                      disabled={busyId === staff.id}
                      className={`h-9 border px-3 text-xs font-semibold disabled:opacity-50 ${
                        themed
                          ? ""
                          : "rounded-lg border-black/[0.10] bg-white text-[#44444A]"
                      }`}
                      style={
                        themed
                          ? {
                              borderColor: theme!.border,
                              backgroundColor:
                                theme!.inputBackground,
                              color: staff.isEnabled
                                ? theme!.danger
                                : theme!.success,
                              borderRadius:
                                theme!.radiusMedium,
                            }
                          : undefined
                      }
                    >
                      {busyId === staff.id
                        ? "Updating..."
                        : staff.isEnabled
                          ? "Disable account"
                          : "Enable account"}
                    </button>

                    {canCreateAdmins && (
                      <button
                        type="button"
                        onClick={() => {
                          setResetUserId(
                            resetUserId === staff.id
                              ? null
                              : staff.id,
                          );
                          setNewPassword("");
                          setConfirmPassword("");
                          setError("");
                          setSuccess("");
                        }}
                        className="h-9 rounded-lg border border-black/[0.10] bg-white px-3 text-xs font-semibold text-[#44444A]"
                      >
                        Reset password
                      </button>
                    )}
                  </div>
                )}

              {canCreateAdmins &&
                resetUserId === staff.id && (
                  <div className="mt-3 rounded-xl border border-black/[0.08] bg-white p-3">
                    <p className="text-xs font-semibold text-[#44444A]">
                      Set a new password for {staff.name}
                    </p>

                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(event) =>
                          setNewPassword(
                            event.target.value,
                          )
                        }
                        placeholder="New password"
                        className="h-10 rounded-lg border border-black/[0.10] bg-white px-3 text-xs outline-none"
                      />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(
                            event.target.value,
                          )
                        }
                        placeholder="Confirm password"
                        className="h-10 rounded-lg border border-black/[0.10] bg-white px-3 text-xs outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        resetPassword(staff)
                      }
                      disabled={busyId === staff.id}
                      className="mt-2 h-9 rounded-lg bg-[#1D1D1F] px-3 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {busyId === staff.id
                        ? "Changing..."
                        : "Change password"}
                    </button>
                  </div>
                )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Activity size={17} />
            <div>
              <p className="text-sm font-semibold">Staff activity</p>
              <p className="mt-0.5 text-xs" style={mutedStyle}>
                Audit history only loads when you open it.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActivityOpen((current) => !current)}
            className={`h-10 border px-4 text-xs font-semibold transition ${themed ? "" : "rounded-xl border-black/[0.08] bg-white text-[#44444A]"}`}
            style={
              themed
                ? {
                    borderColor: theme!.border,
                    backgroundColor: theme!.inputBackground,
                    color: theme!.textSecondary,
                    borderRadius: theme!.radiusMedium,
                  }
                : undefined
            }
          >
            {activityOpen ? "Hide activity" : "View activity"}
          </button>
        </div>

        {activityOpen && (
          <div className="mt-4">
            <div className="grid gap-2 md:grid-cols-5">
              <div
                className={`flex h-10 items-center border px-3 ${themed ? "" : "rounded-xl border-black/[0.08] bg-[#FAFAFB]"}`}
                style={{
                  ...inputStyle,
                  borderRadius: themed ? theme!.radiusMedium : undefined,
                }}
              >
                <Search
                  size={14}
                  className={themed ? "mr-2" : "mr-2 text-[#9999A0]"}
                  style={themed ? { color: theme!.textMuted } : undefined}
                />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search staff or customer"
                  className="w-full bg-transparent text-xs outline-none"
                  style={{ color: themed ? theme!.textPrimary : undefined }}
                />
              </div>

              <select
                value={staffFilter}
                onChange={(event) => setStaffFilter(event.target.value)}
                className={`h-10 border px-3 text-xs ${themed ? "" : "rounded-xl border-black/[0.08] bg-[#FAFAFB]"}`}
                style={{ ...inputStyle, borderRadius: themed ? theme!.radiusMedium : undefined }}
              >
                <option value="ALL">All staff</option>
                {(data?.staff ?? []).map((staff) => (
                  <option key={staff.id} value={staff.id}>{staff.name}</option>
                ))}
              </select>

              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className={`h-10 border px-3 text-xs ${themed ? "" : "rounded-xl border-black/[0.08] bg-[#FAFAFB]"}`}
                style={{ ...inputStyle, borderRadius: themed ? theme!.radiusMedium : undefined }}
              >
                <option value="TODAY">Today</option>
                <option value="7D">Last 7 days</option>
                <option value="30D">Last 30 days</option>
                <option value="ALL">All time</option>
              </select>

              <select
                value={actionFilter}
                onChange={(event) => setActionFilter(event.target.value)}
                className={`h-10 border px-3 text-xs ${themed ? "" : "rounded-xl border-black/[0.08] bg-[#FAFAFB]"}`}
                style={{ ...inputStyle, borderRadius: themed ? theme!.radiusMedium : undefined }}
              >
                <option value="ALL">All actions</option>
                <option value="ADD">Stamps / visits</option>
                <option value="REDEEM">Reward redemptions</option>
                <option value="BIRTHDAY_REDEEM">Birthday redemptions</option>
              </select>

              <select
                value={activityLimit}
                onChange={(event) => setActivityLimit(Number(event.target.value))}
                className={`h-10 border px-3 text-xs ${themed ? "" : "rounded-xl border-black/[0.08] bg-[#FAFAFB]"}`}
                style={{ ...inputStyle, borderRadius: themed ? theme!.radiusMedium : undefined }}
              >
                {[25, 50, 100, 250, 500, 1000].map((limit) => (
                  <option key={limit} value={limit}>Show {limit}</option>
                ))}
              </select>
            </div>

            <div
              className={`mt-3 max-h-[520px] overflow-y-auto border ${themed ? "" : "rounded-2xl border-black/[0.07]"}`}
              style={{
                borderColor: themed ? theme!.border : undefined,
                borderRadius: themed ? theme!.radiusMedium : undefined,
              }}
            >
              {activityLoading ? (
                <div className="flex min-h-32 items-center justify-center">
                  <LoaderCircle
                    size={22}
                    className="animate-spin"
                    style={{ color: themed ? theme!.accent : undefined }}
                  />
                </div>
              ) : (data?.activity ?? []).length === 0 ? (
                <div
                  className={`p-8 text-center text-sm ${themed ? "" : "text-[#88888F]"}`}
                  style={mutedStyle}
                >
                  No matching staff activity.
                </div>
              ) : (
                (data?.activity ?? []).map((row) => (
                  <div
                    key={row.id}
                    className={`flex flex-col gap-2 border-b px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between ${themed ? "" : "border-black/[0.06]"}`}
                    style={{ borderColor: themed ? theme!.border : undefined }}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {row.user?.name || "Former staff member"}{" · "}
                        {row.type === "ADD"
                          ? "Added stamp / visit"
                          : row.type === "BIRTHDAY_REDEEM"
                            ? "Redeemed birthday reward"
                            : "Redeemed reward"}
                      </p>

                      <p
                        className={`mt-1 text-xs ${themed ? "" : "text-[#77777E]"}`}
                        style={mutedStyle}
                      >
                        {row.customer.name} · {row.customer.memberNumber}
                      </p>
                    </div>

                    <div
                      className={`flex items-center gap-2 text-xs ${themed ? "" : "text-[#8E8E94]"}`}
                      style={mutedStyle}
                    >
                      <CheckCircle2 size={13} />
                      {formatDateTime(row.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
