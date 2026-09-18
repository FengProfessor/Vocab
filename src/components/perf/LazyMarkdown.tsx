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

export function normalizeLatexTokens(text: string): string {
  if (!text) return '';
  return text
    // LaTeX markers sanitization: $S_{ít}$ -> S(ít), $\rightarrow$ -> →, $\nearrow$ -> ↗, $\searrow$ -> ↘
    .replace(/\$S_\{(?:ít|it)\}\$/gi, 'S(ít)')
    .replace(/S_\{(?:ít|it)\}/gi, 'S(ít)')
    .replace(/\$S_\{(?:nhiều|nhieu)\}\$/gi, 'S(nhiều)')
    .replace(/S_\{(?:nhiều|nhieu)\}/gi, 'S(nhiều)')
    .replace(/\$S_\{(?:sing|singular)\}\$/gi, 'S(ít)')
    .replace(/\$S_\{(?:pl|plural)\}\$/gi, 'S(nhiều)')
    .replace(/\$([A-Za-z]+)_\{([^}]+)\}\$/g, '$1($2)')
    .replace(/\b([A-Za-z]+)_\{([^}]+)\}/g, '$1($2)')
    .replace(/\$\\rightarrow\$/g, '→')
    .replace(/\\rightarrow/g, '→')
    .replace(/\$\\nearrow\$/g, '↗')
    .replace(/\\nearrow/g, '↗')
    .replace(/\$\\searrow\$/g, '↘')
    .replace(/\\searrow/g, '↘')
    .replace(/\$\\Rightarrow\$/g, '⇒')
    .replace(/\\Rightarrow/g, '⇒')
    .replace(/\$\\Leftarrow\$/g, '⇐')
    .replace(/\\Leftarrow/g, '⇐')
    .replace(/\$\\leftrightarrow\$/g, '↔')
    .replace(/\\leftrightarrow/g, '↔')
    .replace(/\$\\times\$/g, '×')
    .replace(/\\times/g, '×');
}

export function isTableDelimiter(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|') || !trimmed.includes('-')) return false;
  let content = trimmed;
  if (content.startsWith('|')) content = content.slice(1);
  if (content.endsWith('|')) content = content.slice(0, -1);
  const parts = content.split('|');
  if (parts.length < 1) return false;
  return parts.every((part) => /^\s*:?-{2,}:?\s*$/.test(part));
}

export function ensureMarkdownTableFormat(text: string): string {
  if (!text || typeof text !== 'string') return '';

  const normalized = normalizeLatexTokens(text).replace(/\r\n/g, '\n');

  // Split lines
  const rawLines = normalized.split('\n');
  const lines: string[] = [];

  // Pass 1: Separate inline table stuck to paragraph text on the same line
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const nextLine = rawLines[i + 1] || '';

    if (isTableDelimiter(nextLine) && line.includes('|')) {
      const firstPipe = line.indexOf('|');
      const prefix = line.slice(0, firstPipe).trim();
      if (prefix && !prefix.startsWith('|')) {
        lines.push(prefix);
        lines.push('');
        lines.push(line.slice(firstPipe).trim());
        continue;
      }
    }
    lines.push(line);
  }

  // Pass 2: Identify table regions vs plain text regions
  const isTableLine = new Array<boolean>(lines.length).fill(false);
  for (let i = 1; i < lines.length; i++) {
    if (isTableDelimiter(lines[i])) {
      isTableLine[i - 1] = true;
      isTableLine[i] = true;
      let j = i + 1;
      while (
        j < lines.length &&
        lines[j].trim().includes('|') &&
        !lines[j].trim().startsWith('#') &&
        !lines[j].trim().startsWith('```')
      ) {
        isTableLine[j] = true;
        j++;
      }
    }
  }

  // Pass 3: Process lines with idempotency guarantees
  const result: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isTableLine[i]) {
      // Ensure blank line before table starts if preceded by non-empty text
      if (i > 0 && !isTableLine[i - 1] && result.length > 0 && result[result.length - 1].trim() !== '') {
        result.push('');
      }
      // Inside a table row: preserve table row verbatim
      result.push(line);
      // Ensure blank line after table ends if followed by non-empty text
      if (i + 1 < lines.length && !isTableLine[i + 1] && lines[i + 1].trim() !== '') {
        result.push('');
      }
    } else {
      // Plain text: handle '||' as clean bullet points or spacing outside table blocks
      if (line.includes('||')) {
        const isList = /^\s*[-*•]\s+/.test(line);
        if (isList) {
          result.push(line.replace(/\s*\|\|\s*/g, '\n- '));
        } else if (/^[A-Z0-9\s_À-Ỹ]{2,}:/i.test(line)) {
          result.push('- ' + line.replace(/\s*\|\|\s*/g, '\n- '));
        } else {
          result.push(line.replace(/\s*\|\|\s*/g, '\n\n- '));
        }
      } else {
        result.push(line);
      }
    }
  }

  return result.join('\n');
}

const DEFAULT_COMPONENTS: Components = {
  p: ({ ...p }) => <p className="leading-relaxed my-2.5" {...p} />,
  strong: ({ ...p }) => <strong className="font-semibold text-foreground" {...p} />,
  table: ({ ...props }: any) => (
    <div className="overflow-x-auto my-6 -mx-4 sm:mx-0 px-4 sm:px-0">
      <table className="w-full text-left text-sm border-collapse border-b border-border/60" {...props} />
    </div>
  ),
  thead: ({ ...props }: any) => (
    <thead className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground font-semibold" {...props} />
  ),
  th: ({ ...props }: any) => (
    <th className="py-3 px-3.5 font-semibold text-foreground text-xs" {...props} />
  ),
  td: ({ ...props }: any) => (
    <td className="py-3 px-3.5 border-t border-border/30 text-sm text-foreground/90 font-normal" {...props} />
  ),
  tr: ({ ...props }: any) => (
    <tr className="hover:bg-muted/30 transition-colors" {...props} />
  ),
  code: ({ node: _node, inline, className, children, ...props }: any) => {
    const codeText = String(children).replace(/\n$/, '');
    if (!inline && className === 'language-formula') {
      return <GrammarFormula code={codeText} />;
    }
    return (
      <code className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground font-medium" {...props}>
        {codeText}
      </code>
    );
  },
  ul: ({ ...p }) => <ul className="my-2.5 list-disc space-y-1 pl-5 text-foreground/90" {...p} />,
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
