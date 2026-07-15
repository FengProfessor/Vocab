'use client';

import dynamic from 'next/dynamic';
import type { Components } from 'react-markdown';

const ReactMarkdown = dynamic(() => import('react-markdown'), {
  ssr: false,
  loading: () => (
    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" aria-hidden />
  ),
});

const DEFAULT_COMPONENTS: Components = {
  p: ({ ...p }) => <p className="leading-relaxed" {...p} />,
  strong: ({ ...p }) => <strong className="font-bold text-slate-900" {...p} />,
  code: ({ ...p }) => (
    <code className="rounded-md bg-indigo-50 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-700" {...p} />
  ),
  ul: ({ ...p }) => <ul className="my-2 list-disc space-y-1 pl-5" {...p} />,
  li: ({ ...p }) => <li className="leading-relaxed" {...p} />,
};

/** Markdown render — code-split react-markdown ra khỏi bundle trang. */
export function LazyMarkdown({
  children,
  components,
}: {
  children: string;
  components?: Components;
}) {
  return (
    <ReactMarkdown components={components ?? DEFAULT_COMPONENTS}>
      {children}
    </ReactMarkdown>
  );
}
