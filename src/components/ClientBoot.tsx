'use client';

import dynamic from 'next/dynamic';

/**
 * Boot client-only extras từ root layout (Server Component không được ssr:false).
 * Firebase + InstallPrompt lazy, không chặn hydration shell.
 */
const FirebaseInitializer = dynamic(
  () => import('@/components/FirebaseInitializer'),
  { ssr: false }
);
const InstallPrompt = dynamic(
  () => import('@/components/InstallPrompt'),
  { ssr: false }
);

export function ClientBoot() {
  return (
    <>
      <FirebaseInitializer />
      <InstallPrompt />
    </>
  );
}
