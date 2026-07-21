"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function Home() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [rememberMe, setRememberMe] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const { error } =
        await authClient.signIn.email({
          email: cleanEmail,
          password,
          rememberMe,
          fetchOptions: {
            onError: async (context) => {
              if (
                context.response.status === 429
              ) {
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

      const sessionResponse = await fetch(
        "/api/auth/get-session",
        {
          cache: "no-store",
        }
      );

      const sessionData =
        await sessionResponse.json();

      if (
        !sessionResponse.ok ||
        !sessionData?.user
      ) {
        setError(
          "Login succeeded, but the session could not be loaded."
        );
        return;
      }

      if (
        sessionData.user.role === "SUPER_ADMIN"
      ) {
        router.replace("/studio");
      } else {
        router.replace("/dashboard");
      }

      router.refresh();
    } catch (error) {
      console.error(error);

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f5f5f7] px-6 py-12">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-white blur-3xl" />

        <div className="absolute bottom-[-280px] right-[-180px] h-[560px] w-[560px] rounded-full bg-black/[0.025] blur-3xl" />
      </div>

      <div className="relative w-full max-w-[430px]">
        <div className="rounded-[34px] border border-black/[0.06] bg-white/90 p-8 shadow-[0_35px_100px_rgba(0,0,0,0.10)] backdrop-blur-2xl sm:p-10">
          <div className="mb-10 text-center">
            <h1 className="tracking-tight">
              <span className="block text-5xl font-semibold text-[#111111]">
                BeLoyal
              </span>

              <span className="mt-1 block text-5xl font-light text-[#9a9a9f]">
                Studio
              </span>
            </h1>
          </div>

          <form
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
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Email address"
                  autoComplete="email"
                  disabled={loading}
                  className="h-13 rounded-2xl border-black/[0.07] bg-[#f7f7f8] pl-11 text-[#111111] shadow-none placeholder:text-[#a1a1a6] focus-visible:border-black/20 focus-visible:ring-2 focus-visible:ring-black/[0.06]"
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
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  placeholder="Password"
                  autoComplete="current-password"
                  disabled={loading}
                  className="h-13 rounded-2xl border-black/[0.07] bg-[#f7f7f8] pl-11 pr-12 text-[#111111] shadow-none placeholder:text-[#a1a1a6] focus-visible:border-black/20 focus-visible:ring-2 focus-visible:ring-black/[0.06]"
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
                  className="absolute right-4 top-1/2 flex -translate-y-1/2 items-center justify-center text-[#8e8e93] transition hover:text-[#111111] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 text-sm text-[#6e6e73]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) =>
                  setRememberMe(
                    event.target.checked
                  )
                }
                disabled={loading}
                className="h-4 w-4 rounded border-black/20 accent-black"
              />

              Keep me signed in
            </label>

            {error && (
              <div className="rounded-2xl border border-red-500/15 bg-red-500/[0.06] px-4 py-3 text-sm leading-6 text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-13 w-full rounded-2xl bg-[#111111] text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition hover:bg-[#2c2c2e] hover:shadow-[0_14px_35px_rgba(0,0,0,0.18)] active:scale-[0.99] disabled:opacity-50"
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
          </form>
        </div>
      </div>
    </main>
  );
}