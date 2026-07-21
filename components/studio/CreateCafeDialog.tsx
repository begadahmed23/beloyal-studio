"use client";

import { FormEvent, useState } from "react";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  LoaderCircle,
  Plus,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Props = {
  onCreated: () => void;
};

const themes = [
  {
    value: "COFFEE_CLASSIC",
    label: "Coffee Classic",
  },
  {
    value: "MODERN_MINIMAL",
    label: "Modern Minimal",
  },
  {
    value: "DARK_LUXURY",
    label: "Dark Luxury",
  },
  {
    value: "SOFT_PASTEL",
    label: "Soft Pastel",
  },
  {
    value: "ORGANIC",
    label: "Organic",
  },
];

export default function CreateCafeDialog({
  onCreated,
}: Props) {
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [cafeName, setCafeName] = useState("");
  const [slug, setSlug] = useState("");
  const [accountName, setAccountName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rewardName, setRewardName] =
    useState("Free Drink");
  const [rewardTarget, setRewardTarget] =
    useState("7");
  const [monthlyPrice, setMonthlyPrice] =
    useState("1000");
  const [theme, setTheme] =
    useState("COFFEE_CLASSIC");

  function resetForm() {
    setCafeName("");
    setSlug("");
    setAccountName("");
    setEmail("");
    setPassword("");
    setRewardName("Free Drink");
    setRewardTarget("7");
    setMonthlyPrice("1000");
    setTheme("COFFEE_CLASSIC");
    setError("");
    setSuccess(false);
    setShowPassword(false);
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

    if (!slug || slug === generateSlug(cafeName)) {
      setSlug(generateSlug(value));
    }
  }

  async function createCafe(event: FormEvent) {
    event.preventDefault();

    if (loading) {
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
          cafeName,
          slug,
          ownerName: accountName,
          email,
          password,
          rewardName,
          rewardTarget: Number(rewardTarget),
          monthlyPrice: Number(monthlyPrice),
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
          data.message || "Failed to create café."
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
          : "Failed to create café."
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
      <DialogTrigger >
        <button
          type="button"
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F5F5F7] px-5 text-sm font-semibold text-[#09090A] transition hover:bg-white"
        >
          <Plus size={17} />
          Create Café
        </button>
      </DialogTrigger>

      <DialogContent className="max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto border-white/[0.08] bg-[#141416] p-0 text-[#F5F5F7] shadow-[0_32px_100px_rgba(0,0,0,0.65)]">
        <DialogHeader className="border-b border-white/[0.07] px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Create a new café
          </DialogTitle>

          <DialogDescription className="text-[#8E8E93]">
            Create the café, its login account, and its
            14-day free trial.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={createCafe}
          className="space-y-7 p-6"
        >
          <section>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#8E8E93]">
              Café information
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Café name
                </label>

                <input
                  value={cafeName}
                  onChange={(event) =>
                    handleCafeNameChange(event.target.value)
                  }
                  placeholder="Coffee Lab"
                  required
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 text-sm outline-none transition placeholder:text-[#5C5C61] focus:border-[#2997FF]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Slug
                </label>

                <input
                  value={slug}
                  onChange={(event) =>
                    setSlug(
                      generateSlug(event.target.value)
                    )
                  }
                  placeholder="coffee-lab"
                  required
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 text-sm outline-none transition placeholder:text-[#5C5C61] focus:border-[#2997FF]"
                />
              </div>
            </div>
          </section>

          <section>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#8E8E93]">
              Login account
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Account name
                </label>

                <input
                  value={accountName}
                  onChange={(event) =>
                    setAccountName(event.target.value)
                  }
                  placeholder="Coffee Lab Team"
                  required
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 text-sm outline-none transition placeholder:text-[#5C5C61] focus:border-[#2997FF]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="team@coffeelab.com"
                  required
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 text-sm outline-none transition placeholder:text-[#5C5C61] focus:border-[#2997FF]"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="mb-2 block text-sm font-medium">
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
                  placeholder="Minimum 12 characters"
                  minLength={12}
                  required
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 pr-12 text-sm outline-none transition placeholder:text-[#5C5C61] focus:border-[#2997FF]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((value) => !value)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8E8E93] transition hover:text-white"
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
            </div>
          </section>

          <section>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#8E8E93]">
              Loyalty program
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Reward name
                </label>

                <input
                  value={rewardName}
                  onChange={(event) =>
                    setRewardName(event.target.value)
                  }
                  placeholder="Free Drink"
                  required
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 text-sm outline-none transition placeholder:text-[#5C5C61] focus:border-[#2997FF]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Stamps required
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
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 text-sm outline-none transition focus:border-[#2997FF]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Monthly price
                </label>

                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={monthlyPrice}
                    onChange={(event) =>
                      setMonthlyPrice(event.target.value)
                    }
                    required
                    disabled={loading}
                    className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 pr-14 text-sm outline-none transition focus:border-[#2997FF]"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#8E8E93]">
                    EGP
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Card theme
                </label>

                <select
                  value={theme}
                  onChange={(event) =>
                    setTheme(event.target.value)
                  }
                  disabled={loading}
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-4 text-sm outline-none transition focus:border-[#2997FF]"
                >
                  {themes.map((themeOption) => (
                    <option
                      key={themeOption.value}
                      value={themeOption.value}
                    >
                      {themeOption.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.08] px-4 py-3 text-sm text-emerald-300">
              <CheckCircle2 size={18} />
              Café created successfully.
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="h-11 rounded-xl border border-white/[0.08] bg-[#1C1C1E] px-5 text-sm font-medium transition hover:bg-[#262629] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || success}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#F5F5F7] px-5 text-sm font-semibold text-[#09090A] transition hover:bg-white disabled:opacity-50"
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
                  Create Café
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}