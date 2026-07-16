"use client";

import { useState } from "react";
import { Plus, UserPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

export default function NewCustomerDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setName("");
    setPhone("");
    setBirthday("");
  }

  async function createMember() {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName || !cleanPhone || !birthday) {
      alert("Please fill in all fields.");
      return;
    }

    if (!/^\d{11}$/.test(cleanPhone)) {
      alert("Phone number must contain exactly 11 digits.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/customers", {
        method: "POST",
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
        throw new Error(data.message || "Failed to create member");
      }

      resetForm();
      setOpen(false);

      window.dispatchEvent(new Event("members-updated"));
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while creating the member."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#8e6045] px-5 text-sm font-semibold text-white transition hover:bg-[#a06d4e]"
      >
        <Plus size={18} />
        New Member
      </button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);

          if (!nextOpen && !loading) {
            resetForm();
          }
        }}
      >
        <DialogContent className="border-white/[0.08] bg-[#111111] p-0 text-white shadow-2xl sm:max-w-md">
          <div className="border-b border-white/[0.06] px-6 py-5">
            <DialogHeader>
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#8e6045]/20 text-[#d9af8d]">
                <UserPlus size={19} />
              </div>

              <DialogTitle className="text-2xl font-semibold tracking-tight">
                New member
              </DialogTitle>

              <p className="mt-1 text-sm text-[#817771]">
                Create a loyalty account for a customer.
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
                autoComplete="name"
                className="h-12 rounded-xl border-white/[0.08] bg-white/[0.035] text-white placeholder:text-[#5d5753] focus-visible:border-[#8e6045]"
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
                autoComplete="tel"
                className="h-12 rounded-xl border-white/[0.08] bg-white/[0.035] text-white placeholder:text-[#5d5753] focus-visible:border-[#8e6045]"
              />

              <p className="mt-2 text-xs text-[#68615d]">
                Must contain exactly 11 digits.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#b9aaa0]">
                Birthday
              </label>

              <Input
                type="date"
                value={birthday}
                onChange={(event) => setBirthday(event.target.value)}
                className="h-12 rounded-xl border-white/[0.08] bg-white/[0.035] text-white focus-visible:border-[#8e6045]"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="h-12 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] text-sm font-medium text-[#b9aaa0] transition hover:bg-white/[0.06] disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createMember}
                disabled={loading}
                className="h-12 flex-1 rounded-xl bg-[#8e6045] text-sm font-semibold text-white transition hover:bg-[#a06d4e] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Member"}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}