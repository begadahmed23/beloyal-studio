import { cardFrame } from "@/components/loyalty/CardBrand";
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton";

export const loyaltyCardPageClass = "min-h-screen w-full overflow-x-hidden px-3 py-3 min-[380px]:px-4 min-[380px]:py-5 sm:px-6 sm:py-10";

export default function LoyaltyCardSkeleton({
  background = "#ECECEA",
  foreground = "#111111",
  points = false,
}: { background?: string; foreground?: string; points?: boolean }) {
  return (
    <main className={loyaltyCardPageClass} style={{ background, color: foreground }}>
      <SkeletonGroup label="Loading your loyalty card" className="mx-auto w-full max-w-md">
        <div className="mb-3 flex justify-end">
          <Skeleton className="size-11 rounded-xl" />
        </div>
        <div className={`${cardFrame} border-current/10 bg-current/4`} data-skeleton-stack>
          <div className="flex min-h-24 items-center justify-between gap-4 px-4 py-3.5 min-[380px]:px-5">
            <Skeleton className="h-8 w-44 max-w-[55%]" />
            <div className="grid justify-items-end gap-2">
              <Skeleton className="h-2.5 w-12" />
              <Skeleton className="h-7 w-16" />
            </div>
          </div>
          {!points && (
            <div className="flex aspect-[375/105] items-center justify-center gap-2.5 border-y border-current/10 px-4">
              {Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="aspect-square w-[9%] max-w-9 rounded-full" />)}
            </div>
          )}
          <div className={points ? "space-y-4 px-5 py-5 sm:px-7 sm:py-6" : "space-y-3 px-4 py-4 min-[380px]:px-5"}>
            <div className={points ? "space-y-2" : "grid grid-cols-2 gap-3"}>
              <div className="space-y-2"><Skeleton className="h-2.5 w-12" /><Skeleton className="h-4 w-24 max-w-full" /></div>
              {!points && <div className="space-y-2 border-s border-current/10 ps-3"><Skeleton className="h-2.5 w-16" /><Skeleton className="h-4 w-24 max-w-full" /></div>}
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <div className="flex justify-center gap-2">
              <Skeleton className="h-9 w-[7.5rem] rounded-lg" />
              <Skeleton className="h-9 w-[7.5rem] rounded-lg" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </SkeletonGroup>
    </main>
  );
}
