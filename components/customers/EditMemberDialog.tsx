"use client";

import { useEffect, useState } from "react";
import { Pencil, Save } from "lucide-react";

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
    if (open) {
      setName(customer.name);
      setPhone(customer.phone);
      setBirthday(birthdayToInputValue(customer.birthday));
      setError("");
    }
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

      const response = await fetch(
        `/api/customers/${customer.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: cleanName,
            phone: cleanPhone,
            birthday,
          }),
        }
      );

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/[0.08] bg-[#111111] p-0 text-white shadow-2xl sm:max-w-md">
        <div className="border-b border-white/[0.06] px-6 py-5">
          <DialogHeader>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#8e6045]/20 text-[#d9af8d]">
              <Pencil size={18} />
            </div>

            <DialogTitle className="text-2xl font-semibold tracking-tight">
              Edit member
            </DialogTitle>

            <p className="mt-1 text-sm text-[#817771]">
              Update the member’s personal information.
            </p>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 pb-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-[#b9aaa0]">
              Full name
            </label>

            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ahmed Mohamed"
              className="h-12 rounded-xl border-white/[0.08] bg-white/[0.035] text-white placeholder:text-[#5d5753]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#b9aaa0]">
              Phone number
            </label>

            <Input
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
              className="h-12 rounded-xl border-white/[0.08] bg-white/[0.035] text-white placeholder:text-[#5d5753]"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[#b9aaa0]">
              Birthday
            </label>

            <Input
              type="date"
              value={birthday}
              onChange={(event) => setBirthday(event.target.value)}
              className="h-12 rounded-xl border-white/[0.08] bg-white/[0.035] text-white"
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="h-12 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-[#b9aaa0] transition hover:bg-white/[0.06]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={updateMember}
              disabled={loading}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#8e6045] text-sm font-semibold text-white transition hover:bg-[#a06d4e] disabled:opacity-50"
            >
              <Save size={17} />
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}