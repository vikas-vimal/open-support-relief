const SKELETON_ROW_COUNT = 4;

/** Placeholder cards so the first paint has the board's shape, not a blank page. */
export function BoardSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
        <div
          key={index}
          className="border-border-soft bg-surface flex flex-col gap-3 rounded-card border-2 p-4"
        >
          <div className="bg-surface-2 h-5 w-2/5 rounded" />
          <div className="border-border-soft bg-surface-2 h-5 w-full rounded-card border-2" />
          <div className="bg-surface-2 h-4 w-1/3 rounded" />
          <div className="bg-surface-2 h-14 w-full rounded-card" />
        </div>
      ))}
    </div>
  );
}
