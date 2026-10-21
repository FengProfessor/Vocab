import { RoadmapStationBlueprint } from '@/types/roadmap/RoadmapStationBlueprint';

/**
 * Daily learning stations of the adaptive roadmap.
 * TODO: [Backend API Required] GET /api/v1/roadmap/catalog?track={track}&level={level} to serve the per-track,
 * per-level units and stations (legacy src/data roadmap definitions); until then every track shares this daily plan.
 */
export const ROADMAP_DAILY_STATIONS: readonly RoadmapStationBlueprint[] = [
  {
    id: 'daily-vocab-fsrs',
    title: 'Ôn từ vựng FSRS v5 đến hạn',
    description: 'Hoàn thành hàng đợi thẻ từ vựng đến hạn của hôm nay.',
    actionRoute: '/app/vocab',
    estimatedMinutes: 10,
    xpReward: 20,
    isCheckpointOrExam: false,
  },
  {
    id: 'daily-grammar',
    title: 'Ngữ pháp theo chu trình 4 bước',
    description: 'Học một chuyên đề ngữ pháp phù hợp với cấp độ hiện tại.',
    actionRoute: '/app/grammar',
    estimatedMinutes: 12,
    xpReward: 25,
    isCheckpointOrExam: false,
  },
  {
    id: 'daily-reading',
    title: 'Đọc hiểu song ngữ hàng ngày',
    description: 'Đọc bài hàng ngày và lưu từ mới vào hàng đợi ôn tập.',
    actionRoute: '/app/reading',
    estimatedMinutes: 15,
    xpReward: 30,
    isCheckpointOrExam: false,
  },
  {
    id: 'daily-listening',
    title: 'Luyện nghe chép chính tả',
    description: 'Nghe và chép lại hội thoại để rèn phản xạ nghe TOEIC.',
    actionRoute: '/app/toeic',
    estimatedMinutes: 15,
    xpReward: 35,
    isCheckpointOrExam: false,
  },
];
