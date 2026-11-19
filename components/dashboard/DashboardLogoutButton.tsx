"use client";

import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

export default function DashboardLogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const { theme } = useCafeTheme();
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
      aria-label={loading ? "Signing out" : "Sign out"}
      title="Sign out"
      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-70 ${compact ? "w-11" : "w-full px-3"}`}
      style={{
        borderColor: theme.border,
        backgroundColor: theme.surface,
        color: theme.textSecondary,
      }}
    >
      {loading ? (
        <LoaderCircle size={17} className="motion-safe:animate-spin" aria-hidden="true" />
      ) : (
        <LogOut size={17} aria-hidden="true" />
      )}
      {!compact && "Sign out"}
    </button>
  );
}
