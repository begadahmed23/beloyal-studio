"use client";

import { Dialog } from "@base-ui/react/dialog";
import { useCallback, type CSSProperties, type ReactNode } from "react";

export default function FeedbackDialog({ open, onClose, style, children }: {
  open: boolean;
  onClose: () => void;
  style: CSSProperties;
  children: ReactNode;
}) {
  const fitViewport = useCallback((node: HTMLDivElement | null) => {
    const viewport = window.visualViewport;
    if (!node || !viewport) return;

    const fit = () => {
      node.style.top = `${viewport.offsetTop}px`;
      node.style.height = `${viewport.height}px`;
    };

    fit();
    viewport.addEventListener("resize", fit);
    viewport.addEventListener("scroll", fit);
    return () => {
      viewport.removeEventListener("resize", fit);
      viewport.removeEventListener("scroll", fit);
    };
  }, []);

  return (
    <Dialog.Root open={open} onOpenChange={nextOpen => { if (!nextOpen) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200" />
        <Dialog.Viewport ref={fitViewport}
          className="fixed inset-x-0 top-0 z-[101] flex h-dvh items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6">
          <Dialog.Popup style={style}
            className="relative max-h-full min-h-0 w-full max-w-md overflow-y-auto overscroll-contain rounded-[28px] border p-4 shadow-2xl outline-none motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-200 sm:rounded-[32px] sm:p-6">
            {children}
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
