"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
} from "next/navigation";
import { useEffect, useState } from "react";

import { useCafeTheme } from "@/components/theme/CafeThemeProvider";

import { barberNavigation } from "./barber-navigation";

function isCurrentPage(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }

  if (href === "/dashboard/scanner") {
    return pathname === href;
  }

  return pathname.startsWith(href);
}

export default function BarberMobileNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useCafeTheme();
  const [formControlFocused, setFormControlFocused] =
    useState(false);
  const [
    pendingNavigation,
    setPendingNavigation,
  ] = useState<{
    href: string;
    fromPathname: string;
  } | null>(null);

  useEffect(() => {
    function isFormControl(target: EventTarget | null) {
      return (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement
      );
    }

    function handleFocusIn(event: FocusEvent) {
      if (isFormControl(event.target)) {
        setFormControlFocused(true);
      }
    }

    function handleFocusOut(event: FocusEvent) {
      if (!isFormControl(event.target)) {
        return;
      }

      window.setTimeout(() => {
        const active = document.activeElement;

        setFormControlFocused(
          active instanceof HTMLInputElement ||
            active instanceof HTMLTextAreaElement ||
            active instanceof HTMLSelectElement,
        );
      }, 0);
    }

    document.addEventListener("focusin", handleFocusIn);
    document.addEventListener("focusout", handleFocusOut);

    return () => {
      document.removeEventListener("focusin", handleFocusIn);
      document.removeEventListener("focusout", handleFocusOut);
    };
  }, []);

  useEffect(() => {
    for (const item of barberNavigation) {
      router.prefetch(item.href);
    }

    router.prefetch(
      "/dashboard/settings",
    );
  }, [router]);

  if (formControlFocused) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[22px] border p-2 shadow-[0_20px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl lg:hidden"
      style={{
        borderColor: theme.border,
        backgroundColor: `${theme.surface}F2`,
      }}
    >
      {barberNavigation.map((item) => {
        const Icon = item.icon;
        const navigationPending =
          pendingNavigation?.fromPathname ===
            pathname &&
          pendingNavigation.href ===
            item.href;

        const active =
          navigationPending ||
          isCurrentPage(
            pathname,
            item.href,
          );

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch
            aria-current={
              isCurrentPage(
                pathname,
                item.href,
              )
                ? "page"
                : undefined
            }
            onPointerDown={() =>
              router.prefetch(item.href)
            }
            onClick={() => {
              if (
                !isCurrentPage(
                  pathname,
                  item.href,
                )
              ) {
                setPendingNavigation({
                  href: item.href,
                  fromPathname:
                    pathname,
                });
              }
            }}
            className="flex min-w-0 touch-manipulation flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-medium transition duration-150 active:scale-[0.96]"
            style={{
              backgroundColor: active
                ? theme.accentSoft
                : "transparent",
              color: active ? theme.accent : theme.textMuted,
            }}
          >
            <Icon size={18} />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
