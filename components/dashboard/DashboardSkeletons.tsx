import { Skeleton, SkeletonGroup, SkeletonRows } from "@/components/ui/skeleton";

const panel = "min-w-0 rounded-[24px] border border-border bg-card p-4 sm:p-6";

export function AnalyticsSkeleton({ label, points = false }: { label: string; points?: boolean }) {
  return (
    <SkeletonGroup label={label}>
      <div className="space-y-5" data-skeleton-stack>
        <div className={points ? "" : panel}>
          {!points && <Skeleton className="mb-5 h-6 w-44 max-w-full" />}
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map(index => (
              <div key={index} className="min-w-0 space-y-3 rounded-2xl border border-border bg-card p-3 sm:p-5">
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="h-3 w-24 max-w-full" />
                <Skeleton className="h-6 w-14 max-w-full" />
                <Skeleton className="h-3 w-20 max-w-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
          <div className={panel}>
            <Skeleton className="h-5 w-36 max-w-full" />
            <Skeleton className="mt-5 h-40 w-full rounded-xl" />
          </div>
          <div className={panel}>
            <Skeleton className="mb-2 h-5 w-28" />
            <SkeletonRows count={2} />
          </div>
        </div>
      </div>
    </SkeletonGroup>
  );
}

export function MemberCardsSkeleton({ label, className }: { label: string; className: string }) {
  return (
    <SkeletonGroup label={label}>
      <div className={className} data-skeleton-stack>
        {[0, 1, 2, 3].map(index => (
          <div key={index} className="min-w-0 space-y-3 rounded-[22px] border border-border bg-card p-4">
            <Skeleton className="h-5 w-36 max-w-full" />
            <Skeleton className="h-3 w-24 max-w-full" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}

export function CustomerDatabaseSkeleton({ label }: { label: string }) {
  return (
    <SkeletonGroup label={label}>
      <div className="space-y-6" data-skeleton-stack>
        <div className={`${panel} flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between`}>
          <div className="min-w-0 flex-1 space-y-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-64 max-w-full" />
            <Skeleton className="h-4 w-80 max-w-full" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl xl:w-32" />
        </div>
        <div className={panel}>
          <Skeleton className="h-4 w-16" />
          <div className="mt-4 grid gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map(index => <Skeleton key={index} className="h-11 w-full rounded-xl" />)}
          </div>
        </div>
        <div className="overflow-hidden rounded-[24px] border border-border bg-card">
          <div className="border-b border-border px-4 py-4"><Skeleton className="h-4 w-28" /></div>
          <SkeletonRows />
        </div>
      </div>
    </SkeletonGroup>
  );
}
