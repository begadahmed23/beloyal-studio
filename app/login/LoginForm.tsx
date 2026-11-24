"use client";

import { type FormEvent, useState } from "react";
import {
  Eye,
  EyeOff,
  LoaderCircle,
  LockKeyhole,
  Mail,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    // Read the DOM values because mobile autofill can fill a field without firing onChange.
    const form = new FormData(event.currentTarget);
    const cleanEmail = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const rememberMe = form.has("rememberMe");

    if (!cleanEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    let navigating = false;
    try {
      setLoading(true);
      setError("");

      const { data, error: signInError } =
        await authClient.signIn.email({
          email: cleanEmail,
          password,
          rememberMe,
          fetchOptions: {
            onError: async (context) => {
              if (context.response.status === 429) {
                const retryAfter =
                  context.response.headers.get(
                    "X-Retry-After"
                  );

                setError(
                  `Too many login attempts. Try again in ${
                    retryAfter ?? "a few"
                  } seconds.`
                );
              }
            },
          },
        });

      if (signInError) {
        if (signInError.status === 429) {
          return;
        }

        setError(
          signInError.message ||
            "The email or password is incorrect."
        );

        return;
      }

      if (!data?.user) {
        setError(
          "Login succeeded, but the user account could not be loaded."
        );
        return;
      }

      const { data: session, error: sessionError } = await authClient.getSession({
        fetchOptions: { cache: "no-store" },
      });
      if (sessionError) {
        setError("Could not check your session. Try again.");
        return;
      }
      if (!session?.user) {
        setError("Your browser did not keep the sign-in session. Open this page directly in Safari or Chrome and try again.");
        return;
      }

      const role = "role" in session.user ? session.user.role : null;
      window.location.replace(role === "SUPER_ADMIN" ? "/studio" : "/dashboard");
      navigating = true;
    } catch (error) {
      console.error("Login error:", error);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      if (!navigating) setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-dvh items-start justify-center overflow-hidden bg-[#f5f5f7] px-4 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:items-center sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-white blur-3xl" />

        <div className="absolute bottom-[-280px] right-[-180px] h-[560px] w-[560px] rounded-full bg-black/[0.025] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[430px]">
        <div className="rounded-[26px] border border-black/[0.06] bg-white/90 p-5 sm:rounded-[34px] shadow-[0_35px_100px_rgba(0,0,0,0.10)] backdrop-blur-2xl sm:p-10">
          <div className="mb-6 text-center sm:mb-10">
            <p className="mb-3 text-xs sm:mb-5 font-semibold uppercase tracking-[0.2em] text-[#8e8e93]">
              Business login
            </p>
            <h1 className="tracking-tight">
              <span className="block text-4xl sm:text-5xl font-semibold text-[#111111]">
                BeLoyal
              </span>

              <span className="mt-1 block text-4xl sm:text-5xl font-light text-[#9a9a9f]">
                Studio
              </span>
            </h1>

            <p className="mx-auto mt-3 max-w-xs sm:mt-5 text-sm leading-6 text-[#8e8e93]">
              Sign in to your business loyalty dashboard.
            </p>
          </div>

          <form
            method="post"
            onSubmit={handleLogin}
            className="space-y-5"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-[#3a3a3c]"
              >
                Email
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f]"
                />

                <Input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  placeholder="Email address"
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  disabled={loading}
                  className="h-13 rounded-2xl border-black/[0.07] bg-[#f7f7f8] pl-11 text-base text-[#111111] shadow-none placeholder:text-[#a1a1a6] focus-visible:border-black/20 focus-visible:ring-2 focus-visible:ring-black/[0.06]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-[#3a3a3c]"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#9a9a9f]"
                />

                <Input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  name="password"
                  placeholder="Password"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-13 rounded-2xl border-black/[0.07] bg-[#f7f7f8] pl-11 pr-12 text-base text-[#111111] shadow-none placeholder:text-[#a1a1a6] focus-visible:border-black/20 focus-visible:ring-2 focus-visible:ring-black/[0.06]"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={loading}
                  className="absolute right-0.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-[#8e8e93] transition hover:text-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-[#6e6e73]">
              <input
                type="checkbox"
                name="rememberMe"
                defaultChecked
                disabled={loading}
                className="h-4 w-4 rounded border-black/20 accent-black"
              />

              Keep me signed in
            </label>

            {error && (
              <div role="alert" className="rounded-2xl border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-sm leading-6 text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-13 w-full rounded-2xl bg-[#111111] text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition hover:bg-[#2c2c2e] hover:shadow-[0_14px_35px_rgba(0,0,0,0.18)] active:opacity-80 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="pt-1 text-center">
              <a
                href="mailto:begad.ahmed124@gmail.com?subject=BeLoyal%20%E2%80%93%20Login%20help&body=Hello%20BeLoyal%2C%0A%0AI%20need%20help%20accessing%20my%20business%20account.%0A%0ABusiness%20name%3A%20%0AAccount%20email%3A%20"
                className="inline-flex min-h-11 items-center text-sm font-medium text-[#6e6e73] transition-colors hover:text-[#111111] hover:underline"
              >
                Need help signing in?
              </a>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
