import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function truncate(str: string, length: number) {
  return str.length > length ? str.slice(0, length) + "..." : str;
}

export const PROJECT_CATEGORIES = [
  "SaaS",
  "Mobile App",
  "AI Product",
  "E-commerce",
  "Healthcare",
  "FinTech",
  "Education",
  "Social Media",
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  SaaS: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" },
  "Mobile App": { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  "AI Product": { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  "E-commerce": { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  Healthcare: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  FinTech: { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
  Education: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  "Social Media": { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300" },
};

export const DEFAULT_CATEGORY_COLOR = { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-300" };

/** Turns a project name into a safe download filename (without extension). */
export function toFileName(name: string) {
  return name.replace(/[^a-z0-9-_ ]/gi, "").trim().replace(/\s+/g, "-") || "blueprint";
}

export const CREDIT_REASON_LABELS: Record<string, string> = {
  signup_bonus: "Welcome credits",
  blueprint_generation: "Blueprint generated",
  section_regeneration: "Section regenerated",
  refund: "Refund for failed generation",
  admin_adjustment: "Balance adjustment",
};

export const TAG_COLOR_CLASSES: Record<string, string> = {
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  green: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  pink: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
  cyan: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  gray: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

export const PROJECT_TEMPLATES = [
  {
    name: "Clinic booking SaaS",
    category: "Healthcare",
    description: "A web app where small clinics manage appointments, patient records and SMS reminders, replacing phone bookings and paper diaries. Patients book online; staff see a shared calendar.",
    audience: "Clinic receptionists, doctors and their patients",
    features: "Online booking, staff calendar, SMS reminders, patient records, no-show reports",
  },
  {
    name: "Local services marketplace",
    category: "E-commerce",
    description: "A two-sided marketplace connecting homeowners with vetted local tradespeople. Customers post jobs, receive quotes, pay through the platform and leave reviews.",
    audience: "Homeowners and independent tradespeople",
    features: "Job posting, quotes, escrow payments, reviews, in-app messaging",
  },
  {
    name: "AI study assistant",
    category: "AI Product",
    description: "Students upload lecture notes and PDFs; the app generates summaries, flashcards and practice quizzes, and answers questions grounded in the uploaded material.",
    audience: "University students",
    features: "Document upload, summaries, flashcards, quizzes, grounded Q&A",
  },
  {
    name: "Expense splitting app",
    category: "FinTech",
    description: "A mobile-first app for groups to track shared expenses, split bills unevenly, and settle up with UPI or card payments, with monthly spending insights.",
    audience: "Flatmates, friend groups and travellers",
    features: "Groups, bill splitting, settle up, payment links, spending insights",
  },
] as const;
