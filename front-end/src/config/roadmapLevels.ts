import { RoadmapLevelId } from '@/types/enums/RoadmapLevelId';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';

/**
 * Starting levels a learner may self-select for each roadmap track (legacy placement `selfSelect` options).
 */
export const ROADMAP_LEVELS_BY_TRACK: Readonly<Record<RoadmapTrackType, readonly RoadmapLevelId[]>> = {
  [RoadmapTrackType.Cefr]: [
    RoadmapLevelId.A0,
    RoadmapLevelId.A1,
    RoadmapLevelId.A2,
    RoadmapLevelId.B1,
    RoadmapLevelId.B2,
  ],
  [RoadmapTrackType.Thpt]: [RoadmapLevelId.Lop10, RoadmapLevelId.Lop11, RoadmapLevelId.Lop12],
  [RoadmapTrackType.Toeic]: [RoadmapLevelId.Toeic450, RoadmapLevelId.Toeic650, RoadmapLevelId.Toeic800],
  [RoadmapTrackType.Vstep]: [RoadmapLevelId.B1, RoadmapLevelId.B2, RoadmapLevelId.C1],
  [RoadmapTrackType.VnuBac3]: [RoadmapLevelId.A2, RoadmapLevelId.B1],
};

/**
 * Vietnamese label shown for each roadmap level.
 */
export const ROADMAP_LEVEL_LABEL: Readonly<Record<RoadmapLevelId, string>> = {
  [RoadmapLevelId.A0]: 'A0 — Mất gốc / bắt đầu từ đầu',
  [RoadmapLevelId.A1]: 'A1 — Căn bản',
  [RoadmapLevelId.A2]: 'A2 — Sơ cấp',
  [RoadmapLevelId.B1]: 'B1 — Trung cấp',
  [RoadmapLevelId.B2]: 'B2 — Trung cao cấp',
  [RoadmapLevelId.C1]: 'C1 — Cao cấp',
  [RoadmapLevelId.C2]: 'C2 — Thành thạo',
  [RoadmapLevelId.Lop10]: 'Lớp 10',
  [RoadmapLevelId.Lop11]: 'Lớp 11',
  [RoadmapLevelId.Lop12]: 'Lớp 12',
  [RoadmapLevelId.Toeic450]: 'TOEIC 450',
  [RoadmapLevelId.Toeic650]: 'TOEIC 650',
  [RoadmapLevelId.Toeic800]: 'TOEIC 800',
};
