"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Coffee,
  Copy,
  ExternalLink,
  Gift,
  Hash,
  Link2,
  Pencil,
  Phone,
  Share2,
  Trash2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import EditMemberDialog from "./EditMemberDialog";

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
};

const REWARD_TARGET = 7;

export default function MemberCard({
  customer: originalCustomer,
}: Props) {
  const [customer, setCustomer] = useState<Customer>(originalCustomer);

  const [profileOpen, setProfileOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);

  const [messageTitle, setMessageTitle] = useState("Done");
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);

  const visibleStamps = Math.min(customer.stamps, REWARD_TARGET);
  const rewardReady = customer.stamps >= REWARD_TARGET;

  const formattedBirthday = useMemo(() => {
    const date = new Date(customer.birthday);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }, [customer.birthday]);

  function showMessage(title: string, text: string) {
    setMessageTitle(title);
    setMessageText(text);
    setMessageOpen(true);
  }

  function notifyDashboard() {
    window.dispatchEvent(new Event("members-updated"));
  }

  function getCardUrl() {
    if (!customer.publicToken) {
      return null;
    }

    return `${window.location.origin}/card/${customer.publicToken}`;
  }

  function openCard() {
    const cardUrl = getCardUrl();

    if (!cardUrl) {
      showMessage(
        "Card unavailable",
        "This member does not have a secure card token yet."
      );
      return;
    }

    window.open(cardUrl, "_blank", "noopener,noreferrer");
  }

  async function copyCardLink() {
    const cardUrl = getCardUrl();

    if (!cardUrl) {
      showMessage(
        "Card unavailable",
        "This member does not have a secure card token yet."
      );
      return;
    }

    try {
      await navigator.clipboard.writeText(cardUrl);

      showMessage(
        "Link copied",
        "The customer card link is ready to paste."
      );
    } catch (error) {
      console.error(error);

      showMessage(
        "Copy failed",
        "The browser could not copy the card link."
      );
    }
  }

  async function shareCard() {
    const cardUrl = getCardUrl();

    if (!cardUrl) {
      showMessage(
        "Card unavailable",
        "This member does not have a secure card token yet."
      );
      return;
    }

    const text = `Welcome to Loretto, ${customer.name}. Here is your digital loyalty card.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Loretto Loyalty Card",
          text,
          url: cardUrl,
        });

        return;
      }

      await navigator.clipboard.writeText(`${text}\n${cardUrl}`);

      showMessage(
        "Message copied",
        "Native sharing is unavailable, so the message and link were copied."
      );
    } catch (error) {
      if (
        error instanceof DOMException &&
        error.name === "AbortError"
      ) {
        return;
      }

      console.error(error);

      showMessage(
        "Share failed",
        "The browser could not share the customer card."
      );
    }
  }

  async function addStamp() {
    if (loading || rewardReady) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/customers/stamp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: customer.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add stamp.");
      }

      setCustomer(data);
      notifyDashboard();

      showMessage(
        "Stamp added",
        "The customer card was updated successfully."
      );
    } catch (error) {
      console.error(error);

      showMessage(
        "Could not add stamp",
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function redeemReward() {
    if (loading || !rewardReady) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/customers/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: customer.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to redeem reward."
        );
      }

      setCustomer(data);
      setRedeemOpen(false);
      notifyDashboard();

      showMessage(
        "Reward redeemed",
        "The free drink was redeemed successfully."
      );
    } catch (error) {
      console.error(error);

      showMessage(
        "Could not redeem reward",
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function deleteMember() {
    if (loading) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/customers/${customer.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to delete member."
        );
      }

      setDeleteOpen(false);
      setProfileOpen(false);
      notifyDashboard();
    } catch (error) {
      console.error(error);

      showMessage(
        "Delete failed",
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleMemberUpdated(updatedCustomer: Customer) {
    setCustomer(updatedCustomer);
    notifyDashboard();

    showMessage(
      "Member updated",
      "The member details were saved successfully."
    );
  }

  function openEditDialog() {
    setProfileOpen(false);

    window.setTimeout(() => {
      setEditOpen(true);
    }, 150);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setProfileOpen(true)}
        className="group w-full rounded-2xl border border-white/[0.07] bg-[#141414] p-5 text-left shadow-[0_12px_35px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-0.5 hover:border-[#8d634a]/60 hover:bg-[#171513]"
      >
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-medium text-[#a67a5d]">
              <Hash size={13} />
              <span>{customer.memberNumber}</span>
            </div>

            <h4 className="mt-3 truncate text-lg font-semibold tracking-tight text-[#f3eee9]">
              {customer.name}
            </h4>

            <div className="mt-2 flex items-center gap-2 text-sm text-[#8c827c]">
              <Phone size={14} />
              <span>{customer.phone}</span>
            </div>
          </div>

          <div
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              rewardReady
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-[#80563d]/40 bg-[#80563d]/15 text-[#d9af8d]"
            }`}
          >
            {rewardReady
              ? "Reward ready"
              : `${visibleStamps}/${REWARD_TARGET}`}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1.5">
          {Array.from({
            length: REWARD_TARGET,
          }).map((_, index) => {
            const filled = index < visibleStamps;

            return (
              <div
                key={index}
                className={`flex aspect-square items-center justify-center rounded-lg border ${
                  filled
                    ? "border-[#9a6d50]/50 bg-[#9a6d50]/20"
                    : "border-white/[0.07] bg-white/[0.025]"
                }`}
              >
                <Coffee
                  size={15}
                  className={
                    filled
                      ? "fill-[#d6a77f] text-[#d6a77f]"
                      : "text-[#514b47]"
                  }
                />
              </div>
            );
          })}
        </div>
      </button>

      <Dialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
      >
        <DialogContent className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border-white/[0.08] bg-[#111111] p-0 text-white shadow-2xl">
          <div className="absolute right-14 top-4 z-50 flex gap-2">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="flex h-9 items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
            >
              <Trash2 size={15} />
              Delete
            </button>

            <button
              type="button"
              onClick={openEditDialog}
              className="flex h-9 items-center gap-2 rounded-lg bg-[#8e6045] px-4 text-sm font-semibold text-white transition hover:bg-[#a06d4e]"
            >
              <Pencil size={15} />
              Edit
            </button>
          </div>

          <div className="border-b border-white/[0.06] px-6 py-5 pr-64">
            <div className="flex items-center gap-2 text-xs font-medium text-[#a67a5d]">
              <Hash size={13} />
              {customer.memberNumber}
            </div>

            <DialogTitle className="mt-2 text-2xl font-semibold text-[#f3eee9]">
              {customer.name}
            </DialogTitle>
          </div>

          <div className="space-y-5 px-6 pb-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="flex items-center gap-2 text-xs text-[#756c67]">
                  <Phone size={14} />
                  Phone number
                </div>

                <p className="mt-2 text-sm font-medium text-[#e7ded8]">
                  {customer.phone}
                </p>
              </div>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
                <div className="flex items-center gap-2 text-xs text-[#756c67]">
                  <CalendarDays size={14} />
                  Birthday
                </div>

                <p className="mt-2 text-sm font-medium text-[#e7ded8]">
                  {formattedBirthday}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-[#161616] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#ded3ca]">
                    Digital stamp card
                  </p>

                  <p className="mt-1 text-xs text-[#716964]">
                    One stamp for every eligible drink
                  </p>
                </div>

                <p
                  className={`text-sm font-semibold ${
                    rewardReady
                      ? "text-emerald-300"
                      : "text-[#d9af8d]"
                  }`}
                >
                  {rewardReady
                    ? "Reward ready"
                    : `${visibleStamps}/${REWARD_TARGET}`}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-7 gap-2">
                {Array.from({
                  length: REWARD_TARGET,
                }).map((_, index) => {
                  const filled = index < visibleStamps;

                  return (
                    <div
                      key={index}
                      className={`flex aspect-square items-center justify-center rounded-xl border ${
                        filled
                          ? "border-[#9a6d50]/60 bg-[#9a6d50]/20"
                          : "border-white/[0.07] bg-[#101010]"
                      }`}
                    >
                      <Coffee
                        size={20}
                        className={
                          filled
                            ? "fill-[#d6a77f] text-[#d6a77f]"
                            : "text-[#4e4844]"
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-[#716964]">
                Customer card
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={openCard}
                  disabled={!customer.publicToken}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] text-xs font-semibold text-[#d8ccc3] transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ExternalLink size={15} />
                  Open
                </button>

                <button
                  type="button"
                  onClick={copyCardLink}
                  disabled={!customer.publicToken}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] text-xs font-semibold text-[#d8ccc3] transition hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Copy size={15} />
                  Copy
                </button>

                <button
                  type="button"
                  onClick={shareCard}
                  disabled={!customer.publicToken}
                  className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#8e6045]/35 bg-[#8e6045]/15 text-xs font-semibold text-[#e0b895] transition hover:bg-[#8e6045]/25 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Share2 size={15} />
                  Share
                </button>
              </div>

              {!customer.publicToken && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-3 py-2 text-xs text-amber-200/80">
                  <Link2 size={14} />
                  This member needs a secure card token.
                </div>
              )}
            </div>

            {rewardReady ? (
              <button
                type="button"
                onClick={() => setRedeemOpen(true)}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-50"
              >
                <Gift size={18} />
                Redeem Free Drink
              </button>
            ) : (
              <button
                type="button"
                onClick={addStamp}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#8e6045] text-sm font-semibold text-white transition hover:bg-[#a06d4e] disabled:opacity-50"
              >
                <Coffee size={18} />

                {loading
                  ? "Adding Stamp..."
                  : "Add Drink Stamp"}
              </button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <EditMemberDialog
        customer={customer}
        open={editOpen}
        onOpenChange={setEditOpen}
        onUpdated={handleMemberUpdated}
      />

      <AlertDialog
        open={redeemOpen}
        onOpenChange={setRedeemOpen}
      >
        <AlertDialogContent className="border-white/[0.08] bg-[#111111] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Redeem free drink?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-[#8f847d]">
              This will reset the completed card for{" "}
              {customer.name} to 0/{REWARD_TARGET}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.07] hover:text-white">
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={redeemReward}
              className="bg-emerald-700 text-white hover:bg-emerald-600"
            >
              {loading
                ? "Redeeming..."
                : "Confirm Redemption"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      >
        <AlertDialogContent className="border-white/[0.08] bg-[#111111] text-white">
          <AlertDialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-red-300">
              <Trash2 size={22} />
            </div>

            <AlertDialogTitle>
              Delete member?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-[#8f847d]">
              This permanently deletes{" "}
              <strong className="text-white">
                {customer.name}
              </strong>
              , their digital loyalty card, and their complete stamp
              history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/[0.08] bg-white/[0.03] text-white hover:bg-white/[0.07] hover:text-white">
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={deleteMember}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {loading ? "Deleting..." : "Delete Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={messageOpen}
        onOpenChange={setMessageOpen}
      >
        <AlertDialogContent className="border-white/[0.08] bg-[#111111] text-white">
          <AlertDialogHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 size={22} />
            </div>

            <AlertDialogTitle>
              {messageTitle}
            </AlertDialogTitle>

            <AlertDialogDescription className="text-[#8f847d]">
              {messageText}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setMessageOpen(false)}
              className="bg-[#8e6045] text-white hover:bg-[#a06d4e]"
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}