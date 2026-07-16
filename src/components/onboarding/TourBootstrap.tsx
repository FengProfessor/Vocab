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

function TourNavigator() {
  const { isActive, currentStep } = useOnboarding();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isActive || !currentStep.route) return;
    if (currentStep.type === 'guide') return;

    const want = currentStep.route.split('?')[0];
    if (!pathname.startsWith(want)) {
      router.push(currentStep.route);
    }
  }, [isActive, currentStep, pathname, router]);

  return null;
}

/**
 * Tour chỉ mount khi ClientBoot cho phép path học.
 * Không query profiles — lấy tên từ user_metadata (nhanh, không đụng DB).
 */
export function TourBootstrap() {
  const pathname = usePathname() ?? '';
  const allowed = pathAllowed(pathname);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState('');
  const [userMetadata, setUserMetadata] = useState<Meta | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Path marketing/auth: không getSession, không profiles
    if (!allowed) {
      setReady(true);
      setUserId(null);
      return;
    }

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
        const meta = (session.user.user_metadata ?? {}) as Meta & {
          full_name?: string;
          name?: string;
        };
        setUserId(session.user.id);
        setUserMetadata(meta);
        // Không query profiles — auth.session đủ cho tour chào tên
        setUserName(
          (typeof meta.full_name === 'string' && meta.full_name) ||
            (typeof meta.name === 'string' && meta.name) ||
            '',
        );
        setReady(true);
      } catch {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pathname, allowed]);

  if (!allowed || !ready || !userId) return null;

  return (
    <OnboardingProvider userId={userId} userName={userName} userMetadata={userMetadata}>
      <TourNavigator />
      <OnboardingLayers />
    </OnboardingProvider>
  );
}
