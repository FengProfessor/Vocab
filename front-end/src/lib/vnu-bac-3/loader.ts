/**
 * Client-side VNU Test Bậc 3 Catalog Loader (API + static catalog fallback, no Node fs).
 */
import type { VnuBac3CatalogItem } from '@/types/vnu-bac-3';
import catalogData from '@/data/vnu-bac-3/vnu-bac-3-catalog.json';

export function getVnuBac3Catalog(): VnuBac3CatalogItem[] {
  return (catalogData as unknown as VnuBac3CatalogItem[]) ?? [];
}
