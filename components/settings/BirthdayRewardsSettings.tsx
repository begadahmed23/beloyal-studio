"use client";

import { Cake, Check, Loader2, Save } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

type BirthdaySettings = {
  enabled: boolean;
  rewardName: string;
  rewardDescription: string;
  purchaseRequirement: string;
  validityDays: number;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  birthdayDayMessageEnabled: boolean;
  friendDiscountEnabled: boolean;
  oneFriendDiscount: number;
  groupDiscount: number;
  timezone: string;
};

type ApiResponse = {
  settings?: BirthdaySettings;
  message?: string;
};

const EMPTY_SETTINGS: BirthdaySettings = {
  enabled: false,
  rewardName: "Birthday Reward",
  rewardDescription: "",
  purchaseRequirement: "",
  validityDays: 2,
  reminderEnabled: true,
  reminderDaysBefore: 2,
  birthdayDayMessageEnabled: true,
  friendDiscountEnabled: false,
  oneFriendDiscount: 10,
  groupDiscount: 20,
  timezone: "Africa/Cairo",
};

export default function BirthdayRewardsSettings() {
  const router = useRouter();
  const { cafe, theme } = useCafeTheme();
  const isBarbershop = cafe.businessType === "BARBERSHOP";

  const [settings, setSettings] =
    useState<BirthdaySettings>(EMPTY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch(
          "/api/cafe/birthday-settings",
          { cache: "no-store" },
        );

        const data = (await response.json()) as ApiResponse;

        if (!response.ok || !data.settings) {
          throw new Error(
            data.message ?? "Unable to load birthday settings.",
          );
        }

        if (active) {
          setSettings(data.settings);
        }
      } catch (error) {
        if (active) {
          setMessage({
            type: "error",
            text:
              error instanceof Error
                ? error.message
                : "Unable to load birthday settings.",
          });
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  function update<K extends keyof BirthdaySettings>(
    key: K,
    value: BirthdaySettings[K],
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/cafe/birthday-settings",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        },
      );

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.settings) {
        throw new Error(
          data.message ?? "Unable to save birthday settings.",
        );
      }

      setSettings(data.settings);
      setMessage({
        type: "success",
        text: data.message ?? "Birthday reward settings saved.",
      });
      router.refresh();
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Unable to save birthday settings.",
      });
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    borderColor: theme.inputBorder,
    backgroundColor: theme.inputBackground,
    color: theme.textPrimary,
    borderRadius: theme.radiusMedium,
  };

  const disabled = loading || saving || !settings.enabled;

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <section
        className="border p-5 sm:p-7"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
          borderRadius: theme.radiusLarge,
          boxShadow: theme.cardShadow,
        }}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center"
              style={{
                backgroundColor: theme.accentSoft,
                color: theme.accent,
                borderRadius: theme.radiusMedium,
              }}
            >
              <Cake size={20} />
            </div>

            <div>
              <h3
                className="text-lg font-semibold"
                style={{ color: theme.textPrimary }}
              >
                Birthday Rewards
              </h3>
              <p
                className="mt-1 max-w-2xl text-sm leading-6"
                style={{ color: theme.textMuted }}
              >
                Offer a birthday benefit to members. The same settings power
                the customer card, staff redemption, dashboard counts, and
                WhatsApp birthday messages.
              </p>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3">
            <span
              className="text-sm font-medium"
              style={{ color: theme.textSecondary }}
            >
              {settings.enabled ? "Enabled" : "Disabled"}
            </span>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) =>
                update("enabled", event.target.checked)
              }
              disabled={loading || saving}
              className="sr-only"
            />
            <span
              className="relative h-7 w-12 rounded-full transition"
              style={{
                backgroundColor: settings.enabled
                  ? theme.accent
                  : theme.inputBorder,
                opacity: loading || saving ? 0.6 : 1,
              }}
            >
              <span
                className="absolute top-1 h-5 w-5 rounded-full bg-white transition-all"
                style={{
                  left: settings.enabled ? "24px" : "4px",
                }}
              />
            </span>
          </label>
        </div>

        {message && (
          <div
            className="mt-5 flex items-start gap-2 border px-4 py-3 text-sm"
            style={{
              borderColor:
                message.type === "success"
                  ? theme.accent
                  : theme.danger,
              color:
                message.type === "success"
                  ? theme.textPrimary
                  : theme.danger,
              backgroundColor: theme.surfaceRaised,
              borderRadius: theme.radiusMedium,
            }}
          >
            {message.type === "success" && (
              <Check size={17} className="mt-0.5 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <div
          className="mt-6 grid gap-5 transition"
          style={{ opacity: settings.enabled ? 1 : 0.48 }}
        >
          <div className="grid gap-5 lg:grid-cols-2">
            <Field
              label="Birthday reward"
              description="The short reward name shown to members and staff."
              theme={theme}
            >
              <input
                type="text"
                value={settings.rewardName}
                onChange={(event) =>
                  update("rewardName", event.target.value)
                }
                placeholder={
                  isBarbershop
                    ? "25% off a haircut"
                    : "Complimentary Cookie"
                }
                maxLength={80}
                disabled={disabled}
                className="h-12 w-full border px-4 text-sm outline-none disabled:cursor-not-allowed"
                style={inputStyle}
              />
            </Field>

            <Field
              label="Offer validity"
              description="Total calendar days including the birthday itself."
              theme={theme}
            >
              <select
                value={settings.validityDays}
                onChange={(event) =>
                  update("validityDays", Number(event.target.value))
                }
                disabled={disabled}
                className="h-12 w-full border px-4 text-sm outline-none disabled:cursor-not-allowed"
                style={inputStyle}
              >
                <option value={1}>Birthday only</option>
                <option value={2}>Birthday + following day</option>
                <option value={3}>3 days total</option>
                <option value={4}>4 days total</option>
                <option value={5}>5 days total</option>
                <option value={6}>6 days total</option>
                <option value={7}>7 days total</option>
              </select>
            </Field>

            <Field
              label="Reward details"
              description="Optional explanation shown in the birthday offer."
              theme={theme}
            >
              <textarea
                value={settings.rewardDescription}
                onChange={(event) =>
                  update("rewardDescription", event.target.value)
                }
                placeholder={
                  isBarbershop
                    ? "A birthday discount on your next haircut."
                    : "A little something from us to celebrate your day."
                }
                maxLength={300}
                rows={3}
                disabled={disabled}
                className="w-full resize-none border px-4 py-3 text-sm outline-none disabled:cursor-not-allowed"
                style={inputStyle}
              />
            </Field>

            <Field
              label={
                isBarbershop
                  ? "Service requirement"
                  : "Purchase requirement"
              }
              description="Optional condition required to receive the birthday reward."
              theme={theme}
            >
              <textarea
                value={settings.purchaseRequirement}
                onChange={(event) =>
                  update("purchaseRequirement", event.target.value)
                }
                placeholder={
                  isBarbershop
                    ? "Valid with a paid haircut."
                    : "Available with any drink purchase."
                }
                maxLength={300}
                rows={3}
                disabled={disabled}
                className="w-full resize-none border px-4 py-3 text-sm outline-none disabled:cursor-not-allowed"
                style={inputStyle}
              />
            </Field>
          </div>

          <div
            className="border p-5"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surfaceRaised,
              borderRadius: theme.radiusMedium,
            }}
          >
            <ToggleRow
              label="Friend discounts"
              description="Apply a larger bill discount when the birthday member celebrates with friends."
              checked={settings.friendDiscountEnabled}
              disabled={disabled}
              onChange={(checked) =>
                update("friendDiscountEnabled", checked)
              }
              theme={theme}
            />

            <div
              className="mt-5 grid gap-4 sm:grid-cols-2"
              style={{
                opacity: settings.friendDiscountEnabled ? 1 : 0.45,
              }}
            >
              <PercentField
                label="1 friend"
                value={settings.oneFriendDiscount}
                disabled={disabled || !settings.friendDiscountEnabled}
                onChange={(value) =>
                  update("oneFriendDiscount", value)
                }
                theme={theme}
              />
              <PercentField
                label="2+ friends"
                value={settings.groupDiscount}
                disabled={disabled || !settings.friendDiscountEnabled}
                onChange={(value) =>
                  update("groupDiscount", value)
                }
                theme={theme}
              />
            </div>
          </div>

          <div
            className="border p-5"
            style={{
              borderColor: theme.border,
              backgroundColor: theme.surfaceRaised,
              borderRadius: theme.radiusMedium,
            }}
          >
            <p
              className="text-sm font-semibold"
              style={{ color: theme.textPrimary }}
            >
              WhatsApp birthday messages
            </p>
            <p
              className="mt-1 text-xs leading-5"
              style={{ color: theme.textMuted }}
            >
              These switches control birthday messaging only. Messages are sent
              only when this business has a WhatsApp connection in BeLoyal.
            </p>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <ToggleRow
                label="Pre-birthday reminder"
                description="Send a WhatsApp message before the member’s birthday."
                checked={settings.reminderEnabled}
                disabled={disabled}
                onChange={(checked) =>
                  update("reminderEnabled", checked)
                }
                theme={theme}
              />

              <Field
                label="Days before"
                description="How early the reminder should be sent."
                theme={theme}
              >
                <input
                  type="number"
                  min={1}
                  max={30}
                  step={1}
                  value={settings.reminderDaysBefore}
                  onChange={(event) =>
                    update(
                      "reminderDaysBefore",
                      Number(event.target.value),
                    )
                  }
                  disabled={disabled || !settings.reminderEnabled}
                  className="h-12 w-full border px-4 text-sm outline-none disabled:cursor-not-allowed"
                  style={inputStyle}
                />
              </Field>

              <ToggleRow
                label="Birthday-day message"
                description="Send another birthday message on the member’s actual birthday."
                checked={settings.birthdayDayMessageEnabled}
                disabled={disabled}
                onChange={(checked) =>
                  update("birthdayDayMessageEnabled", checked)
                }
                theme={theme}
              />
            </div>
          </div>

          <Field
            label="Business timezone"
            description="Used for birthday dates, offer validity, and scheduled messages."
            theme={theme}
          >
            <input
              type="text"
              value={settings.timezone}
              onChange={(event) =>
                update("timezone", event.target.value)
              }
              placeholder="Africa/Cairo"
              maxLength={100}
              disabled={disabled}
              className="h-12 w-full border px-4 text-sm outline-none disabled:cursor-not-allowed"
              style={inputStyle}
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={loading || saving}
            className="flex h-11 items-center justify-center gap-2 px-5 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              backgroundColor: theme.accent,
              color: theme.buttonText,
              borderRadius: theme.radiusMedium,
            }}
          >
            {saving ? (
              <Loader2 size={17} className="animate-spin" />
            ) : (
              <Save size={17} />
            )}
            {saving ? "Saving..." : "Save Birthday Settings"}
          </button>
        </div>
      </section>
    </form>
  );
}

