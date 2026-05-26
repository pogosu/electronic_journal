

interface SkeletonProps {
  className?: string;
}

export function SkeletonRow({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonRow key={i} className="h-10 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-2">
          {Array.from({ length: cols }).map((_, c) => (
            <SkeletonRow key={c} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <SkeletonRow className="h-6 w-1/3" />
      <SkeletonRow className="h-4 w-1/2" />
      <SkeletonRow className="h-4 w-2/3" />
    </div>
  );
}
