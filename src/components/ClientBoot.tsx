'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
const FirebaseInitializer = dynamic(
  () => import('@/components/FirebaseInitializer'),
  { ssr: false },
);
const InstallPrompt = dynamic(
  () => import('@/components/InstallPrompt'),
  { ssr: false },
);
const UpsellProvider = dynamic(
  () => import('@/components/upsell/UpsellProvider').then((m) => m.UpsellProvider),
  { ssr: false },
);
const UpgradeGiftModal = dynamic(
  () => import('@/components/campaign/UpgradeGiftModal').then((m) => m.UpgradeGiftModal),
  { ssr: false },
);



/** Path không cần boot nặng (auth, marketing, legal). */
function isLightPath(pathname: string): boolean {
  if (!pathname || pathname === '/') return true;
  const light = [
    '/auth',
    '/landing',
    '/for-teachers',
    '/privacy',
    '/terms',
    '/offline',
  ];
  return light.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Tour chỉ khi đã vào app học (đã login thường vào các path này). */
function isTourPath(pathname: string): boolean {
  const tour = [
    '/student',
    '/library',
    '/journey',
    '/dictionary',
    '/grammar',
    '/download',
    '/review',
    '/flashcard',
    '/import',
    '/group',
    '/upgrade',
    '/writing',
    '/quiz',
  ];
  return tour.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function ClientBoot() {

  const pathname = usePathname() ?? '';
  const light = isLightPath(pathname);

  if (light) {
    return null;
  }

  return (
    <>
      <FirebaseInitializer />
      <InstallPrompt />
      {/* Quà tri ân 7 ngày Pro nâng cấp máy chủ */}
      {isTourPath(pathname) ? <UpgradeGiftModal /> : null}
      {/* Soft: hết hạn / 150+ từ · Hard: FREE_WORD_LIMIT qua event */}
      {isTourPath(pathname) ? <UpsellProvider /> : null}
    </>
  );
}