function Field({
  label,
  description,
  theme,
  children,
}: {
  label: string;
  description: string;
  theme: ReturnType<typeof useCafeTheme>["theme"];
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="text-sm font-medium"
        style={{ color: theme.textPrimary }}
      >
        {label}
      </span>
      <span
        className="mt-1 block text-xs leading-5"
        style={{ color: theme.textMuted }}
      >
        {description}
      </span>
      <span className="mt-3 block">{children}</span>
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
  theme,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  theme: ReturnType<typeof useCafeTheme>["theme"];
}) {
  return (
    <label className="flex items-start justify-between gap-4">
      <span>
        <span
          className="block text-sm font-medium"
          style={{ color: theme.textPrimary }}
        >
          {label}
        </span>
        <span
          className="mt-1 block text-xs leading-5"
          style={{ color: theme.textMuted }}
        >
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        className="mt-1 h-4 w-4 shrink-0 disabled:cursor-not-allowed"
        style={{ accentColor: theme.accent }}
      />
    </label>
  );
}

function PercentField({
  label,
  value,
  disabled,
  onChange,
  theme,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onChange: (value: number) => void;
  theme: ReturnType<typeof useCafeTheme>["theme"];
}) {
  return (
    <label>
      <span
        className="text-xs font-medium"
        style={{ color: theme.textSecondary }}
      >
        {label}
      </span>
      <div className="relative mt-2">
        <input
          type="number"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          disabled={disabled}
          className="h-11 w-full border px-4 pr-10 text-sm outline-none disabled:cursor-not-allowed"
          style={{
            borderColor: theme.inputBorder,
            backgroundColor: theme.inputBackground,
            color: theme.textPrimary,
            borderRadius: theme.radiusMedium,
          }}
        />
        <span
          className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs"
          style={{ color: theme.textMuted }}
        >
          %
        </span>
      </div>
    </label>
  );
}
