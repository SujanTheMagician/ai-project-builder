export default function TabLoading() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-32 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl" />
      <div className="h-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl" />
    </div>
  );
}
