import React from 'react';
import {
  RoadmapAssessmentTier,
  RoadmapLevelId,
  RoadmapStepStatus,
  RoadmapTrackType,
} from '@/types/enums';

export type RoadmapDbLevelId = 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'lop-10' | 'lop-11' | 'lop-12';
export type RoadmapDbTrack = 'cefr' | 'thpt';

export interface UserRoadmap {
  user_id: string;
  track: RoadmapDbTrack;
  roadmap_version: string;
  level_id: RoadmapDbLevelId;
  current_unit_id: string | null;
  placement: Record<string, unknown> | null;
  started_at: string;
  updated_at: string;
}

export interface UserRoadmapStep {
  user_id: string;
  step_id: string;
  status: 'in_progress' | 'completed';
  score: number | null;
  completed_at: string | null;
  created_at: string;
}

export interface CompleteStepResultDto {
  stepId: string;
  status: RoadmapStepStatus | string;
  xpAwarded: number;
}

export interface RoadmapStationBlueprint {
  id: string;
  title: string;
  description: string;
  actionRoute: string;
  estimatedMinutes: number;
  xpReward: number;
  isCheckpointOrExam: boolean;
}

export interface RoadmapStepDto {
  id: string;
  stepIndex: number;
  title: string;
  description: string;
  levelId: RoadmapLevelId;
  trackType: RoadmapTrackType;
  status: RoadmapStepStatus;
  estimatedMinutes: number;
  actionRoute: string;
  xpReward: number;
}

export interface RoadmapStepMetadataDto {
  stepId: string;
  title: string;
  description: string;
  actionRoute: string;
  estimatedMinutes: number;
  xpReward: number;
  isCheckpointOrExam: boolean;
  status: RoadmapStepStatus;
}

export interface ServerRoadmapStepDto {
  stepId: string;
  status: RoadmapStepStatus | string;
  score: number | null;
  completedAt: string | null;
}

export interface ServerRoadmapProgressDto {
  track: RoadmapTrackType | string;
  enrolled: boolean;
  needsPlacement: boolean;
  levelId: RoadmapLevelId | string | null;
  currentUnitId: string | null;
  completedSteps: ServerRoadmapStepDto[];
}

export interface SkillMasteryItem {
  key: string;
  name: string;
  icon: React.ReactNode;
  percent: number | null;
}

export interface UserRoadmapStateDto {
  currentLevel: RoadmapLevelId;
  trackType: RoadmapTrackType;
  assessmentTier: RoadmapAssessmentTier;
  completionPercent: number;
  currentDay: number;
  steps: RoadmapStepDto[];
}
