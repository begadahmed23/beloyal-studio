"use client";

import { useLayoutEffect, useRef, type ComponentProps } from "react";

type Props = ComponentProps<"div"> & {
  value: string;
  indicatorColor: string;
  indicatorClassName?: string;
};

export function SlidingSelection({
  value,
  indicatorColor,
  indicatorClassName = "rounded-xl",
  children,
  className,
  ...props
}: Props) {
  const track = useRef<HTMLDivElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const list = track.current;
    const marker = indicator.current;
    if (!list || !marker) return;

    const selected = list.querySelector<HTMLElement>('[data-selection="active"]');

    function position() {
      if (!list || !marker) return;
      if (!selected || !selected.offsetWidth) {
        marker.style.opacity = "0";
        return;
      }

      const listRect = list.getBoundingClientRect();
      const itemRect = selected.getBoundingClientRect();
      marker.style.width = `${itemRect.width}px`;
      marker.style.height = `${itemRect.height}px`;
      marker.style.transform = `translate(${itemRect.left - listRect.left - list.clientLeft + list.scrollLeft}px, ${itemRect.top - listRect.top - list.clientTop + list.scrollTop}px)`;
      marker.style.opacity = "1";
    }

    position();
    const observer = new ResizeObserver(position);
    observer.observe(list);
    if (selected) observer.observe(selected);
    return () => observer.disconnect();
  }, [value]);

  return (
    <div ref={track} className={`relative isolate ${className ?? ""}`} {...props}>
      <span
        ref={indicator}
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 -z-10 opacity-0 motion-safe:transition-[transform,width,height,opacity] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(.2,.8,.2,1)] ${indicatorClassName}`}
        style={{ backgroundColor: indicatorColor }}
      />
      {children}
    </div>
  );
}
