"use client";

import type { ComponentProps, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";

type Props = ComponentProps<"button"> & {
  icon: ReactNode;
  pending: boolean;
};

export function ActionButton({
  type = "button",
  icon,
  pending,
  disabled,
  className,
  children,
  ...props
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || pending}
      aria-busy={pending}
      className={`touch-manipulation motion-safe:transition-opacity ${className ?? ""}`}
      {...props}
    >
      <span aria-hidden="true" className="grid size-[18px] shrink-0 place-items-center">
        {pending ? <LoaderCircle size={17} className="motion-safe:animate-spin" /> : icon}
      </span>
      <span className="min-w-0 text-balance">{children}</span>
    </button>
  );
}
