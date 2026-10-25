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
  exampleSentence?: string;
}

export interface VstepSpeakingPart1Question {
  id: string;
  question: string;
  questionVi: string;
  contextBackgroundVi?: string; // Bối cảnh văn hóa & tình huống đời thực
  examinerExpectationsVi?: string; // Kỳ vọng của giám khảo theo thang chấm
  commonMistakesVi?: string[]; // Các lỗi ngữ pháp, phát âm hay gặp
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
  backgroundOverviewVi?: string; // Tổng quan bối cảnh xã hội của chủ đề
  examinerCriteriaVi?: string; // Hướng dẫn giám khảo chấm điểm Part 1
  suggestedPrepTimeSeconds: number; // 0s (phản xạ trực tiếp)
  suggestedSpeakTimeSeconds: number; // 180s (3 phút)
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
  backgroundContextVi?: string; // Phân tích bối cảnh sâu: nguyên nhân thế tiến thoái lưỡng nan
  stakeholdersAnalysisVi?: string; // Phân tích lợi ích các bên liên quan (gia đình, sếp, bạn bè...)
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
  socioEconomicContextVi?: string; // Bối cảnh kinh tế - xã hội toàn cầu & Việt Nam
  academicCitationsVi?: string[]; // Dẫn chứng học thuật / tổ chức uy tín (UNESCO, WHO, WB)
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
    contextNoteVi?: string; // Bối cảnh tại sao giám khảo hỏi câu này
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
  examContextVi?: string; // Bối cảnh khảo thí & đề thi
  part1: VstepSpeakingPart1Topic;
  part2: VstepSpeakingPart2Scenario;
  part3: VstepSpeakingPart3Topic;
}
