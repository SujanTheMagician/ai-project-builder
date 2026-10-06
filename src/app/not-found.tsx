import Link from "next/link";
import { Cpu } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 gap-3">
      <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center">
        <Cpu className="w-5 h-5 text-white" />
      </div>
      <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Page not found</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">The page or project you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/dashboard" className="mt-2 bg-violet-600 hover:bg-violet-700 text-white text-sm px-4 py-2 rounded-lg transition-colors">
        Go to dashboard
      </Link>
    </div>
  );
}
