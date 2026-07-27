export const CardSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="card p-6 bg-white border border-slate-200/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
          <div className="w-12 h-4 rounded-md skeleton-shimmer" />
        </div>
        <div className="space-y-2">
          <div className="h-8 w-2/3 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-1/3 rounded-md skeleton-shimmer" />
        </div>
        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
          <div className="h-3 w-1/2 rounded skeleton-shimmer" />
        </div>
      </div>
    ))}
  </div>
);

export const TableSkeleton = ({ rows = 4, cols = 4 }) => (
  <div className="card bg-white border border-slate-200/60 shadow-xs overflow-hidden">
    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
      <div className="h-5 w-32 rounded skeleton-shimmer" />
      <div className="h-8 w-24 rounded-lg skeleton-shimmer" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 rounded-lg skeleton-shimmer shrink-0" />
            <div className="space-y-1 flex-1">
              <div className="h-4 w-1/3 rounded skeleton-shimmer" />
              <div className="h-3 w-1/4 rounded skeleton-shimmer" />
            </div>
          </div>
          {Array.from({ length: cols - 1 }).map((_, c) => (
            <div key={c} className="hidden sm:block h-4 w-20 rounded skeleton-shimmer" />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="card p-6 bg-white border border-slate-200/60 shadow-xs space-y-6">
    <div className="flex justify-between items-center">
      <div className="space-y-1">
        <div className="h-4 w-36 rounded skeleton-shimmer" />
        <div className="h-3 w-48 rounded skeleton-shimmer" />
      </div>
      <div className="h-7 w-20 rounded-lg skeleton-shimmer" />
    </div>
    <div className="h-56 flex items-end justify-between gap-3 pt-6">
      {[40, 70, 35, 90, 60, 80, 50].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
          <div
            className="w-full rounded-t-md skeleton-shimmer"
            style={{ height: `${h}%` }}
          />
          <div className="h-3 w-6 rounded skeleton-shimmer" />
        </div>
      ))}
    </div>
  </div>
);
