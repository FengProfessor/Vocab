'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import {
  getActiveOnboardingSteps,
  ONBOARDING_STORAGE_KEY,
  ONBOARDING_STORAGE_KEY_LEGACY,
  ONBOARDING_STEP_SESSION_KEY,
  ONBOARDING_VERSION,
  type OnboardingStep,
} from './onboarding-steps';

interface OnboardingContextValue {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: OnboardingStep;
  totalSteps: number;
  spotlightStepNumber: number;
  totalSpotlightSteps: number;
  /** Steps đã lọc theo mobile/desktop. */
  steps: OnboardingStep[];
  next: () => void;
  prev: () => void;
  skip: () => void;
  complete: () => void;
  userName: string;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be inside OnboardingProvider');
  return ctx;
}

export function useOnboardingOptional() {
  return useContext(OnboardingContext);
}

interface Props {
  children: ReactNode;
  userId: string | null;
  userName: string;
  userMetadata?: {
    lingopro_onboarding_completed?: unknown;
    lingopro_onboarding_version?: unknown;
    force_onboarding?: boolean;
  } | null;
}

export function OnboardingProvider({ children, userId, userName, userMetadata }: Props) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);
  const [steps, setSteps] = useState<OnboardingStep[]>(() => getActiveOnboardingSteps());

  // Resize: cập nhật danh sách bước mobile/desktop
  useEffect(() => {
    const refresh = () => {
      const next = getActiveOnboardingSteps();
      setSteps(next);
      setCurrentStepIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
    };
    refresh();
    window.addEventListener('resize', refresh);
    return () => window.removeEventListener('resize', refresh);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const localDone = !!localStorage.getItem(ONBOARDING_STORAGE_KEY);
      const dbVersion =
        typeof userMetadata?.lingopro_onboarding_version === 'string'
          ? userMetadata.lingopro_onboarding_version
          : null;
      const dbDone = dbVersion === ONBOARDING_VERSION;
      const isForced = userMetadata?.force_onboarding === true;

      if (isForced || (!localDone && !dbDone)) {
        localStorage.removeItem(ONBOARDING_STORAGE_KEY_LEGACY);
        try {
          const saved = sessionStorage.getItem(ONBOARDING_STEP_SESSION_KEY);
          const idx = saved ? parseInt(saved, 10) : 0;
          const active = getActiveOnboardingSteps();
          if (!Number.isNaN(idx) && idx >= 0 && idx < active.length) {
            setCurrentStepIndex(idx);
          }
        } catch {
          /* ignore */
        }
        setIsActive(true);
      }
      setHasChecked(true);
    }, 1200);
    return () => clearTimeout(timer);
  }, [userMetadata]);

  useEffect(() => {
    if (!isActive || !hasChecked) return;
    try {
      sessionStorage.setItem(ONBOARDING_STEP_SESSION_KEY, String(currentStepIndex));
    } catch {
      /* ignore */
    }
  }, [isActive, hasChecked, currentStepIndex]);

  const markCompleted = useCallback(async () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, ONBOARDING_VERSION);
    localStorage.removeItem(ONBOARDING_STORAGE_KEY_LEGACY);
    try {
      sessionStorage.removeItem(ONBOARDING_STEP_SESSION_KEY);
    } catch {
      /* ignore */
    }
    if (userId) {
      try {
        await supabase.auth.updateUser({
          data: {
            lingopro_onboarding_completed: new Date().toISOString(),
            lingopro_onboarding_version: ONBOARDING_VERSION,
            force_onboarding: false,
          },
        });
      } catch (err) {
        console.warn('[Onboarding] Failed to update user metadata:', err);
      }
    }
  }, [userId]);

  const claimOnboardingXp = useCallback(async () => {
    if (!userId) return;
    try {
      const { error } = await supabase.rpc('claim_onboarding_xp');
      if (error) throw error;
    } catch (err) {
      console.warn('[Onboarding] claim_onboarding_xp failed:', err);
    }
  }, [userId]);

  const currentStep = steps[currentStepIndex] ?? steps[0];

  const spotlightSteps = useMemo(() => steps.filter((s) => s.type === 'spotlight'), [steps]);
  const spotlightStepNumber = currentStep
    ? spotlightSteps.findIndex((s) => s.id === currentStep.id) + 1
    : 0;
  const totalSpotlightSteps = spotlightSteps.length;

  const next = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex((i) => i + 1);
    }
  }, [currentStepIndex, steps.length]);

  const prev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1);
    }
  }, [currentStepIndex]);

  const skip = useCallback(() => {
    setIsActive(false);
    void markCompleted();
  }, [markCompleted]);

  const complete = useCallback(() => {
    void claimOnboardingXp();
    setIsActive(false);
    void markCompleted();
  }, [claimOnboardingXp, markCompleted]);

  const value: OnboardingContextValue = {
    isActive: isActive && hasChecked && steps.length > 0,
    currentStepIndex,
    currentStep: currentStep ?? {
      id: 'empty',
      type: 'modal',
      title: '',
      description: '',
      emoji: '',
      xpReward: 0,
    },
    totalSteps: steps.length,
    spotlightStepNumber,
    totalSpotlightSteps,
    steps,
    next,
    prev,
    skip,
    complete,
    userName,
  };

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}
