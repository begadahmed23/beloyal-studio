"use client";

import { FormEvent, useState } from "react";
import {
  CheckCircle2,
  Coffee,
  Eye,
  EyeOff,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { businessTypeLabels, getBusinessTerminology } from "@/lib/business/terminology";
import ThemeGallery from "@/components/theme/ThemeGallery";
import { branchQuote, fireyNashBrand, isFireyNashName, restaurantCategories } from "@/lib/business/points";
import { DEFAULT_DASHBOARD_THEME, isRestaurantPalette } from "@/lib/cafe-theme";

import BusinessTypeSelector from "./BusinessTypeSelector";
import type { BusinessType } from "./studio-types";

type Props = {
  onCreated: () => void;
};

const inputClassName =
  "h-12 w-full rounded-xl border border-black/[0.09] bg-white px-4 text-sm text-[#202124] outline-none transition placeholder:text-[#A0A1A6] hover:border-black/[0.15] focus:border-[#8B8F96] focus:ring-4 focus:ring-black/[0.035] disabled:cursor-not-allowed disabled:bg-[#F1F1F3] disabled:opacity-70";

function isStrongPassword(value: string) {
  return (
    value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value)
  );
}

export default function CreateCafeDialog({
  onCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [businessType, setBusinessType] =
    useState<BusinessType>("CAFE");
  const [cafeName, setCafeName] = useState("");
  const [slug, setSlug] = useState("");
  const [storeLimit, setStoreLimit] = useState("1");
  const [accountName, setAccountName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rewardName, setRewardName] =
    useState("Free Drink");
  const [rewardTarget, setRewardTarget] =
    useState("7");
  const [loyaltyMode, setLoyaltyMode] = useState<"STAMPS" | "POINTS">("STAMPS");
  const [restaurantCategory, setRestaurantCategory] = useState<keyof typeof restaurantCategories>("OTHER");
  const [pointsPerHundred, setRate] = useState("10");
  const [billingPeriod, setBillingPeriod] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [monthlyPrice, setMonthlyPrice] = useState<string | null>(null);
  const [theme, setTheme] =
    useState<string>(DEFAULT_DASHBOARD_THEME);

  const terminology =
    getBusinessTerminology(businessType);
  const businessLabel = businessTypeLabels[businessType];
  const firey = businessType === "RESTAURANT" && isFireyNashName(cafeName);

  function applyFireyDefaults() {
    setSlug(fireyNashBrand.slug);
    setStoreLimit(current => String(Math.max(Number(current) || 1, fireyNashBrand.branches.length)));
    setLoyaltyMode("POINTS");
    setRestaurantCategory("FRIED_CHICKEN");
    setTheme("RED_ORANGE_DARK");
  }

  function resetForm() {
    setBusinessType("CAFE");
    setCafeName("");
    setSlug("");
    setStoreLimit("1");
    setAccountName("");
    setEmail("");
    setPassword("");
    setRewardName("Free Drink");
    setRewardTarget("7");
    setMonthlyPrice(null);
    setLoyaltyMode("STAMPS");
    setRestaurantCategory("OTHER");
    setRate("10");
    setBillingPeriod("MONTHLY");
    setTheme(DEFAULT_DASHBOARD_THEME);
    setError("");
    setSuccess(false);
    setShowPassword(false);
  }

  function handleBusinessTypeChange(
    nextBusinessType: BusinessType,
  ) {
    const nextTerminology =
      getBusinessTerminology(nextBusinessType);

    setBusinessType(nextBusinessType);
    setLoyaltyMode(nextBusinessType === "RESTAURANT" ? "POINTS" : "STAMPS");
    if (nextBusinessType === "RESTAURANT" && isFireyNashName(cafeName)) applyFireyDefaults();
    else if (nextBusinessType === "RESTAURANT") setTheme("RED_ORANGE_LIGHT");
    else if (isRestaurantPalette(theme)) setTheme(DEFAULT_DASHBOARD_THEME);
    setRewardName(nextTerminology.defaultRewardName);
    setRewardTarget(
      nextBusinessType === "BARBERSHOP" ? "3" : "7",
    );
  }

  function generateSlug(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function handleCafeNameChange(value: string) {
    setCafeName(value);

    if (businessType === "RESTAURANT" && isFireyNashName(value)) {
      if (!firey) applyFireyDefaults();
      return;
    }
    if (!slug || slug === generateSlug(cafeName) || firey) {
      setSlug(generateSlug(value));
    }
  }

  async function createCafe(event: FormEvent) {
    event.preventDefault();

    if (loading) {
      return;
    }

    if (!isStrongPassword(password)) {
      setError(
        "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess(false);

      const response = await fetch("/api/studio/cafes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessType, loyaltyMode, restaurantCategory, pointsPerHundred, billingPeriod,
          cafeName,
          slug,
          storeLimit: Number(storeLimit),
          ownerName: accountName,
          email,
          password,
          rewardName,
          rewardTarget: Number(rewardTarget),
          ...(monthlyPrice !== null && monthlyPrice !== "" && { monthlyPrice: Number(monthlyPrice) }),
          theme,
        }),
      });

      const responseText = await response.text();

      let data: {
        message?: string;
      } = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to create business."
        );
      }

      setSuccess(true);
      onCreated();

      window.setTimeout(() => {
        setOpen(false);
        resetForm();
      }, 1200);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to create business."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);

        if (!nextOpen && !loading) {
          resetForm();
        }
      }}
    >
      <DialogTrigger
        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#C8CBD0] bg-gradient-to-b from-white to-[#E9EAEC] px-5 text-sm font-semibold text-[#202124] shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_5px_14px_rgba(15,23,42,0.08)] transition pointer-fine:motion-safe:hover:-translate-y-0.5 hover:border-[#B5B8BE] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_20px_rgba(15,23,42,0.11)]"
      >
        <Plus size={17} />
        Create Business
      </DialogTrigger>

      <DialogContent className="max-h-[92dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-[28px] border border-black/[0.08] bg-[#F7F7F8] p-0 text-[#202124] shadow-[0_32px_100px_rgba(15,23,42,0.22)]">
        <DialogHeader className="relative overflow-hidden border-b border-black/[0.07] bg-white px-6 py-6 text-left sm:px-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[#DDE0E5]/60 blur-3xl" />

          <div className="relative flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/[0.08] bg-gradient-to-br from-white via-[#ECEEF1] to-[#C9CDD3] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_18px_rgba(15,23,42,0.08)]">
              <Plus size={19} />
            </div>

            <div>
              <DialogTitle className="text-xl font-semibold tracking-[-0.03em] text-[#171719]">
                Create a new business
              </DialogTitle>

              <DialogDescription className="mt-1.5 max-w-xl text-sm leading-6 text-[#74747B]">
                Set up the workspace, owner account,
                loyalty program, and 14-day free trial.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form
          onSubmit={createCafe}
          autoComplete="off"
          className="space-y-5 p-5 sm:p-7"
        >
          <section className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-6">
            <p className="text-sm font-semibold text-[#252528]">
              Business type
            </p>
            <p className="mt-1 text-xs text-[#898990]">
              Controls the dashboard, wording, and loyalty defaults.
            </p>

            <div className="mt-4">
              <BusinessTypeSelector
                value={businessType}
                onChange={handleBusinessTypeChange}
                disabled={loading}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F1F3] text-[#565960]">
                <Coffee size={17} />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#252528]">
                  {businessLabel} information
                </p>
                <p className="mt-0.5 text-xs text-[#898990]">
                  Identity and public workspace address
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#48484D]">
                  {businessLabel} name
                </label>

                <input
                  value={cafeName}
                  onChange={(event) =>
                    handleCafeNameChange(event.target.value)
                  }
                  placeholder={
                    businessType === "BARBERSHOP" ? "The Barber Club"
                      : businessType === "CAFE" ? "Coffee Lab" : "Business name"
                  }
                  required
                  disabled={loading}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#48484D]">
                  Slug
                </label>

                <input
                  value={slug}
                  readOnly={firey}
                  onChange={(event) =>
                    setSlug(
                      generateSlug(event.target.value)
                    )
                  }
                  placeholder="coffee-lab"
                  required
                  disabled={loading}
                  className={inputClassName}
                />

                <p className="mt-2 text-xs text-[#929298]">
                  Used in the business&apos;s unique web address.
                </p>
              </div>
              <div>
                <label htmlFor="studio-store-limit" className="mb-2 block text-sm font-medium text-[#48484D]">
                  Number of stores
                </label>
                <input id="studio-store-limit" type="number" min={firey ? fireyNashBrand.branches.length : 1} max={2147483647} step={1}
                  value={storeLimit} onChange={event => setStoreLimit(event.target.value)} required
                  disabled={loading} className={inputClassName} />
                <p className="mt-2 text-xs text-[#686871]">{firey ? "سيدي جابر and النقل والهندسة are added with the Firey Nash logo and flame card." : "Each store includes one cashier account and one signup QR."}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F1F3] text-[#565960]">
                <UserRound size={17} />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#252528]">
                  Owner login
                </p>
                <p className="mt-0.5 text-xs text-[#898990]">
                  Credentials for the business dashboard
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-[#48484D]">
                  Account name
                </label>

                <input
                  value={accountName}
                  onChange={(event) =>
                    setAccountName(event.target.value)
                  }
                  autoComplete="off"
                  required
                  disabled={loading}
                  className={inputClassName}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#48484D]">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  autoComplete="off"
                  required
                  disabled={loading}
                  className={inputClassName}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium text-[#48484D]">
                Temporary password
              </label>

              <div className="relative">
                <input
                  type={
                    showPassword ? "text" : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={loading}
                  className={`${inputClassName} pr-12`}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  disabled={loading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B8B91] transition hover:text-[#202124] disabled:opacity-50"
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              <p className="mt-2 flex items-center gap-1.5 text-xs text-[#929298]">
                <ShieldCheck size={13} />
                8+ characters with uppercase, lowercase, and a number.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)] sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F0F1F3] text-[#565960]">
                <Sparkles size={17} />
              </div>

              <div>
                <p className="text-sm font-semibold text-[#252528]">
                  Loyalty and subscription
                </p>
                <p className="mt-0.5 text-xs text-[#898990]">
                  Reward rules, theme, and monthly pricing
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm">Loyalty mode
                <select className={inputClassName} value={loyaltyMode} disabled={firey} onChange={event => setLoyaltyMode(event.target.value === "POINTS" ? "POINTS" : "STAMPS")}>
                  <option value="STAMPS">Stamps</option><option value="POINTS">Points</option>
                </select>
              </label>
              {businessType === "RESTAURANT" && <label className="text-sm">Food category
                <select className={inputClassName} value={restaurantCategory} disabled={firey} onChange={event => {
                  const category = event.target.value as keyof typeof restaurantCategories;
                  setRestaurantCategory(category);
                  setRewardName(restaurantCategories[category].reward);
                }}>
                  {Object.entries(restaurantCategories).map(([value, item]) => <option key={value} value={value}>{item.en} · {item.ar}</option>)}
                </select>
              </label>}
              {loyaltyMode === "POINTS" && <label className="text-sm">Points per 100 EGP
                <input className={inputClassName} inputMode="decimal" required value={pointsPerHundred} onChange={event => setRate(event.target.value)} />
              </label>}
              {loyaltyMode === "STAMPS" && <div>
                <label className="mb-2 block text-sm font-medium text-[#48484D]">
                  Reward name
                </label>

                <input
                  value={rewardName}
                  onChange={(event) =>
                    setRewardName(event.target.value)
                  }
                  placeholder={terminology.defaultRewardName}
                  required
                  disabled={loading}
                  className={inputClassName}
                />
              </div>}

              {loyaltyMode === "STAMPS" && <div>
                <label className="mb-2 block text-sm font-medium text-[#48484D]">
                  Reward visit
                </label>

                <input
                  type="number"
                  min={2}
                  max={30}
                  value={rewardTarget}
                  onChange={(event) =>
                    setRewardTarget(event.target.value)
                  }
                  required
                  disabled={loading}
                  className={inputClassName}
                />
                <p className="mt-1.5 text-sm text-[#626267]">
                  A target of 7 means 6 paid visits, then the reward on visit 7.
                </p>
              </div>}
              <label className="text-sm">Quote period
                <select className={inputClassName} value={billingPeriod} onChange={event => setBillingPeriod(event.target.value === "YEARLY" ? "YEARLY" : "MONTHLY")}>
                  <option value="MONTHLY">Monthly</option><option value="YEARLY">Yearly</option>
                </select>
                <span className="mt-2 block font-medium">{branchQuote(Number(storeLimit) || 0, billingPeriod).toLocaleString()} EGP / {billingPeriod === "YEARLY" ? "year" : "month"}</span>
              </label>
              <div>
                <label className="mb-2 block text-sm font-medium text-[#48484D]">
                  Monthly price override
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={monthlyPrice ?? ""}
                    placeholder={String(branchQuote(Number(storeLimit) || 0, "MONTHLY"))}
                    onChange={(event) =>
                      setMonthlyPrice(event.target.value)
                    }
                    disabled={loading}
                    className={`${inputClassName} pr-16`}
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-[#F0F1F3] px-2 py-1 text-[10px] font-semibold text-[#73747A]">
                    EGP
                  </span>
                </div>
              </div>

            </div>
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-[#48484D]">Dashboard theme</p>
              <ThemeGallery businessType={businessType} value={theme} onChange={setTheme} disabled={loading} />
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-xl border border-black/[0.06] bg-gradient-to-r from-[#F4F5F6] to-[#FAFAFB] px-4 py-3.5">
              <CheckCircle2
                size={17}
                className="mt-0.5 shrink-0 text-[#62656B]"
              />
              <div>
                <p className="text-sm font-medium text-[#3F4044]">
                  14-day free trial included
                </p>
                <p className="mt-1 text-xs leading-5 text-[#85868C]">
                  The business starts in trial status. Its monthly
                  price is saved for subscription management.
                </p>
              </div>
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
              <CheckCircle2 size={18} />
              Business created successfully.
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-black/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="h-11 rounded-xl border border-black/[0.09] bg-white px-5 text-sm font-medium text-[#55565B] transition hover:border-black/[0.16] hover:bg-[#F5F5F6] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || success}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#BFC2C7] bg-gradient-to-b from-[#303237] to-[#191A1D] px-5 text-sm font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_7px_16px_rgba(15,23,42,0.14)] transition pointer-fine:motion-safe:hover:-translate-y-0.5 hover:from-[#3B3D42] hover:to-[#202125] disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoaderCircle
                    size={17}
                    className="animate-spin"
                  />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Create Business
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
