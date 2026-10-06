export default function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Loading">
      <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
      <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800/60 rounded mb-8" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
