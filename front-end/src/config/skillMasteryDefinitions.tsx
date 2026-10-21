import {
  BookOutlined,
  CustomerServiceOutlined,
  FontColorsOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { SkillMasteryDefinition } from '@/config/types/SkillMasteryDefinition';

/**
 * The four core skills shown on the student dashboard.
 */
export const SKILL_MASTERY_DEFINITIONS: readonly SkillMasteryDefinition[] = [
  { key: 'vocab', name: 'Từ vựng FSRS v5', icon: <BookOutlined /> },
  { key: 'grammar', name: 'Ngữ pháp 4 Bước', icon: <FontColorsOutlined /> },
  { key: 'reading', name: 'Đọc hiểu Song ngữ', icon: <ReadOutlined /> },
  { key: 'listening', name: 'Nghe chép chính tả', icon: <CustomerServiceOutlined /> },
];
