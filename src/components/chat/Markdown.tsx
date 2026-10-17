"use client";

import { memo, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import CopyButton from "@/components/ui/CopyButton";

function CodeBlock({ children }: { children?: React.ReactNode }) {
  const ref = useRef<HTMLPreElement>(null);
  return (
    <div className="relative group my-3">
      <CopyButton getText={() => ref.current?.innerText ?? ""} label="Copy code" className="absolute top-1.5 right-1.5 bg-white/80 dark:bg-gray-900/80 opacity-0 group-hover:opacity-100 focus:opacity-100" />
      <pre ref={ref} className="text-xs font-mono bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-lg p-3 overflow-x-auto leading-5">
        {children}
      </pre>
    </div>
  );
}

const components: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-2 pl-5 list-disc space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 pl-5 list-decimal space-y-1">{children}</ol>,
  h1: ({ children }) => <h3 className="font-semibold text-gray-900 dark:text-white mt-3 mb-1">{children}</h3>,
  h2: ({ children }) => <h3 className="font-semibold text-gray-900 dark:text-white mt-3 mb-1">{children}</h3>,
  h3: ({ children }) => <h4 className="font-medium text-gray-900 dark:text-white mt-3 mb-1">{children}</h4>,
  strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 underline underline-offset-2">
      {children}
    </a>
  ),
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  code: ({ className, children }) =>
    // Fenced blocks carry a language-* class (and sit inside <pre>); bare `code` is inline.
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="font-mono text-[0.85em] bg-gray-100 dark:bg-gray-800 rounded px-1 py-0.5">{children}</code>
    ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  th: ({ children }) => <th className="text-left font-medium border-b border-gray-200 dark:border-gray-700 px-2 py-1.5">{children}</th>,
  td: ({ children }) => <td className="border-b border-gray-100 dark:border-gray-800 px-2 py-1.5 align-top">{children}</td>,
  blockquote: ({ children }) => <blockquote className="my-2 pl-3 border-l-2 border-violet-200 dark:border-violet-800 text-gray-500">{children}</blockquote>,
};

/** Renders assistant Markdown. Raw HTML in the model output is ignored (react-markdown's default), so it can't inject markup. */
function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}

export default memo(Markdown);
