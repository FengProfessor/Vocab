import { PACK_THEMES, isValidPackThemeId } from './pack-themes';

const THEME_KEYWORDS: Record<string, string[]> = {
  'daily-life': [
    'daily', 'routine', 'habit', 'morning', 'household', 'lifestyle', 'everyday',
    'chores', 'leisure', 'living', 'schedule', 'home life'
  ],
  'school-study': [
    'school', 'study', 'student', 'teacher', 'education', 'classroom', 'university',
    'college', 'exam', 'homework', 'learning', 'academic', 'curriculum', 'grade',
    'tuition', 'lecture', 'degree', 'campus'
  ],
  'environment': [
    'environment', 'climate', 'pollution', 'warming', 'recycle', 'waste', 'carbon',
    'greenhouse', 'renewable', 'forest', 'conservation', 'ecological', 'emission',
    'sustainability', 'fossil fuel', 'biodegradable', 'eco-friendly'
  ],
  'health': [
    'health', 'doctor', 'hospital', 'medicine', 'disease', 'illness', 'mental',
    'physical', 'diet', 'nutrition', 'exercise', 'fitness', 'therapy', 'patient',
    'wellness', 'symptom', 'immune', 'medical', 'anxiety', 'sleep'
  ],
  'food': [
    'food', 'cook', 'recipe', 'meal', 'restaurant', 'coffee', 'tea', 'culinary',
    'chef', 'ingredient', 'cuisine', 'flavor', 'taste', 'soup', 'eat', 'dish',
    'dining', 'bakery', 'kitchen', 'beverage'
  ],
  'travel': [
    'travel', 'trip', 'tourism', 'tourist', 'hotel', 'flight', 'airline', 'airport',
    'vacation', 'journey', 'destination', 'explore', 'transport', 'vehicle', 'commute',
    'railway', 'luggage', 'visiting'
  ],
  'work-career': [
    'work', 'job', 'office', 'career', 'employee', 'employer', 'workplace', 'company',
    'corporate', 'interview', 'salary', 'resume', 'management', 'promotion', 'profession',
    'business meeting', 'staff', 'memo', 'relocation'
  ],
  'technology': [
    'technology', 'computer', 'software', 'internet', 'digital', 'app', 'artificial intelligence',
    'smartphone', 'robot', 'automation', 'hardware', 'cyber', 'online platform', 'device',
    'algorithm', 'data science'
  ],
  'media-entertainment': [
    'social media', 'media', 'film', 'movie', 'cinema', 'music', 'song', 'entertainment',
    'news', 'celebrity', 'television', 'broadcast', 'streaming', 'theater', 'video',
    'instagram', 'tiktok', 'facebook', 'influencer'
  ],
  'sports': [
    'sport', 'game', 'football', 'soccer', 'basketball', 'tennis', 'running', 'cycling',
    'athlete', 'tournament', 'championship', 'competition', 'team', 'workout', 'training',
    'olympic', 'marathon'
  ],
  'society': [
    'society', 'community', 'culture', 'tradition', 'urban', 'city', 'public', 'history',
    'heritage', 'civic', 'social', 'population', 'citizen', 'custom', 'generation',
    'monument', 'archaeology'
  ],
  'shopping-money': [
    'shop', 'store', 'price', 'money', 'budget', 'cost', 'retail', 'purchase', 'discount',
    'market', 'sales', 'customer', 'finance', 'commercial', 'currency', 'mall', 'order',
    'consumer', 'product'
  ],
  'nature-animals': [
    'animal', 'nature', 'wildlife', 'species', 'creature', 'dog', 'cat', 'bird', 'marine',
    'ocean', 'sea', 'whale', 'mammal', 'insect', 'habitat', 'fauna', 'flora', 'pet'
  ],
  'science': [
    'science', 'scientific', 'experiment', 'discovery', 'space', 'astronomy', 'planet',
    'physics', 'chemistry', 'biology', 'laboratory', 'researcher', 'hypothesis', 'quantum',
    'nanotechnology', 'molecule'
  ],
  'friendship-feelings': [
    'friend', 'friendship', 'feeling', 'emotion', 'relationship', 'empathy', 'kindness',
    'love', 'connection', 'loneliness', 'happiness', 'bond', 'companion', 'trust'
  ],
};

/**
 * Classifies passage text and title into one of the 15 PACK_THEMES.
 * Returns theme_id (e.g. 'work-career', 'daily-life').
 */
export function classifyReadingTheme(
  title: string,
  content: string,
  hintTopic?: string
): string {
  // If hintTopic matches one of our themes directly
  if (hintTopic && isValidPackThemeId(hintTopic)) {
    return hintTopic;
  }

  // Handle common topic aliases
  if (hintTopic) {
    const lower = hintTopic.toLowerCase();
    if (lower.includes('work') || lower.includes('hr') || lower.includes('office')) return 'work-career';
    if (lower.includes('market') || lower.includes('business') || lower.includes('customer')) return 'shopping-money';
    if (lower.includes('tech')) return 'technology';
    if (lower.includes('health') || lower.includes('medical')) return 'health';
    if (lower.includes('tour') || lower.includes('travel')) return 'travel';
    if (lower.includes('food') || lower.includes('cook')) return 'food';
  }

  const combined = `${title} ${title} ${content.slice(0, 1500)}`.toLowerCase();

  let bestTheme = 'daily-life';
  let bestScore = -1;

  for (const theme of PACK_THEMES) {
    const keywords = THEME_KEYWORDS[theme.id] || [];
    let score = 0;
    for (const kw of keywords) {
      if (title.toLowerCase().includes(kw)) {
        score += 5; // Extra weight for title matches
      }
      if (combined.includes(kw)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme.id;
    }
  }

  return bestTheme;
}
