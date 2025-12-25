export function LeagueHeaderSkeleton() {
  return (
    <div className="flex justify-between items-center w-full py-5 animate-pulse">
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-32 bg-steel-600 rounded" />
        ))}
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-48 bg-steel-600 rounded" />
        <div className="h-10 w-48 bg-steel-600 rounded" />
      </div>
    </div>
  );
}

export function ScoreboardSkeleton() {
  return (
    <div className="flex justify-center flex-wrap gap-5">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div
          key={i}
          className="bg-steel p-5 shadow-sm rounded-md w-[300px] border border-ui-border animate-pulse"
        >
          <div className="h-6 bg-steel-600 rounded mb-3 w-3/4" />
          <div className="h-4 bg-steel-600 rounded mb-2 w-1/2" />
          <div className="space-y-2 mt-4">
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} className="h-10 bg-steel-600 rounded" />
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <div className="h-4 bg-steel-600 rounded w-20" />
            <div className="h-4 bg-steel-600 rounded w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function DraftSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex gap-4 mb-4">
        <div className="h-10 w-48 bg-steel-600 rounded" />
        <div className="h-10 w-48 bg-steel-600 rounded" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-12 bg-steel-600 rounded" />
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-steel-600 rounded w-1/3" />
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-12 bg-steel-600 rounded" />
        ))}
      </div>
    </div>
  );
}

export function TeamsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-steel-600 rounded w-1/4 mb-4" />
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-steel-600 rounded" />
        ))}
      </div>
    </div>
  );
}
