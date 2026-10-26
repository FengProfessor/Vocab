import { appAuth } from '@/lib/app-auth-client';

export const supabase = {
  auth: appAuth,
};

export type {
  UserRole,
  Plan,
  Profile,
  ExtensionToken,
  UserGamification,
} from '@/features/auth/types';

export type {
  QuizType,
  Classroom,
  QuizResult,
  StudentProgress,
} from '@/features/classroom/types';

export type { OrderKind } from '@/features/billing/types';

export type {
  GroupStatus,
  Group,
  GroupMember,
} from '@/features/social/types';

export type {
  Word,
  SRSProgress,
} from '@/features/vocab/types';

export type {
  RichCollocationEntry,
  MorphologyAffix,
  MorphologyData,
  CoreSenseEntry,
  DictionaryMeaning,
  WordFamilyEntry,
  DictionaryData,
  GlobalDictionaryEntry,
} from '@/features/dictionary/types';

export type {
  GrammarLevel,
  GrammarExerciseType,
  GrammarExercise,
  GrammarResult,
  GrammarTopic,
  GrammarExample,
  GrammarLesson,
  GrammarSections,
  GrammarExerciseItem,
  GrammarProgress,
} from '@/features/grammar/types';

export type {
  RoadmapDbLevelId,
  RoadmapDbTrack,
  UserRoadmap,
  UserRoadmapStep,
} from '@/features/roadmap/types';
