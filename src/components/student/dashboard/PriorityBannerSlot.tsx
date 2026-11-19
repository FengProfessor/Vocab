'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Profile } from '@/lib/supabase';
import { isCohortProPromoActive } from '@/lib/cohort-pro-promo';
import { EnableNotifications } from '@/components/EnableNotifications';
import type { ChallengeWidgetData } from './types';

const FreeQuotaBanner = dynamic(
  () => import('@/components/upsell/FreeQuotaBanner').then((m) => m.FreeQuotaBanner),
  { ssr: false },
);
const CohortProPromoBanner = dynamic(
  () => import('@/components/upsell/CohortProPromoBanner').then((m) => m.CohortProPromoBanner),
  { ssr: false },
);
const ChallengeWidget = dynamic(
  () => import('@/components/challenge/ChallengeWidget').then((m) => m.ChallengeWidget),
  { ssr: false },
);

const FREE_QUOTA_HIDE_KEY = 'lp:free_quota_banner_hide';
const COHORT_HIDE_KEY = 'lp:cohort_pro_promo_banner_hide';

function readSessionFlag(key: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

interface PriorityBannerSlotProps {
  profile: Profile | null;
  isFreePlan: boolean;
  challengeWidget: ChallengeWidgetData | null;
  dashboardSecondarySettled: boolean;
}

export function PriorityBannerSlot({
  profile,
  isFreePlan,
  challengeWidget,
  dashboardSecondarySettled,
}: PriorityBannerSlotProps) {
  const [freeQuotaDismissed, setFreeQuotaDismissed] = useState<boolean>(() =>
    readSessionFlag(FREE_QUOTA_HIDE_KEY),
  );
  const [cohortDismissed, setCohortDismissed] = useState<boolean>(() =>
    readSessionFlag(COHORT_HIDE_KEY),
  );
  const [freeQuotaStatus, setFreeQuotaStatus] = useState<'pending' | 'active' | 'inactive'>(
    'pending',
  );
  const [cohortChecked, setCohortChecked] = useState(false);
  const [cohortActive, setCohortActive] = useState(false);

  useEffect(() => {
    const syncCohort = () => {
      setCohortActive(isCohortProPromoActive());
      setCohortChecked(true);
    };
    syncCohort();
    const id = window.setInterval(() => {
      setCohortActive(isCohortProPromoActive());
    }, 30_000);
    return () => window.clearInterval(id);
  }, []);

  const hiddenNotifyAnchor = (
    <div
      data-onboarding="notify"
      className="pointer-events-none h-0 w-full overflow-hidden opacity-0"
      aria-hidden
    />
  );

  // Wait for profile resolution so PRO/VIP never fires /api/profile or flashes promos
  if (!profile) {
    return hiddenNotifyAnchor;
  }

  // Tier 1: FreeQuotaBanner (only for Free plan and not dismissed in session)
  const freeQuotaEligible = isFreePlan && !freeQuotaDismissed;
  if (freeQuotaEligible && freeQuotaStatus !== 'inactive') {
    return (
      <>
        <FreeQuotaBanner
          enabled
          onStatusChange={setFreeQuotaStatus}
          onDismiss={() => {
            setFreeQuotaDismissed(true);
            setFreeQuotaStatus('inactive');
          }}
        />
        {hiddenNotifyAnchor}
      </>
    );
  }

  // Tier 2: CohortProPromoBanner (only for Free plan when promo active & not dismissed)
  if (isFreePlan && !cohortDismissed) {
    if (!cohortChecked) {
      return hiddenNotifyAnchor;
    }
    if (cohortActive) {
      return (
        <>
          <CohortProPromoBanner
            variant="dashboard"
            onDismiss={() => setCohortDismissed(true)}
          />
          {hiddenNotifyAnchor}
        </>
      );
    }
  }

  // Wait for consolidated secondary payload so ChallengeWidget can pre-empt EnableNotifications
  if (!dashboardSecondarySettled) {
    return hiddenNotifyAnchor;
  }

  // Tier 3: ChallengeWidget (data pre-fetched via /api/student/dashboard)
  const hasChallenge = Boolean(
    challengeWidget?.activeParticipation || challengeWidget?.promotedChallenge,
  );
  if (hasChallenge) {
    return (
      <>
        <ChallengeWidget initialData={challengeWidget} skipFetch />
        {hiddenNotifyAnchor}
      </>
    );
  }

  // Tier 4: EnableNotifications (renders [data-onboarding="notify"] internally)
  return <EnableNotifications />;
}
