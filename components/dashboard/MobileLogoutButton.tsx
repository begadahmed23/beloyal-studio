"use client";

import { useState } from "react";
import { LoaderCircle, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";
import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

export default function MobileLogoutButton() {
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
      className="flex h-10 w-10 items-center justify-center rounded-xl border transition hover:opacity-80 disabled:opacity-50 lg:hidden"
      style={{
        borderColor: theme.border,
        backgroundColor: theme.surface,
        color: theme.textSecondary,
      }}
    >
      {loading ? (
        <LoaderCircle size={17} className="animate-spin" />
      ) : (
        <LogOut size={17} />
      )}
    </button>
  );
}
