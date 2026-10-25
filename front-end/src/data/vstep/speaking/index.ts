import { VstepSpeakingPart1Topic, VstepSpeakingPart2Scenario, VstepSpeakingPart3Topic, VstepFullSpeakingExam } from './types';
import { VSTEP_SPEAKING_PART1_TOPICS } from './part1-topics';
import { VSTEP_SPEAKING_PART2_SCENARIOS } from './part2-scenarios';
import { VSTEP_SPEAKING_PART3_TOPICS } from './part3-topics';

export * from './types';
export * from './part1-topics';
export * from './part2-scenarios';
export * from './part3-topics';

/**
 * Full authentic 12-minute VSTEP Speaking Simulation Exams
 * Formatted strictly according to ULIS / VNU & Ministry of Education benchmarks:
 * - Part 1: Social Interaction (3 mins, 2 topics / 3 questions)
 * - Part 2: Solution Discussion (1 min prep, 3 mins speech)
 * - Part 3: Topic Development (1 min prep, 4 mins speech + 3 follow-ups)
 */
export const VSTEP_FULL_SPEAKING_EXAMS: VstepFullSpeakingExam[] = [
  {
    id: 'vstep-speaking-exam-01',
    title: 'VSTEP Speaking Mock Exam 1: Academic & Digital Transition',
    titleVi: 'Đề thi thử VSTEP Nói 1: Chuyển đổi học thuật & Kỷ nguyên số',
    source: 'ĐHQG Hà Nội (ULIS) - Định dạng chuẩn hóa',
    targetLevel: 'B2',
    totalDurationMinutes: 12,
    examContextVi: 'Đề thi mô phỏng kỳ thi đánh giá năng lực ngoại ngữ đầu ra thạc sĩ và cử nhân chuẩn quốc gia, tập trung vào kỹ năng học tập độc lập và phương tiện số.',
    part1: VSTEP_SPEAKING_PART1_TOPICS[1], // Studies & Academic Life
    part2: VSTEP_SPEAKING_PART2_SCENARIOS[0], // Laptop graduation gift
    part3: VSTEP_SPEAKING_PART3_TOPICS[0], // Online learning
  },
  {
    id: 'vstep-speaking-exam-02',
    title: 'VSTEP Speaking Mock Exam 2: Urbanization & Modern Careers',
    titleVi: 'Đề thi thử VSTEP Nói 2: Đô thị hóa & Sự nghiệp hiện đại',
    source: 'Bộ GD&ĐT - Khảo thí VSTEP B2-C1',
    targetLevel: 'B2',
    totalDurationMinutes: 12,
    examContextVi: 'Đề thi đánh giá năng lực biện luận về các vấn đề xã hội vĩ mô, di cư đô thị và lựa chọn nơi cư trú cho tân sinh viên.',
    part1: VSTEP_SPEAKING_PART1_TOPICS[2], // Job & Career Aspirations
    part2: VSTEP_SPEAKING_PART2_SCENARIOS[3], // Freshman accommodation
    part3: VSTEP_SPEAKING_PART3_TOPICS[1], // Rapid Urbanization
  },
  {
    id: 'vstep-speaking-exam-03',
    title: 'VSTEP Speaking Mock Exam 3: Workplace Dynamics & Telecommuting',
    titleVi: 'Đề thi thử VSTEP Nói 3: Môi trường công sở & Làm việc từ xa',
    source: 'Trung tâm Khảo thí Quốc gia VSTEP',
    targetLevel: 'C1',
    totalDurationMinutes: 12,
    examContextVi: 'Đề thi cấp độ C1 đánh giá vốn từ vựng học thuật cao cấp về quản trị nhân sự, kinh tế vĩ mô và tương lai của thị trường lao động phi tập trung.',
    part1: VSTEP_SPEAKING_PART1_TOPICS[11], // Transportation & Commuting
    part2: VSTEP_SPEAKING_PART2_SCENARIOS[4], // Tech startup vs corporate
    part3: VSTEP_SPEAKING_PART3_TOPICS[2], // Remote & Hybrid Work
  },
  {
    id: 'vstep-speaking-exam-04',
    title: 'VSTEP Speaking Mock Exam 4: Health, Wellness & Social Dynamics',
    titleVi: 'Đề thi thử VSTEP Nói 4: Thể chất, Sức khỏe & Tương tác xã hội',
    source: 'Hội đồng Khảo thí Ngoại ngữ ĐHQG',
    targetLevel: 'B2',
    totalDurationMinutes: 12,
    examContextVi: 'Đề thi xoay quanh thói quen duy trì thể lực cho người đi làm và cuộc khủng hoảng sức khỏe cộng đồng do thói quen ăn uống nhanh đô thị.',
    part1: VSTEP_SPEAKING_PART1_TOPICS[5], // Health, Diet & Well-being
    part2: VSTEP_SPEAKING_PART2_SCENARIOS[5], // Fitness regimen for accountant
    part3: VSTEP_SPEAKING_PART3_TOPICS[3], // Fast Food & Public Health
  },
  {
    id: 'vstep-speaking-exam-05',
    title: 'VSTEP Speaking Mock Exam 5: Global Tourism & Ecological Stewardship',
    titleVi: 'Đề thi thử VSTEP Nói 5: Du lịch toàn cầu & Bảo tồn sinh thái',
    source: 'ĐHQG TP.HCM - VSTEP Center',
    targetLevel: 'B2',
    totalDurationMinutes: 12,
    examContextVi: 'Đề thi khảo sát năng lực thảo luận về kỳ nghỉ dưỡng doanh nghiệp kết hợp với biện luận bảo tồn sinh thái và di sản bản địa bền vững.',
    part1: VSTEP_SPEAKING_PART1_TOPICS[6], // Travel & Tourism
    part2: VSTEP_SPEAKING_PART2_SCENARIOS[1], // Company retreat destination
    part3: VSTEP_SPEAKING_PART3_TOPICS[4], // Ecotourism & Indigenous Culture
  },
  {
    id: 'vstep-speaking-exam-06',
    title: 'VSTEP Speaking Mock Exam 6: Artificial Intelligence & Workforce Evolution',
    titleVi: 'Đề thi thử VSTEP Nói 6: Trí tuệ nhân tạo & Tiến hóa nguồn nhân lực',
    source: 'Viện Khảo thí Ngôn ngữ Quốc tế',
    targetLevel: 'C1',
    totalDurationMinutes: 12,
    examContextVi: 'Đề thi chuyên sâu C1 kiểm tra năng lực phản biện triết học và kinh tế về tác động của Generative AI đến việc làm trí thức và thích ứng kỹ năng.',
    part1: VSTEP_SPEAKING_PART1_TOPICS[14], // AI & Smart Tech
    part2: VSTEP_SPEAKING_PART2_SCENARIOS[2], // Language acquisition method
    part3: VSTEP_SPEAKING_PART3_TOPICS[5], // Generative AI & White-Collar Labor
  },
  {
    id: 'vstep-speaking-exam-07',
    title: 'VSTEP Speaking Mock Exam 7: Environmental Sustainability & Green Transition',
    titleVi: 'Đề thi thử VSTEP Nói 7: Phát triển bền vững & Chuyển dịch năng lượng xanh',
    source: 'Hội đồng Giám khảo Khảo thí VSTEP Miền Bắc',
    targetLevel: 'B2',
    totalDurationMinutes: 12,
    examContextVi: 'Đề thi kiểm tra kiến thức về môi trường sinh thái, năng lượng tái tạo, cam kết Net-Zero và quản lý lối sống sinh thái đô thị.',
    part1: VSTEP_SPEAKING_PART1_TOPICS[7], // Environment & Climate
    part2: VSTEP_SPEAKING_PART2_SCENARIOS[6], // Cohabitation friction
    part3: VSTEP_SPEAKING_PART3_TOPICS[6], // Renewable Energy Transition
  },
  {
    id: 'vstep-speaking-exam-08',
    title: 'VSTEP Speaking Mock Exam 8: Cultural Heritage & Arts Revitalization',
    titleVi: 'Đề thi thử VSTEP Nói 8: Di sản văn hóa & Phục hưng nghệ thuật truyền thống',
    source: 'Hội đồng Chuyên môn Ngôn ngữ học Ứng dụng',
    targetLevel: 'C1',
    totalDurationMinutes: 12,
    examContextVi: 'Đề thi văn hóa - xã hội bậc cao, thử thách thí sinh về ngôn ngữ diễn đạt nghệ thuật dân gian, làng nghề truyền thống và các giải pháp số hóa di sản.',
    part1: VSTEP_SPEAKING_PART1_TOPICS[9], // Music & Arts
    part2: VSTEP_SPEAKING_PART2_SCENARIOS[0], // Laptop graduation gift
    part3: VSTEP_SPEAKING_PART3_TOPICS[7], // Folk Arts & Traditional Crafts
  },
];

/**
 * Lookup helper: retrieve full exam by ID
 */
export function getVstepSpeakingExamById(id: string): VstepFullSpeakingExam | undefined {
  return VSTEP_FULL_SPEAKING_EXAMS.find((e) => e.id === id);
}

/**
 * Lookup helper: retrieve Part 1 topic by ID
 */
export function getVstepPart1TopicById(id: string): VstepSpeakingPart1Topic | undefined {
  return VSTEP_SPEAKING_PART1_TOPICS.find((t) => t.id === id);
}

/**
 * Lookup helper: retrieve Part 2 scenario by ID
 */
export function getVstepPart2ScenarioById(id: string): VstepSpeakingPart2Scenario | undefined {
  return VSTEP_SPEAKING_PART2_SCENARIOS.find((s) => s.id === id);
}

/**
 * Lookup helper: retrieve Part 3 topic by ID
 */
export function getVstepPart3TopicById(id: string): VstepSpeakingPart3Topic | undefined {
  return VSTEP_SPEAKING_PART3_TOPICS.find((t) => t.id === id);
}
