export interface StoredSRS {
  stability: number;
  difficulty: number;
  interval_days: number;
  review_count: number;
  state: number;
  lapses: number;
  next_review_date: string;
  last_reviewed_at: string;
}

export interface OfflineStudyWord {
  id: string;
  userId: string;
  classroom_id?: string;
  word: string;
  translation: string;
  ipa: string;
  pos: string;
  example: string;
  example_vi: string | null;
  synonyms: string[];
  antonyms: string[];
  image_url: string | null;
  srs: StoredSRS | null;
  reviewCount: number;
  srsLevel: number;
  isDue: boolean;
  queueType: 'review' | 'new';
  cachedAt: number;
  audioCached: boolean;
}

export interface OfflineReviewEvent {
  reviewId: string;
  userId: string;
  wordId: string;
  quality: 0 | 3 | 4 | 5;
  createdAt: string;
  clientTimestamp: number;
  sequence?: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  lastError?: string;
}

export interface OfflineAudioRecord {
  key: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

export interface OfflineSyncMetadata {
  key: string;
  userId: string;
  lastPrefetchAt: number;
  lastSyncAt: number;
}

export type SyncMetadata = OfflineSyncMetadata;
