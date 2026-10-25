'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function JoinRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('code') || searchParams.get('joinClass') || '';
    if (code) {
      router.replace(`/student?joinClass=${encodeURIComponent(code)}`);
    } else {
      router.replace('/student?joinClass=1');
    }
  }, [router, searchParams]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium text-muted-foreground">Đang chuyển tiếp tới lớp học...</p>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <JoinRedirectContent />
    </Suspense>
  );
}
