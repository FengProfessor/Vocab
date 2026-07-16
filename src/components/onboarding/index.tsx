'use client';

/**
 * Onboarding Orchestrator — layers + bootstrap toàn app.
 */

export { OnboardingProvider, useOnboarding, useOnboardingOptional } from './OnboardingProvider';
export { SpotlightOverlay } from './SpotlightOverlay';
export { TutorialTooltip } from './TutorialTooltip';
export { WelcomeModal } from './WelcomeModal';
export { MethodModal } from './MethodModal';
export { FeatureGuideModal } from './FeatureGuideModal';
export { SurveyModal } from './SurveyModal';
export { SetupModal } from './SetupModal';
export { RewardModal } from './RewardModal';
export { TourBootstrap } from './TourBootstrap';

import { SpotlightOverlay } from './SpotlightOverlay';
import { TutorialTooltip } from './TutorialTooltip';
import { WelcomeModal } from './WelcomeModal';
import { MethodModal } from './MethodModal';
import { FeatureGuideModal } from './FeatureGuideModal';
import { SurveyModal } from './SurveyModal';
import { SetupModal } from './SetupModal';
import { RewardModal } from './RewardModal';

/** UI layers — render bên trong OnboardingProvider. */
export function OnboardingLayers() {
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
