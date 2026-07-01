import { Skeleton } from "@/components/ui/skeleton";

interface ListSkeletonProps {
  count?: number;
  variant?: "card" | "notification" | "job";
}

const ListSkeleton = ({ count = 3, variant = "card" }: ListSkeletonProps) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          {variant === "job" && <Skeleton className="h-5 w-12 rounded-full" />}
        </div>
      ))}
    </div>
  );
};

export default ListSkeleton;
