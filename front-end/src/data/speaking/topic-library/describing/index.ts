/**
 * LingoPro Speaking Topic Library
 * Category: describing
 * File: src/data/speaking/topic-library/describing/index.ts
 *
 * Barrel export for describing topics.
 */

import type { TopicLibraryItem } from '@/types/speaking-topic-library';

import { OBJECTS_AROUND_ME } from './objects-around-me';
import { ROOMS_SPACES } from './rooms-spaces';
import { PEOPLE_APPEARANCE } from './people-appearance';
import { PICTURES_PHOTOS } from './pictures-photos';
import { FOOD_DRINKS } from './food-drinks';
import { WEATHER_NATURE } from './weather-nature';
import { ANIMALS_PETS } from './animals-pets';
import { BUILDINGS_STREETS } from './buildings-streets';
import { CHARTS_GRAPHS } from './charts-graphs';

export const DESCRIBING_SUBCATEGORIES = [
  { id: 'objects-around-me', nameEn: 'Objects Around Me', nameVi: 'Đồ vật quanh tôi' },
  { id: 'rooms-spaces', nameEn: 'Rooms & Spaces', nameVi: 'Phòng & Không gian' },
  { id: 'people-appearance', nameEn: 'People & Appearance', nameVi: 'Con người & Ngoại hình' },
  { id: 'pictures-photos', nameEn: 'Pictures & Photos', nameVi: 'Tranh & Ảnh' },
  { id: 'food-drinks', nameEn: 'Food & Drinks', nameVi: 'Đồ ăn & Thức uống' },
  { id: 'weather-nature', nameEn: 'Weather & Nature', nameVi: 'Thời tiết & Thiên nhiên' },
  { id: 'animals-pets', nameEn: 'Animals & Pets', nameVi: 'Động vật & Thú cưng' },
  { id: 'buildings-streets', nameEn: 'Buildings & Streets', nameVi: 'Tòa nhà & Đường phố' },
  { id: 'charts-graphs', nameEn: 'Charts & Graphs', nameVi: 'Biểu đồ & Đồ thị' }
];

export const allDescribingTopics: TopicLibraryItem[] = [
  ...OBJECTS_AROUND_ME,
  ...ROOMS_SPACES,
  ...PEOPLE_APPEARANCE,
  ...PICTURES_PHOTOS,
  ...FOOD_DRINKS,
  ...WEATHER_NATURE,
  ...ANIMALS_PETS,
  ...BUILDINGS_STREETS,
  ...CHARTS_GRAPHS
];

export function getDescribingBySubcategory(slug: string): TopicLibraryItem[] {
  return allDescribingTopics.filter(topic => topic.id.startsWith(`desc-${slug.substring(0,3)}`));
}
