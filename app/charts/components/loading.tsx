import { Skeleton } from "@/components/ui/skeleton";

export function LoadingPieChart(): JSX.Element {
  return (
    <div className="flex items-center justify-center">
      <Skeleton className="h-full w-full rounded-full" />
    </div>
  );
}

export function LoadingBarChart(): JSX.Element {
  return (
    <div className="flex flex-col gap-2 items-start justify-end">
      <Skeleton className="h-16 w-[85%]" />
      <Skeleton className="h-16 w-[60%]" />
      <Skeleton className="h-16 w-[90%]" />
      <Skeleton className="h-16 w-[45%]" />
      <Skeleton className="h-16 w-[25%]" />
    </div>
  );
}
