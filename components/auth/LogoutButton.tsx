"use client";

import { useState } from "react";
import { LogOut, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    try {
      setLoading(true);

      await authClient.signOut();

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="flex h-11 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.035] px-4 text-sm font-medium text-[#cbbcaf] transition hover:bg-white/[0.07] disabled:opacity-50"
    >
      {loading ? (
        <LoaderCircle size={17} className="animate-spin" />
      ) : (
        <LogOut size={17} />
      )}

      Logout
    </button>
  );
}
