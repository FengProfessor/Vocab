/**
 * VSTEP Speaking Types & Schema Definitions
 * Phục vụ hệ thống luyện thi nói chuẩn hóa VSTEP B1 - B2 - C1 (Đại Học Ngoại Ngữ - ĐHQGHN & Bộ GD&ĐT)
 */

export type VstepSpeakingLevel = 'B1' | 'B2' | 'C1';

export interface VstepSpeakingVocabulary {
  term: string;
  ipa?: string;
  partOfSpeech?: string;
  meaningVi: string;
  collocation?: string;
}

export interface VstepSpeakingPart1Question {
  id: string;
  question: string;
  questionVi: string;
  sampleB1: string;
  sampleB2: string;
  sampleC1: string;
  keyVocabulary: VstepSpeakingVocabulary[];
}

export interface VstepSpeakingPart1Topic {
  id: string;
  topicName: string;
  topicVi: string;
  category: 'personal' | 'work_study' | 'society_lifestyle' | 'technology_media';
  suggestedPrepTimeSeconds: number; // typically 0s (immediate response)
  suggestedSpeakTimeSeconds: number; // 3 minutes total for part 1
  questions: VstepSpeakingPart1Question[];
}

export interface VstepSpeakingPart2Option {
  id: string;
  title: string;
  titleVi: string;
  pros: string[];
  cons: string[];
}

export interface VstepSpeakingPart2Scenario {
  id: string;
  title: string;
  titleVi: string;
  situation: string;
  situationVi: string;
  options: [VstepSpeakingPart2Option, VstepSpeakingPart2Option, VstepSpeakingPart2Option];
  recommendedChoice: string; // ID of the optimal choice
  prepTimeSeconds: number; // 60s
  speakTimeSeconds: number; // 180s (3 minutes)
  sampleSpeechB2: string;
  sampleSpeechC1: string;
  iceBreakdown: {
    introduction: string;
    comparisonAndCounter: string;
    endAndConclusion: string;
  };
  usefulPhrases: string[];
  keyVocabulary: VstepSpeakingVocabulary[];
}

export interface VstepSpeakingPart3Topic {
  id: string;
  topicTitle: string;
  topicVi: string;
  category: 'education' | 'environment' | 'technology' | 'society_culture' | 'health_wellness';
  prepTimeSeconds: number; // 60s
  speakTimeSeconds: number; // 240s (4 minutes)
  mindmap: {
    centerIdea: string;
    givenBranches: [string, string, string]; // 3 gợi ý có sẵn
    customBranchPlaceholder: string; // Ý tự phát triển của thí sinh
  };
  sampleSpeechB2: string;
  sampleSpeechC1: string;
  speechOutline: {
    opening: string;
    bodyPoint1: string;
    bodyPoint2: string;
    bodyPoint3: string;
    bodyPointCustom: string;
    closing: string;
  };
  followUpQuestions: Array<{
    question: string;
    questionVi: string;
    sampleAnswer: string;
  }>;
  keyVocabulary: VstepSpeakingVocabulary[];
}

export interface VstepFullSpeakingExam {
  id: string;
  title: string;
  titleVi: string;
  source: string; // e.g. "ULIS - ĐHQG Hà Nội"
  targetLevel: VstepSpeakingLevel;
  totalDurationMinutes: number; // 12 minutes
  part1: VstepSpeakingPart1Topic;
  part2: VstepSpeakingPart2Scenario;
  part3: VstepSpeakingPart3Topic;
}
