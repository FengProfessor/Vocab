'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Route cũ đã gộp vào dashboard hợp nhất. Redirect sang /teacher?class=...&tab=grammar
 * để giữ backlink/bookmark cũ còn hoạt động.
 */
export default function TeacherGrammarRedirect() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const router = useRouter();
  useEffect(() => {
    router.replace(`/teacher?class=${classroomId}&tab=grammar`);
  }, [classroomId, router]);
  return (
    <div className="min-h-dvh flex items-center justify-center bg-muted/40">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
