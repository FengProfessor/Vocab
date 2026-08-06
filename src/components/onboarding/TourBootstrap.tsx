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
 * TourBootstrap tạm thời được tắt theo yêu cầu để tránh kẹt ở bước "SỬ DỤNG TỪ".
 */
export function TourBootstrap() {
  return null;
}

