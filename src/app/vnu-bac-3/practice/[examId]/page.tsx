/**
 * VNU Test Bậc 3 Practice Mode Page
 * File: src/app/vnu-bac-3/practice/[examId]/page.tsx
 */

'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { VnuExamRoom } from '@/components/vnu-bac-3/VnuExamRoom';

export default function VnuBac3PracticePage() {
  const params = useParams();
  const examId = (params?.examId as string) || 'ulis-sample-test-01';

  return <VnuExamRoom examId={examId} initialMode="practice" />;
}
