'use client';

/**
 * Redirect demo cũ → practice live
 * URL: /demo/vocab-drill
 */
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function VocabDrillDemoRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/practice/codemix');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-slate-500">
      <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      <p className="text-sm">Chuyển tới /practice/codemix…</p>
    </div>
  );
}
