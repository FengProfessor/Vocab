'use client';

import { useEffect, useRef, useState } from 'react';
import type { UserGamification } from '@/lib/supabase';
import { earnedBadges, xpToLevel } from '@/lib/gamification';
import { STREAK_MILESTONES } from '@/lib/encouragement';
import type { MilestonePopupPayload } from '@/components/gamification/MilestonePopup';

interface UseMilestoneDetectionParams {
  profileId?: string;
  gamification: UserGamification;
  gamificationLoading: boolean;
  countsReady: boolean;
  dashboardSecondarySettled: boolean;
  studyStreak: number;
  masteredCount: number;
}

export function useMilestoneDetection({
  profileId,
  gamification,
  gamificationLoading,
  countsReady,
  dashboardSecondarySettled,
  studyStreak,
  masteredCount,
}: UseMilestoneDetectionParams) {
  const [milestonePopup, setMilestonePopup] = useState<MilestonePopupPayload | null>(null);
  const prevSnapshotRef = useRef<{ level: number; badgeIds: string[]; streak: number } | null>(null);

  useEffect(() => {
    if (!profileId || gamificationLoading || !countsReady || !dashboardSecondarySettled) return;
    const currentLevel = xpToLevel(gamification.total_xp);
    const earned = earnedBadges(
      { ...gamification, current_streak: studyStreak },
      masteredCount,
    ).filter((b) => b.earned);
    const currentBadges = earned.map((b) => b.id);

    const prev = prevSnapshotRef.current;

    if (!prev) {
      prevSnapshotRef.current = {
        level: currentLevel,
        badgeIds: currentBadges,
        streak: studyStreak,
      };
      try {
        sessionStorage.setItem(`milestone_level_${currentLevel}`, '1');
      } catch {
        /* ignore */
      }
      return;
    }

    const alreadyShown = (key: string) => {
      try {
        return sessionStorage.getItem(key) === '1';
      } catch {
        return false;
      }
    };
    const markShown = (key: string) => {
      try {
        sessionStorage.setItem(key, '1');
      } catch {
        /* ignore */
      }
    };

    if (currentLevel > prev.level) {
      const ssKey = `milestone_level_${currentLevel}`;
      if (!alreadyShown(ssKey)) {
        markShown(ssKey);
        queueMicrotask(() => {
          setMilestonePopup({ kind: 'level', value: currentLevel, intensity: 'epic' });
        });
      }
    } else {
      const newBadgeId = currentBadges.find((id) => !prev.badgeIds.includes(id));
      if (newBadgeId) {
        const ssKey = `milestone_badge_${newBadgeId}`;
        if (!alreadyShown(ssKey)) {
          markShown(ssKey);
          const label = earned.find((b) => b.id === newBadgeId)?.label;
          queueMicrotask(() => {
            setMilestonePopup({
              kind: 'badge',
              badgeLabel: label,
              intensity: 'strong',
            });
          });
        }
      } else {
        const hitStreak =
          (STREAK_MILESTONES as readonly number[]).includes(studyStreak) &&
          studyStreak > prev.streak;
        if (hitStreak) {
          const ssKey = `milestone_streak_${studyStreak}`;
          if (!alreadyShown(ssKey)) {
            markShown(ssKey);
            queueMicrotask(() => {
              setMilestonePopup({ kind: 'streak', value: studyStreak, intensity: 'strong' });
            });
          }
        }
      }
    }

    prevSnapshotRef.current = {
      level: currentLevel,
      badgeIds: currentBadges,
      streak: studyStreak,
    };
  }, [
    gamification,
    gamificationLoading,
    countsReady,
    dashboardSecondarySettled,
    studyStreak,
    masteredCount,
    profileId,
  ]);

  return { milestonePopup, setMilestonePopup };
}
