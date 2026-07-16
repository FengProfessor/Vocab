'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { OnboardingProvider, useOnboarding } from './OnboardingProvider';
import { SpotlightOverlay } from './SpotlightOverlay';
import { TutorialTooltip } from './TutorialTooltip';
import { WelcomeModal } from './WelcomeModal';
import { MethodModal } from './MethodModal';
import { FeatureGuideModal } from './FeatureGuideModal';
import { SurveyModal } from './SurveyModal';
import { SetupModal } from './SetupModal';
import { RewardModal } from './RewardModal';

function OnboardingLayers() {
  return (
    <>
      <SpotlightOverlay />
      <TutorialTooltip />
      <WelcomeModal />
      <MethodModal />
      <FeatureGuideModal />
      <SurveyModal />
      <SetupModal />
      <RewardModal />
    </>
  );
}

type Meta = {
  email?: string;
  lingopro_onboarding_completed?: unknown;
  lingopro_onboarding_version?: unknown;
  force_onboarding?: boolean;
};

const SKIP_PREFIXES = [
  '/auth',
  '/landing',
  '/for-teachers',
  '/privacy',
  '/terms',
  '/admin',
  '/teacher',
  '/api',
];

function pathAllowed(pathname: string): boolean {
  if (pathname === '/' || pathname.startsWith('/?')) return false;
  return !SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Tự mở đúng route khi bước spotlight/guide yêu cầu. */
function TourNavigator() {
  const { isActive, currentStep } = useOnboarding();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isActive || !currentStep.route) return;
    // Guide: user tự bấm «Thử ngay» — không auto-nav (tránh nhảy trang khi chỉ đọc)
    if (currentStep.type === 'guide') return;

    const want = currentStep.route.split('?')[0];
    if (!pathname.startsWith(want)) {
      router.push(currentStep.route);
    }
  }, [isActive, currentStep, pathname, router]);

  return null;
}

/**
 * Mount tour toàn app (client). Không phụ thuộc /student —
 * đổi trang Thư viện / Lộ trình / Tra từ vẫn giữ bước.
 */
export function TourBootstrap() {
  const pathname = usePathname() ?? '';
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userMetadata, setUserMetadata] = useState<Meta | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled) return;
        if (!session?.user) {
          setUserId(null);
          setReady(true);
          return;
        }
        setUserId(session.user.id);
        setUserMetadata((session.user.user_metadata ?? {}) as Meta);
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', session.user.id)
          .maybeSingle();
        if (!cancelled) {
          setUserName(
            (profile?.full_name as string) ||
              (session.user.user_metadata?.full_name as string) ||
              '',
          );
          setReady(true);
        }
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (!ready || !userId || !pathAllowed(pathname)) return null;

  return (
    <OnboardingProvider userId={userId} userName={userName} userMetadata={userMetadata}>
      <TourNavigator />
      <OnboardingLayers />
    </OnboardingProvider>
  );
}
