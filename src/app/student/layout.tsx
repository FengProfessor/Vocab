import type { ReactNode } from 'react';
import { StudentProvider } from '@/components/student/StudentProvider';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <StudentProvider>{children}</StudentProvider>;
}
