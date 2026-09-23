/**
 * LingoPro Speaking Topic Library
 * Category: Social
 * Index file for exporting all social category items
 */

import { MAKING_FRIENDS_ITEMS } from './making-friends';
import { SMALL_TALK_ITEMS } from './small-talk';
import { GIVING_DIRECTIONS_ITEMS } from './giving-directions';
import { GIVING_ADVICE_ITEMS } from './giving-advice';
import { TELLING_STORIES_ITEMS } from './telling-stories';
import { EXPRESSING_OPINIONS_ITEMS } from './expressing-opinions';
import { AGREEING_DISAGREEING_ITEMS } from './agreeing-disagreeing';
import { CONGRATULATING_ITEMS } from './congratulating';
import { APOLOGIZING_ITEMS } from './apologizing';
import { INVITING_DECLINING_ITEMS } from './inviting-declining';
import { GOSSIPING_RUMORS_ITEMS } from './gossiping-rumors';

export const SOCIAL_SUBCATEGORIES = [
  { id: 'making-friends', name: 'Making Friends' },
  { id: 'small-talk', name: 'Small Talk' },
  { id: 'giving-directions', name: 'Giving Directions' },
  { id: 'giving-advice', name: 'Giving Advice' },
  { id: 'telling-stories', name: 'Telling Stories' },
  { id: 'expressing-opinions', name: 'Expressing Opinions' },
  { id: 'agreeing-disagreeing', name: 'Agreeing & Disagreeing' },
  { id: 'congratulating', name: 'Congratulating' },
  { id: 'apologizing', name: 'Apologizing' },
  { id: 'inviting-declining', name: 'Inviting & Declining' },
  { id: 'gossiping-rumors', name: 'Gossiping & Rumors' },
];

export const allSocialTopics = [
  ...MAKING_FRIENDS_ITEMS,
  ...SMALL_TALK_ITEMS,
  ...GIVING_DIRECTIONS_ITEMS,
  ...GIVING_ADVICE_ITEMS,
  ...TELLING_STORIES_ITEMS,
  ...EXPRESSING_OPINIONS_ITEMS,
  ...AGREEING_DISAGREEING_ITEMS,
  ...CONGRATULATING_ITEMS,
  ...APOLOGIZING_ITEMS,
  ...INVITING_DECLINING_ITEMS,
  ...GOSSIPING_RUMORS_ITEMS,
];

export function getSocialBySubcategory(slug: string) {
  return allSocialTopics.filter((item) => item.subcategory === slug);
}
