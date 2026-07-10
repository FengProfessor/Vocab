'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import {
  ONBOARDING_STEPS,
  ONBOARDING_STORAGE_KEY,
  type OnboardingStep,
} from './onboarding-steps';

interface OnboardingContextValue {
  /** Onboarding đang chạy hay không. */
  isActive: boolean;
  /** Index bước hiện tại (0-based). */
  currentStepIndex: number;
  /** Data bước hiện tại. */
  currentStep: OnboardingStep;
  /** Tổng số bước. */
  totalSteps: number;
  /** Số bước spotlight (không tính modal đầu/cuối). */
  spotlightStepNumber: number;
  /** Tổng bước spotlight. */
  totalSpotlightSteps: number;
  /** Chuyển sang bước tiếp theo. */
  next: () => void;
  /** Quay lại bước trước. */
  prev: () => void;
  /** Bỏ qua toàn bộ onboarding. */
  skip: () => void;
  /** Hoàn thành onboarding (gọi ở bước cuối). */
  complete: () => void;
  /** Tên user để hiển thị chào. */
  userName: string;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be inside OnboardingProvider');
  return ctx;
}

/**
 * Kiểm tra an toàn xem onboarding đang active không (không throw nếu ngoài Provider).
 * Dùng để conditionally render trong components không chắc có Provider.
 */
export function useOnboardingOptional() {
  return useContext(OnboardingContext);
}

interface Props {
  children: ReactNode;
  /** User ID (Supabase) để xác định phiên onboarding đã đăng nhập. */
  userId: string | null;
  /** Tên user để chào. */
  userName: string;
  /** Metadata của user để đồng bộ trạng thái onboarding. */
  userMetadata?: {
    lingopro_onboarding_completed?: unknown;
    force_onboarding?: boolean;
  } | null;
}

export function OnboardingProvider({ children, userId, userName, userMetadata }: Props) {
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);

  // Kiểm tra localStorage và userMetadata khi mount
  useEffect(() => {
    // Chờ 1.5s cho dashboard load xong data rồi mới hiện onboarding
    const timer = setTimeout(() => {
      const localDone = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      const dbDone = userMetadata?.lingopro_onboarding_completed;
      const isForced = userMetadata?.force_onboarding === true;

      if (isForced) {
        localStorage.removeItem(ONBOARDING_STORAGE_KEY);
        setIsActive(true);
      } else if (!localDone && !dbDone) {
        setIsActive(true);
      }
      setHasChecked(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [userMetadata]);

  const markCompleted = useCallback(async () => {
    localStorage.setItem(ONBOARDING_STORAGE_KEY, new Date().toISOString());
    if (userId) {
      try {
        await supabase.auth.updateUser({
          data: {
            lingopro_onboarding_completed: new Date().toISOString(),
            force_onboarding: false
          }
        });
      } catch (err) {
        console.warn('[Onboarding] Failed to update user metadata:', err);
      }
    }
  }, [userId]);

  const claimOnboardingXp = useCallback(
    async () => {
      if (!userId) return;
      try {
        const { error } = await supabase.rpc('claim_onboarding_xp');
        if (error) throw error;
      } catch (err) {
        console.warn('[Onboarding] claim_onboarding_xp failed:', err);
      }
    },
    [userId],
  );

  const currentStep = ONBOARDING_STEPS[currentStepIndex] ?? ONBOARDING_STEPS[0];

  // Tính step spotlight hiện tại (bỏ qua modal đầu/cuối)
  const spotlightSteps = ONBOARDING_STEPS.filter(s => s.type === 'spotlight');
  const spotlightStepNumber = spotlightSteps.findIndex(s => s.id === currentStep.id) + 1;
  const totalSpotlightSteps = spotlightSteps.length;

  const next = useCallback(() => {
    if (currentStepIndex < ONBOARDING_STEPS.length - 1) {
      setCurrentStepIndex(i => i + 1);
    }
  }, [currentStepIndex]);

  const prev = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(i => i - 1);
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
    isActive: isActive && hasChecked,
    currentStepIndex,
    currentStep,
    totalSteps: ONBOARDING_STEPS.length,
    spotlightStepNumber,
    totalSpotlightSteps,
    next,
    prev,
    skip,
    complete,
    userName,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}
