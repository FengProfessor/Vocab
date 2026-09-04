'use client';

import dynamic from 'next/dynamic';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GrammarFormula } from '@/components/grammar/GrammarFormula';

const ReactMarkdown = dynamic(() => import('react-markdown'), {
  ssr: false,
  loading: () => (
    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" aria-hidden />
  ),
});

export function ensureMarkdownTableFormat(text: string): string {
  if (!text) return '';

  // 1. Separate inline tables stuck to paragraph text
  let s = text.replace(/([^\n])\s*(\|[^|\n]+\|[^|\n]+\|)/g, '$1\n\n$2');

  // 2. Unroll double pipes or smashed pipe rows into newlines
  s = s.replace(/\|\|+/g, '\n');
  s = s.replace(/\|\s*\|/g, '\n');

  const lines = s.split('\n');
  const result: string[] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.includes('|') && !line.startsWith('#') && !line.startsWith('```')) {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 2) {
        if (cells.every((c) => /^:?-+:?$/.test(c))) {
          result.push(`| ${cells.map(() => '---').join(' | ')} |`);
          inTable = true;
          continue;
        }

        const formattedRow = `| ${cells.join(' | ')} |`;

        if (!inTable) {
          result.push('\n' + formattedRow);
          const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
          const nextCells = nextLine.split('|').map((c) => c.trim()).filter(Boolean);
          const nextIsDivider = nextCells.length >= 2 && nextCells.every((c) => /^:?-+:?$/.test(c));

          if (!nextIsDivider) {
            result.push(`| ${cells.map(() => '---').join(' | ')} |`);
          }
          inTable = true;
        } else {
          result.push(formattedRow);
        }
        continue;
      }
    }

    inTable = false;
    result.push(lines[i]);
  }

  return result.join('\n');
}

const DEFAULT_COMPONENTS: Components = {
  p: ({ ...p }) => <p className="leading-relaxed my-2" {...p} />,
  strong: ({ ...p }) => <strong className="font-bold text-slate-900 dark:text-slate-100" {...p} />,
  table: ({ ...props }: any) => (
    <div className="overflow-x-auto my-6 rounded-2xl border border-slate-200/80 shadow-md bg-white dark:bg-slate-900 dark:border-slate-800">
      <table className="w-full text-left text-sm text-slate-700 dark:text-slate-200 border-collapse" {...props} />
    </div>
  ),
  thead: ({ ...props }: any) => <thead className="bg-indigo-50/90 dark:bg-indigo-950/60 text-xs text-indigo-950 dark:text-indigo-200 uppercase font-black tracking-wider border-b border-indigo-100 dark:border-indigo-900" {...props} />,
  th: ({ ...props }: any) => <th className="px-4 py-3.5 border-b font-extrabold tracking-wider text-indigo-950 dark:text-indigo-100" {...props} />,
  td: ({ ...props }: any) => <td className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300" {...props} />,
  tr: ({ ...props }: any) => <tr className="odd:bg-white even:bg-slate-50/60 dark:odd:bg-slate-900 dark:even:bg-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-900/30 transition-colors" {...props} />,
  code: ({ node: _node, inline, className, children, ...props }: any) => {
    const codeText = String(children).replace(/\n$/, '');
    if (!inline && className === 'language-formula') {
      return <GrammarFormula code={codeText} />;
    }
    return (
      <code className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 font-mono text-[0.85em] text-indigo-700 dark:text-indigo-300" {...props}>
        {codeText}
      </code>
    );
  },
  ul: ({ ...p }) => <ul className="my-2 list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-200" {...p} />,
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
  const content = typeof children === 'string' ? ensureMarkdownTableFormat(children) : children;

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components ?? DEFAULT_COMPONENTS}>
      {content}
    </ReactMarkdown>
  );
}
