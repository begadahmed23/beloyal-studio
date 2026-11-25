import type { ReactNode } from "react";

export function Skeleton({ className }: { className: string }) {
  return <span aria-hidden="true" data-skeleton className={`block rounded-md ${className}`} />;
}

export function SkeletonGroup({ label, children, className }: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <span role="status" className="sr-only">{label}</span>
      <div aria-hidden="true" data-skeleton-stack>{children}</div>
    </div>
  );
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="divide-y divide-current/10" data-skeleton-stack>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex min-h-16 items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32 max-w-full" />
            <Skeleton className="h-3 w-20 max-w-full" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
