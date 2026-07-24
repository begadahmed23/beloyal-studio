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

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

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

export default function MemberCard({ customer: originalCustomer }: Props) {
  const { theme, cafe } = useCafeTheme();

  const [customer, setCustomer] = useState<Customer>(originalCustomer);

  const [profileOpen, setProfileOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [redeemOpen, setRedeemOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);

  const [messageTitle, setMessageTitle] = useState("Done");
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(false);

  const rewardTarget = Math.max(cafe.rewardTarget, 1);

  const visibleStamps = Math.min(customer.stamps, rewardTarget);

  const rewardReady = customer.stamps >= rewardTarget;

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

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://getbeloyal.app";

  return `${baseUrl}/card/${customer.publicToken}`;
}

  function openCard() {
    const cardUrl = getCardUrl();

    if (!cardUrl) {
      showMessage(
        "Card unavailable",
        "This member does not have a secure card token yet.",
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
        "This member does not have a secure card token yet.",
      );

      return;
    }

    try {
      await navigator.clipboard.writeText(cardUrl);

      showMessage("Link copied", "The customer card link is ready to paste.");
    } catch (error) {
      console.error(error);

      showMessage("Copy failed", "The browser could not copy the card link.");
    }
  }

  async function shareCard() {
    const cardUrl = getCardUrl();

    if (!cardUrl) {
      showMessage(
        "Card unavailable",
        "This member does not have a secure card token yet.",
      );

      return;
    }

    const text = `Welcome to ${cafe.name}, ${customer.name}. Here is your digital loyalty card.`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${cafe.name} Loyalty Card`,
          text,
          url: cardUrl,
        });

        return;
      }

      await navigator.clipboard.writeText(`${text}\n${cardUrl}`);

      showMessage(
        "Message copied",
        "Native sharing is unavailable, so the message and link were copied.",
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error(error);

      showMessage(
        "Share failed",
        "The browser could not share the customer card.",
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

      const responseText = await response.text();

      let data: Customer | { message?: string };

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          "message" in data && data.message
            ? data.message
            : "Failed to add stamp.",
        );
      }

      setCustomer(data as Customer);
      notifyDashboard();

      showMessage("Stamp added", "The customer card was updated successfully.");
    } catch (error) {
      console.error(error);

      showMessage(
        "Could not add stamp",
        error instanceof Error ? error.message : "Something went wrong.",
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

      const responseText = await response.text();

      let data: Customer | { message?: string };

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(
          "message" in data && data.message
            ? data.message
            : "Failed to redeem reward.",
        );
      }

      setCustomer(data as Customer);
      setRedeemOpen(false);
      notifyDashboard();

      showMessage(
        "Reward redeemed",
        `${cafe.rewardName} was redeemed successfully.`,
      );
    } catch (error) {
      console.error(error);

      showMessage(
        "Could not redeem reward",
        error instanceof Error ? error.message : "Something went wrong.",
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

      const response = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
      });

      const responseText = await response.text();

      let data: { message?: string } = {};

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {};
        }
      }

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete member.");
      }

      setDeleteOpen(false);
      setProfileOpen(false);
      notifyDashboard();
    } catch (error) {
      console.error(error);

      showMessage(
        "Delete failed",
        error instanceof Error ? error.message : "Something went wrong.",
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
      "The member details were saved successfully.",
    );
  }

  function openEditDialog() {
    setProfileOpen(false);

    window.setTimeout(() => {
      setEditOpen(true);
    }, 150);
  }

  const standardButtonStyle = {
    borderColor: theme.border,
    backgroundColor: theme.surfaceRaised,
    color: theme.textPrimary,
    borderRadius: theme.radiusMedium,
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setProfileOpen(true)}
        className="group w-full border p-5 text-left transition duration-200 hover:-translate-y-0.5 hover:brightness-105"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.surface,
          color: theme.textPrimary,
          borderRadius: theme.radiusMedium,
          boxShadow: theme.cardShadow,
        }}
      >
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <div
              className="flex items-center gap-2 text-xs font-medium"
              style={{
                color: theme.textSecondary,
              }}
            >
              <Hash size={13} />

              <span>{customer.memberNumber}</span>
            </div>

            <h4
              className="mt-3 truncate text-lg font-semibold tracking-tight"
              style={{
                color: theme.textPrimary,
              }}
            >
              {customer.name}
            </h4>

            <div
              className="mt-2 flex items-center gap-2 text-sm"
              style={{
                color: theme.textMuted,
              }}
            >
              <Phone size={14} />
              <span>{customer.phone}</span>
            </div>
          </div>

          <div
            className="shrink-0 border px-3 py-1.5 text-xs font-semibold"
            style={{
              borderColor: rewardReady ? `${theme.success}55` : theme.border,
              backgroundColor: rewardReady
                ? `${theme.success}18`
                : theme.accentSoft,
              color: rewardReady ? theme.success : theme.textSecondary,
              borderRadius: "999px",
            }}
          >
            {rewardReady ? "Reward ready" : `${visibleStamps}/${rewardTarget}`}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1.5">
          {Array.from({
            length: rewardTarget,
          }).map((_, index) => {
            const filled = index < visibleStamps;

            return (
              <div
                key={index}
                className="flex aspect-square items-center justify-center border"
                style={{
                  borderColor: filled ? `${theme.accent}70` : theme.border,
                  backgroundColor: filled
                    ? theme.accentSoft
                    : theme.surfaceRaised,
                  borderRadius: "10px",
                }}
              >
                <Coffee
                  size={15}
                  style={{
                    color: filled ? theme.accent : theme.textMuted,
                    fill: filled ? theme.accent : "transparent",
                  }}
                />
              </div>
            );
          })}
        </div>
      </button>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent
          className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto border p-0 shadow-2xl"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
            color: theme.textPrimary,
            borderRadius: theme.radiusLarge,
          }}
        >
          <div className="absolute right-14 top-4 z-50 flex gap-2">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="flex h-9 items-center gap-2 border px-3 text-sm font-semibold transition hover:opacity-80"
              style={{
                borderColor: `${theme.danger}55`,
                backgroundColor: `${theme.danger}18`,
                color: theme.danger,
                borderRadius: "10px",
              }}
            >
              <Trash2 size={15} />
              Delete
            </button>

            <button
              type="button"
              onClick={openEditDialog}
              className="flex h-9 items-center gap-2 px-4 text-sm font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: theme.accent,
                color: theme.buttonText,
                borderRadius: "10px",
              }}
            >
              <Pencil size={15} />
              Edit
            </button>
          </div>

          <div
            className="border-b px-6 py-5 pr-64"
            style={{
              borderColor: theme.border,
            }}
          >
            <div
              className="flex items-center gap-2 text-xs font-medium"
              style={{
                color: theme.textSecondary,
              }}
            >
              <Hash size={13} />
              {customer.memberNumber}
            </div>

            <DialogTitle
              className="mt-2 text-2xl font-semibold"
              style={{
                color: theme.textPrimary,
              }}
            >
              {customer.name}
            </DialogTitle>
          </div>

          <div className="space-y-5 px-6 pb-6 pt-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div
                className="border p-4"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.surfaceRaised,
                  borderRadius: theme.radiusMedium,
                }}
              >
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{
                    color: theme.textMuted,
                  }}
                >
                  <Phone size={14} />
                  Phone number
                </div>

                <p
                  className="mt-2 text-sm font-medium"
                  style={{
                    color: theme.textPrimary,
                  }}
                >
                  {customer.phone}
                </p>
              </div>

              <div
                className="border p-4"
                style={{
                  borderColor: theme.border,
                  backgroundColor: theme.surfaceRaised,
                  borderRadius: theme.radiusMedium,
                }}
              >
                <div
                  className="flex items-center gap-2 text-xs"
                  style={{
                    color: theme.textMuted,
                  }}
                >
                  <CalendarDays size={14} />
                  Birthday
                </div>

                <p
                  className="mt-2 text-sm font-medium"
                  style={{
                    color: theme.textPrimary,
                  }}
                >
                  {formattedBirthday}
                </p>
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
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: theme.textPrimary,
                    }}
                  >
                    Digital stamp card
                  </p>

                  <p
                    className="mt-1 text-xs"
                    style={{
                      color: theme.textMuted,
                    }}
                  >
                    {cafe.eligiblePurchaseDescription ||
                      "One stamp for every eligible purchase"}
                  </p>
                </div>

                <p
                  className="text-sm font-semibold"
                  style={{
                    color: rewardReady ? theme.success : theme.textSecondary,
                  }}
                >
                  {rewardReady
                    ? "Reward ready"
                    : `${visibleStamps}/${rewardTarget}`}
                </p>
              </div>

              <div className="mt-5 grid grid-cols-7 gap-2">
                {Array.from({
                  length: rewardTarget,
                }).map((_, index) => {
                  const filled = index < visibleStamps;

                  return (
                    <div
                      key={index}
                      className="flex aspect-square items-center justify-center border"
                      style={{
                        borderColor: filled
                          ? `${theme.accent}70`
                          : theme.border,
                        backgroundColor: filled
                          ? theme.accentSoft
                          : theme.surface,
                        borderRadius: "12px",
                      }}
                    >
                      <Coffee
                        size={20}
                        style={{
                          color: filled ? theme.accent : theme.textMuted,
                          fill: filled ? theme.accent : "transparent",
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p
                className="mb-3 text-xs font-medium uppercase tracking-[0.14em]"
                style={{
                  color: theme.textMuted,
                }}
              >
                Customer card
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={openCard}
                  disabled={!customer.publicToken}
                  className="flex h-11 items-center justify-center gap-2 border text-xs font-semibold transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  style={standardButtonStyle}
                >
                  <ExternalLink size={15} />
                  Open
                </button>

                <button
                  type="button"
                  onClick={copyCardLink}
                  disabled={!customer.publicToken}
                  className="flex h-11 items-center justify-center gap-2 border text-xs font-semibold transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  style={standardButtonStyle}
                >
                  <Copy size={15} />
                  Copy
                </button>

                <button
                  type="button"
                  onClick={shareCard}
                  disabled={!customer.publicToken}
                  className="flex h-11 items-center justify-center gap-2 border text-xs font-semibold transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    borderColor: `${theme.accent}60`,
                    backgroundColor: theme.accentSoft,
                    color: theme.textSecondary,
                    borderRadius: theme.radiusMedium,
                  }}
                >
                  <Share2 size={15} />
                  Share
                </button>
              </div>

              {!customer.publicToken && (
                <div
                  className="mt-3 flex items-center gap-2 border px-3 py-2 text-xs"
                  style={{
                    borderColor: `${theme.warning}45`,
                    backgroundColor: `${theme.warning}12`,
                    color: theme.warning,
                    borderRadius: theme.radiusMedium,
                  }}
                >
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
                className="flex h-12 w-full items-center justify-center gap-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: theme.success,
                  color: "#ffffff",
                  borderRadius: theme.radiusMedium,
                }}
              >
                <Gift size={18} />
                Redeem {cafe.rewardName}
              </button>
            ) : (
              <button
                type="button"
                onClick={addStamp}
                disabled={loading}
                className="flex h-12 w-full items-center justify-center gap-2 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
                style={{
                  backgroundColor: theme.accent,
                  color: theme.buttonText,
                  borderRadius: theme.radiusMedium,
                }}
              >
                <Coffee size={18} />

                {loading ? "Adding Stamp..." : "Add Stamp"}
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

      <AlertDialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <AlertDialogContent
          className="border"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
            color: theme.textPrimary,
            borderRadius: theme.radiusLarge,
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Redeem {cafe.rewardName}?</AlertDialogTitle>

            <AlertDialogDescription
              style={{
                color: theme.textMuted,
              }}
            >
              This will reset the completed card for {customer.name} to 0/
              {rewardTarget}.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="border hover:opacity-80"
              style={standardButtonStyle}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={redeemReward}
              className="hover:opacity-90"
              style={{
                backgroundColor: theme.success,
                color: "#ffffff",
              }}
            >
              {loading ? "Redeeming..." : "Confirm Redemption"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent
          className="border"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
            color: theme.textPrimary,
            borderRadius: theme.radiusLarge,
          }}
        >
          <AlertDialogHeader>
            <div
              className="mb-2 flex h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${theme.danger}18`,
                color: theme.danger,
              }}
            >
              <Trash2 size={22} />
            </div>

            <AlertDialogTitle>Delete member?</AlertDialogTitle>

            <AlertDialogDescription
              style={{
                color: theme.textMuted,
              }}
            >
              This permanently deletes{" "}
              <strong
                style={{
                  color: theme.textPrimary,
                }}
              >
                {customer.name}
              </strong>
              , their digital loyalty card, and their complete stamp history.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              className="border hover:opacity-80"
              style={standardButtonStyle}
            >
              Cancel
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={deleteMember}
              className="text-white hover:opacity-90"
              style={{
                backgroundColor: theme.danger,
              }}
            >
              {loading ? "Deleting..." : "Delete Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={messageOpen} onOpenChange={setMessageOpen}>
        <AlertDialogContent
          className="border"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.surface,
            color: theme.textPrimary,
            borderRadius: theme.radiusLarge,
          }}
        >
          <AlertDialogHeader>
            <div
              className="mb-2 flex h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor: `${theme.success}18`,
                color: theme.success,
              }}
            >
              <CheckCircle2 size={22} />
            </div>

            <AlertDialogTitle>{messageTitle}</AlertDialogTitle>

            <AlertDialogDescription
              style={{
                color: theme.textMuted,
              }}
            >
              {messageText}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => setMessageOpen(false)}
              className="hover:opacity-90"
              style={{
                backgroundColor: theme.accent,
                color: theme.buttonText,
              }}
            >
              Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
