"use client";

import { useEffect, useState } from "react";
import { Pencil, Save, X } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

type Customer = {
  id: string;
  memberNumber: string;
  publicToken: string | null;
  name: string;
  phone: string;
  birthday: string;
  stamps: number;
};

type Props = {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (customer: Customer) => void;
};

function birthdayToInputValue(birthday: string) {
  const date = new Date(birthday);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

export default function EditMemberDialog({
  customer,
  open,
  onOpenChange,
  onUpdated,
}: Props) {
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [birthday, setBirthday] = useState(
    birthdayToInputValue(customer.birthday)
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setName(customer.name);
    setPhone(customer.phone);
    setBirthday(birthdayToInputValue(customer.birthday));
    setError("");
  }, [open, customer]);

  async function updateMember() {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanPhone || !birthday) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^\d{11}$/.test(cleanPhone)) {
      setError("Phone number must contain exactly 11 digits.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: cleanName,
          phone: cleanPhone,
          birthday,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update member.");
      }

      onUpdated(data);
      onOpenChange(false);

      window.dispatchEvent(new Event("members-updated"));
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update member."
      );
    } finally {
      setLoading(false);
    }
  }

  function closeDialog() {
    if (loading) return;

    setError("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          overflow-hidden
          border
          border-white/[0.08]
          bg-[#0d0d0d]
          p-0
          text-white
          shadow-[0_30px_100px_rgba(0,0,0,0.65)]
          sm:max-w-md
          [&>button]:hidden
        "
      >
        {/* Header */}
        <div className="border-b border-white/[0.07] px-6 py-5">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.06] text-white">
                  <Pencil size={17} strokeWidth={1.8} />
                </div>

                <DialogTitle className="text-2xl font-semibold tracking-[-0.03em] text-white">
                  Edit member
                </DialogTitle>

                <p className="mt-1.5 text-sm leading-6 text-[#9b9b9b]">
                  Update the member&apos;s personal information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                disabled={loading}
                aria-label="Close edit member dialog"
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-white/[0.08]
                  bg-white/[0.04]
                  text-[#a3a3a3]
                  transition
                  hover:bg-white/[0.08]
                  hover:text-white
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <X size={17} />
              </button>
            </div>
          </DialogHeader>
        </div>

        {/* Form */}
        <div className="space-y-5 px-6 py-6">
          <div>
            <label
              htmlFor="edit-member-name"
              className="mb-2 block text-sm font-medium text-[#d6d6d6]"
            >
              Full name
            </label>

            <Input
              id="edit-member-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ahmed Mohamed"
              autoComplete="name"
              disabled={loading}
              className="
                h-12
                rounded-xl
                border-white/[0.09]
                bg-white/[0.045]
                px-4
                text-white
                shadow-none
                outline-none
                transition
                placeholder:text-[#5f5f5f]
                hover:border-white/[0.15]
                focus-visible:border-white/30
                focus-visible:ring-2
                focus-visible:ring-white/[0.08]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            />
          </div>

          <div>
            <label
              htmlFor="edit-member-phone"
              className="mb-2 block text-sm font-medium text-[#d6d6d6]"
            >
              Phone number
            </label>

            <Input
              id="edit-member-phone"
              value={phone}
              onChange={(event) => {
                const digits = event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 11);

                setPhone(digits);
              }}
              inputMode="numeric"
              maxLength={11}
              placeholder="01012345678"
              autoComplete="tel"
              disabled={loading}
              className="
                h-12
                rounded-xl
                border-white/[0.09]
                bg-white/[0.045]
                px-4
                text-white
                shadow-none
                outline-none
                transition
                placeholder:text-[#5f5f5f]
                hover:border-white/[0.15]
                focus-visible:border-white/30
                focus-visible:ring-2
                focus-visible:ring-white/[0.08]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            />

            <p className="mt-2 text-xs text-[#6f6f6f]">
              Enter exactly 11 digits.
            </p>
          </div>

          <div>
            <label
              htmlFor="edit-member-birthday"
              className="mb-2 block text-sm font-medium text-[#d6d6d6]"
            >
              Birthday
            </label>

            <Input
              id="edit-member-birthday"
              type="date"
              value={birthday}
              onChange={(event) => setBirthday(event.target.value)}
              disabled={loading}
              className="
                h-12
                rounded-xl
                border-white/[0.09]
                bg-white/[0.045]
                px-4
                text-white
                shadow-none
                outline-none
                transition
                [color-scheme:dark]
                hover:border-white/[0.15]
                focus-visible:border-white/30
                focus-visible:ring-2
                focus-visible:ring-white/[0.08]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            />
          </div>

          {error && (
            <div
              role="alert"
              className="
                rounded-xl
                border
                border-red-400/20
                bg-red-400/[0.08]
                px-4
                py-3
                text-sm
                leading-5
                text-red-200
              "
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={closeDialog}
              disabled={loading}
              className="
                h-12
                flex-1
                rounded-xl
                border
                border-white/[0.09]
                bg-white/[0.04]
                text-sm
                font-medium
                text-[#c7c7c7]
                transition
                hover:border-white/[0.14]
                hover:bg-white/[0.075]
                hover:text-white
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={updateMember}
              disabled={loading}
              className="
                flex
                h-12
                flex-1
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-white
                text-sm
                font-semibold
                text-black
                transition
                hover:bg-[#e9e9e9]
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <Save size={17} strokeWidth={2} />

              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}