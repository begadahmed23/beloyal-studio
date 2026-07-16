"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LoaderCircle,
  LockKeyhole,
  Mail,
  Eye,
  EyeOff,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { error } = await authClient.signIn.email({
  email: cleanEmail,
  password,
  rememberMe,
  fetchOptions: {
    onError: async (context) => {
      if (context.response.status === 429) {
        const retryAfter =
          context.response.headers.get("X-Retry-After");

        setError(
          `Too many login attempts. Try again in ${
            retryAfter ?? "a few"
          } seconds.`
        );
      }
    },
  },
});

      if (error) {
  if (error.status === 429) {
    return;
  }

  setError(
    error.message ||
      "The email or password is incorrect."
  );

  return;
}

      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      console.error(error);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0c0c0c] p-6">
      <div className="w-full max-w-md rounded-[30px] border border-white/[0.07] bg-[#151515] p-8 shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-10">
        <div className="mb-9 text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-[#d6b08c]">
            Loretto
          </h1>

          <p className="mt-3 text-sm text-[#8f8278]">
            Loyalty Management System
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-[#c7ad99]"
            >
              Email
            </label>

            <div className="relative">
              <Mail
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#756a62]"
              />

              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="employee@loretto.com"
                autoComplete="email"
                disabled={loading}
                className="h-12 rounded-xl border-white/[0.08] bg-white/[0.035] pl-11 text-white placeholder:text-[#5f5752] focus-visible:border-[#8e6045]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-[#c7ad99]"
            >
              Password
            </label>

            <div className="relative">
              <LockKeyhole
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#756a62]"
              />

              <div className="relative">
  <LockKeyhole
    size={17}
    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#756a62]"
  />

  <Input
    id="password"
    type={showPassword ? "text" : "password"}
    value={password}
    onChange={(event) => setPassword(event.target.value)}
    placeholder="Enter your password"
    autoComplete="current-password"
    disabled={loading}
    className="h-12 rounded-xl border-white/[0.08] bg-white/[0.035] pl-11 pr-11 text-white placeholder:text-[#5f5752]"
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7b7068] hover:text-white"
  >
    {showPassword ? (
      <EyeOff size={18} />
    ) : (
      <Eye size={18} />
    )}
  </button>
</div>
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 text-sm text-[#8f8278]">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) =>
                setRememberMe(event.target.checked)
              }
              disabled={loading}
              className="h-4 w-4 accent-[#8e6045]"
            />

            Keep me signed in
          </label>

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.07] px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-12 w-full rounded-xl bg-[#8e6045] text-sm font-semibold text-white hover:bg-[#a06d4e] disabled:opacity-50"
          >
            {loading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Login"
            )}
          </Button>
        </form>

        <p className="mt-7 text-center text-xs text-[#5f5752]">
          Authorized Loretto staff only
        </p>
      </div>
    </main>
  );
}