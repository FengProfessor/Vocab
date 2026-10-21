import {
  CompassOutlined,
  CustomerServiceOutlined,
  FileProtectOutlined,
  ReadOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';
import { RoadmapTrackOption } from '@/config/types/RoadmapTrackOption';

/**
 * Tracks offered by the roadmap (legacy journey: CEFR, THPT Quốc gia, TOEIC, plus VSTEP and VNU Bậc 3).
 */
export const ROADMAP_TRACK_OPTIONS: readonly RoadmapTrackOption[] = [
  { value: RoadmapTrackType.Vstep, label: 'VSTEP B1-C1', icon: <FileProtectOutlined /> },
  { value: RoadmapTrackType.Toeic, label: 'TOEIC 450-800+', icon: <CustomerServiceOutlined /> },
  { value: RoadmapTrackType.Cefr, label: 'Khung CEFR (A0-B2)', icon: <CompassOutlined /> },
  { value: RoadmapTrackType.Thpt, label: 'Ôn thi THPT Quốc Gia', icon: <ReadOutlined /> },
  { value: RoadmapTrackType.VnuBac3, label: 'VNU Bậc 3', icon: <BankOutlined /> },
];
