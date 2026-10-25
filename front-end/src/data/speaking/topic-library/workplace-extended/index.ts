/**
 * LingoPro Speaking Topic Library
 * Category: Workplace Extended
 * Barrel File
 */

import { MEETING_SMALL_TALK_ITEMS } from './meeting-small-talk';
import { ONBOARDING_FIRST_DAY_ITEMS } from './onboarding-first-day';
import { EMAIL_RECAP_VERBAL_ITEMS } from './email-recap-verbal';
import { PROJECT_HANDOVER_ITEMS } from './project-handover';
import { QUARTERLY_REVIEW_ITEMS } from './quarterly-review';
import { REMOTE_COLLABORATION_ITEMS } from './remote-collaboration';
import { IT_HELPDESK_ITEMS } from './IT-helpdesk';
import { LUNCH_BREAK_CHAT_ITEMS } from './lunch-break-chat';
import { NETWORKING_EVENTS_ITEMS } from './networking-events';
import { RESIGNATION_FAREWELL_ITEMS } from './resignation-farewell';

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

export const allWorkplaceExtendedTopics: TopicLibraryItem[] = [
  ...MEETING_SMALL_TALK_ITEMS,
  ...ONBOARDING_FIRST_DAY_ITEMS,
  ...EMAIL_RECAP_VERBAL_ITEMS,
  ...PROJECT_HANDOVER_ITEMS,
  ...QUARTERLY_REVIEW_ITEMS,
  ...REMOTE_COLLABORATION_ITEMS,
  ...IT_HELPDESK_ITEMS,
  ...LUNCH_BREAK_CHAT_ITEMS,
  ...NETWORKING_EVENTS_ITEMS,
  ...RESIGNATION_FAREWELL_ITEMS
];

export const WORKPLACE_EXTENDED_SUBCATEGORIES = [
  { slug: 'meeting_small_talk', nameEn: 'Meeting Small Talk', nameVi: 'Trò chuyện trước/sau họp', icon: 'coffee' },
  { slug: 'onboarding_first_day', nameEn: 'Onboarding & First Day', nameVi: 'Nhận việc & Ngày đầu', icon: 'user-plus' },
  { slug: 'email_recap_verbal', nameEn: 'Email Recap & Verbal', nameVi: 'Tóm tắt Email qua lời nói', icon: 'mail' },
  { slug: 'project_handover', nameEn: 'Project Handover', nameVi: 'Bàn giao dự án', icon: 'briefcase' },
  { slug: 'quarterly_review', nameEn: 'Quarterly Review', nameVi: 'Đánh giá hàng quý', icon: 'award' },
  { slug: 'remote_collaboration', nameEn: 'Remote Collaboration', nameVi: 'Làm việc từ xa', icon: 'monitor' },
  { slug: 'it_helpdesk', nameEn: 'IT & Helpdesk', nameVi: 'Hỗ trợ IT', icon: 'headphones' },
  { slug: 'lunch_break_chat', nameEn: 'Lunch Break Chat', nameVi: 'Trò chuyện giờ nghỉ trưa', icon: 'sun' },
  { slug: 'networking_events', nameEn: 'Networking Events', nameVi: 'Sự kiện giao lưu', icon: 'users' },
  { slug: 'resignation_farewell', nameEn: 'Resignation & Farewell', nameVi: 'Nghỉ việc & Chia tay', icon: 'hand' }
];

export function getWorkplaceExtendedBySubcategory(slug: string): TopicLibraryItem[] {
  return allWorkplaceExtendedTopics.filter(item => item.subcategory === slug);
}
