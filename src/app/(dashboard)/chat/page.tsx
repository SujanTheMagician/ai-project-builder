import { Suspense } from "react";
import ChatWorkspace from "@/components/chat/ChatWorkspace";

export const metadata = { title: "AI chat — ProjectAI" };

export default function ChatPage() {
  // useSearchParams() in ChatWorkspace needs a Suspense boundary.
  return (
    <Suspense>
      <ChatWorkspace />
    </Suspense>
  );
}
