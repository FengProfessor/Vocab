import { redirect } from 'next/navigation';

export default function StudentStatsRedirectPage() {
  redirect('/student/profile#stats');
}
