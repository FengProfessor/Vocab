/**
 * Chủ đề luyện đọc pack — user chọn 1 theme bao trùm TOÀN BỘ list từ
 * trước khi bấm Gen AI (không pre-gen).
 */

export interface PackTheme {
  id: string;
  labelVi: string;
  labelEn: string;
  /** Gợi ý ngắn cho prompt AI */
  hint: string;
  emoji: string;
}

/** ~15 chủ đề hay gặp (THPT / đời sống / học thuật nhẹ) */
export const PACK_THEMES: PackTheme[] = [
  {
    id: 'daily-life',
    labelVi: 'Đời sống hàng ngày',
    labelEn: 'Daily life',
    hint: 'routines, home, habits, family time',
    emoji: '🏠',
  },
  {
    id: 'school-study',
    labelVi: 'Trường lớp & học tập',
    labelEn: 'School & study',
    hint: 'classes, exams, homework, teachers, classmates',
    emoji: '📚',
  },
  {
    id: 'environment',
    labelVi: 'Môi trường',
    labelEn: 'Environment',
    hint: 'nature, pollution, climate, recycling, wildlife',
    emoji: '🌿',
  },
  {
    id: 'health',
    labelVi: 'Sức khỏe',
    labelEn: 'Health',
    hint: 'body, illness, exercise, diet, hospital',
    emoji: '💪',
  },
  {
    id: 'food',
    labelVi: 'Ẩm thực & ăn uống',
    labelEn: 'Food & drink',
    hint: 'meals, cooking, restaurants, ingredients',
    emoji: '🍜',
  },
  {
    id: 'travel',
    labelVi: 'Du lịch & giao thông',
    labelEn: 'Travel & transport',
    hint: 'trips, hotels, tickets, directions, vehicles',
    emoji: '✈️',
  },
  {
    id: 'work-career',
    labelVi: 'Công việc & nghề nghiệp',
    labelEn: 'Work & career',
    hint: 'jobs, office, interviews, skills, workplace',
    emoji: '💼',
  },
  {
    id: 'technology',
    labelVi: 'Công nghệ',
    labelEn: 'Technology',
    hint: 'phones, internet, AI, apps, digital life',
    emoji: '💻',
  },
  {
    id: 'media-entertainment',
    labelVi: 'Giải trí & truyền thông',
    labelEn: 'Media & entertainment',
    hint: 'films, music, social media, news, hobbies',
    emoji: '🎬',
  },
  {
    id: 'sports',
    labelVi: 'Thể thao',
    labelEn: 'Sports',
    hint: 'games, training, teams, competition, fitness',
    emoji: '⚽',
  },
  {
    id: 'society',
    labelVi: 'Xã hội & cộng đồng',
    labelEn: 'Society & community',
    hint: 'people, cities, culture, volunteering, public life',
    emoji: '🏙️',
  },
  {
    id: 'shopping-money',
    labelVi: 'Mua sắm & tiền bạc',
    labelEn: 'Shopping & money',
    hint: 'stores, prices, budget, online shopping',
    emoji: '🛒',
  },
  {
    id: 'nature-animals',
    labelVi: 'Thiên nhiên & động vật',
    labelEn: 'Nature & animals',
    hint: 'forests, oceans, pets, habitats',
    emoji: '🐾',
  },
  {
    id: 'science',
    labelVi: 'Khoa học',
    labelEn: 'Science',
    hint: 'experiments, discoveries, space, lab, research',
    emoji: '🔬',
  },
  {
    id: 'friendship-feelings',
    labelVi: 'Bạn bè & cảm xúc',
    labelEn: 'Friendship & feelings',
    hint: 'friends, emotions, relationships, kindness',
    emoji: '💛',
  },
];

export function getPackTheme(id: string | null | undefined): PackTheme | null {
  if (!id) return null;
  return PACK_THEMES.find((t) => t.id === id) ?? null;
}

export function isValidPackThemeId(id: unknown): id is string {
  return typeof id === 'string' && PACK_THEMES.some((t) => t.id === id);
}
