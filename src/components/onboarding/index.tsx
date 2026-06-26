'use client';

/**
 * Onboarding Orchestrator — render tất cả layer onboarding.
 * Import file này vào page cần onboarding để kích hoạt toàn bộ flow.
 */

export { OnboardingProvider, useOnboarding, useOnboardingOptional } from './OnboardingProvider';
export { SpotlightOverlay } from './SpotlightOverlay';
export { TutorialTooltip } from './TutorialTooltip';
export { WelcomeModal } from './WelcomeModal';
export { SurveyModal } from './SurveyModal';
export { SetupModal } from './SetupModal';
export { RewardModal } from './RewardModal';

import { SpotlightOverlay } from './SpotlightOverlay';
import { TutorialTooltip } from './TutorialTooltip';
import { WelcomeModal } from './WelcomeModal';
import { SurveyModal } from './SurveyModal';
import { SetupModal } from './SetupModal';
import { RewardModal } from './RewardModal';

/**
 * Gom tất cả onboarding UI layers vào một component duy nhất.
 * Render bên trong <OnboardingProvider>.
 */
export function OnboardingLayers() {
  return (
    <>
      <SpotlightOverlay />
      <TutorialTooltip />
      <WelcomeModal />
      <SurveyModal />
      <SetupModal />
      <RewardModal />
    </>
  );
}
