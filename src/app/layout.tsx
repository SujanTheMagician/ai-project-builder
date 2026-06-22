import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "ProjectAI — AI-Powered Project Blueprint Generator",
  description:
    "Transform your startup idea into a complete software blueprint with AI. Get architecture, database design, API specs, roadmap, and cost estimates instantly.",
  keywords: ["AI", "project planning", "software architecture", "startup", "blueprint"],
  openGraph: {
    title: "ProjectAI — AI-Powered Project Blueprint Generator",
    description: "Transform your idea into a complete project blueprint with AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.75rem",
                fontSize: "14px",
              },
            }}
          />
        </body>
      </html>
    </ClerkProvider>
  );
}
