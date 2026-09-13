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
  useMemo,
  useState,
} from "react";

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

      setData(body as ResponseData);
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

  const filteredActivity = useMemo(() => {
    if (!data) return [];

    const query = search.trim().toLowerCase();

    return data.activity.filter((row) => {
      if (
        staffFilter !== "ALL" &&
        row.user?.id !== staffFilter
      ) {
        return false;
      }

      if (
        actionFilter !== "ALL" &&
        row.type !== actionFilter
      ) {
        return false;
      }

      if (dateFilter !== "ALL") {
        const createdAt = new Date(row.createdAt).getTime();
        const now = Date.now();
        const maxAge =
          dateFilter === "TODAY"
            ? 24 * 60 * 60 * 1000
            : dateFilter === "30D"
              ? 30 * 24 * 60 * 60 * 1000
              : 7 * 24 * 60 * 60 * 1000;

        if (
          Number.isNaN(createdAt) ||
          now - createdAt > maxAge
        ) {
          return false;
        }
      }

      if (!query) return true;

      return [
        row.user?.name,
        row.user?.email,
        row.customer.name,
        row.customer.memberNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [
    data,
    staffFilter,
    actionFilter,
    search,
    dateFilter,
  ]);

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
        />
      </div>
    );
  }

  return (
    <section className="space-y-5 rounded-[26px] border border-black/[0.08] bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.05)] sm:p-6">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} />
          <h2 className="text-lg font-semibold">
            {title}
          </h2>
        </div>

        <p className="mt-1 text-sm text-[#77777E]">
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

      <div className="rounded-2xl border border-black/[0.07] bg-[#F8F8F9] p-4">
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
            className="h-11 rounded-xl border border-black/[0.10] bg-white px-3 text-sm outline-none"
          />

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Email"
            className="h-11 rounded-xl border border-black/[0.10] bg-white px-3 text-sm outline-none"
          />

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Temporary password"
            className="h-11 rounded-xl border border-black/[0.10] bg-white px-3 text-sm outline-none"
          />

          {canCreateAdmins ? (
            <select
              value={role}
              onChange={(event) =>
                setRole(event.target.value as Role)
              }
              className="h-11 rounded-xl border border-black/[0.10] bg-white px-3 text-sm outline-none"
            >
              <option value="CASHIER">
                Cashier
              </option>
              <option value="CAFE_ADMIN">
                Admin
              </option>
            </select>
          ) : (
            <div className="flex h-11 items-center rounded-xl border border-black/[0.08] bg-white px-3 text-sm text-[#66666D]">
              Cashier access
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={createAccount}
          disabled={saving}
          className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1D1D1F] px-4 text-sm font-semibold text-white disabled:opacity-50"
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

        <p className="mt-2 text-xs text-[#8E8E94]">
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
              className="rounded-2xl border border-black/[0.07] bg-[#FAFAFB] p-4"
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

                  <p className="mt-1 truncate text-xs text-[#77777E]">
                    {staff.email}
                  </p>

                  <p className="mt-2 text-xs text-[#9999A0]">
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
                    staff.isEnabled
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {staff.isEnabled
                    ? "Enabled"
                    : "Disabled"}
                </span>
              </div>

              {!staff.isCurrentUser &&
                (canCreateAdmins ||
                  staff.role === "CASHIER") && (
                  <button
                    type="button"
                    onClick={() =>
                      toggleAccount(staff)
                    }
                    disabled={busyId === staff.id}
                    className="mt-4 h-9 rounded-lg border border-black/[0.10] bg-white px-3 text-xs font-semibold text-[#44444A] disabled:opacity-50"
                  >
                    {busyId === staff.id
                      ? "Updating..."
                      : staff.isEnabled
                        ? "Disable account"
                        : "Enable account"}
                  </button>
                )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Activity size={17} />
          <p className="text-sm font-semibold">
            Staff activity
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-4">
          <div className="flex h-10 items-center rounded-xl border border-black/[0.08] bg-[#FAFAFB] px-3">
            <Search
              size={14}
              className="mr-2 text-[#9999A0]"
            />
            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search staff or customer"
              className="w-full bg-transparent text-xs outline-none"
            />
          </div>

          <select
            value={staffFilter}
            onChange={(event) =>
              setStaffFilter(event.target.value)
            }
            className="h-10 rounded-xl border border-black/[0.08] bg-[#FAFAFB] px-3 text-xs"
          >
            <option value="ALL">All staff</option>
            {(data?.staff ?? []).map((staff) => (
              <option
                key={staff.id}
                value={staff.id}
              >
                {staff.name}
              </option>
            ))}
          </select>

          <select
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(event.target.value)
            }
            className="h-10 rounded-xl border border-black/[0.08] bg-[#FAFAFB] px-3 text-xs"
          >
            <option value="TODAY">Today</option>
            <option value="7D">Last 7 days</option>
            <option value="30D">Last 30 days</option>
            <option value="ALL">All recent</option>
          </select>

          <select
            value={actionFilter}
            onChange={(event) =>
              setActionFilter(event.target.value)
            }
            className="h-10 rounded-xl border border-black/[0.08] bg-[#FAFAFB] px-3 text-xs"
          >
            <option value="ALL">
              All actions
            </option>
            <option value="ADD">
              Stamps / visits
            </option>
            <option value="REDEEM">
              Reward redemptions
            </option>
            <option value="BIRTHDAY_REDEEM">
              Birthday redemptions
            </option>
          </select>
        </div>

        <div className="mt-3 max-h-[520px] overflow-y-auto rounded-2xl border border-black/[0.07]">
          {filteredActivity.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#88888F]">
              No matching staff activity.
            </div>
          ) : (
            filteredActivity.map((row) => (
              <div
                key={row.id}
                className="flex flex-col gap-2 border-b border-black/[0.06] px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium">
                    {row.user?.name ||
                      "Former staff member"}
                    {" · "}
                    {row.type === "ADD"
                      ? "Added stamp / visit"
                      : row.type === "BIRTHDAY_REDEEM"
                        ? "Redeemed birthday reward"
                        : "Redeemed reward"}
                  </p>

                  <p className="mt-1 text-xs text-[#77777E]">
                    {row.customer.name} ·{" "}
                    {row.customer.memberNumber}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#8E8E94]">
                  <CheckCircle2 size={13} />
                  {formatDateTime(row.createdAt)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
