/**
 * Pure native Promise-based IndexedDB wrapper for LingoPro Study Engine.
 * Database: lingopro_study_engine (Version 1)
 *
 * Stores:
 * - study_words (key: id)
 * - offline_review_queue (key: reviewId)
 * - audio_cache (key: key)
 * - sync_metadata (key: key)
 */

import type {
  OfflineStudyWord,
  OfflineReviewEvent,
  OfflineAudioRecord,
  SyncMetadata,
} from './types';

export const DB_NAME = 'lingopro_study_engine';
export const DB_VERSION = 1;

export const STORES = {
  STUDY_WORDS: 'study_words',
  OFFLINE_REVIEW_QUEUE: 'offline_review_queue',
  AUDIO_CACHE: 'audio_cache',
  SYNC_METADATA: 'sync_metadata',
} as const;

let dbPromise: Promise<IDBDatabase | null> | null = null;

export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

export function openStudyDatabase(): Promise<IDBDatabase | null> {
  if (!isIndexedDBAvailable()) {
    return Promise.resolve(null);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase | null>((resolve, reject) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. study_words store
        if (!db.objectStoreNames.contains(STORES.STUDY_WORDS)) {
          const store = db.createObjectStore(STORES.STUDY_WORDS, { keyPath: 'id' });
          store.createIndex('by_user', 'userId', { unique: false });
          store.createIndex('by_queue', ['userId', 'queueType'], { unique: false });
        }

        // 2. offline_review_queue store (Write-Ahead Log)
        if (!db.objectStoreNames.contains(STORES.OFFLINE_REVIEW_QUEUE)) {
          const store = db.createObjectStore(STORES.OFFLINE_REVIEW_QUEUE, { keyPath: 'reviewId' });
          store.createIndex('by_user', 'userId', { unique: false });
          store.createIndex('by_status', 'status', { unique: false });
          store.createIndex('by_created', 'createdAt', { unique: false });
        }

        // 3. audio_cache store
        if (!db.objectStoreNames.contains(STORES.AUDIO_CACHE)) {
          const store = db.createObjectStore(STORES.AUDIO_CACHE, { keyPath: 'key' });
          store.createIndex('by_created', 'createdAt', { unique: false });
        }

        // 4. sync_metadata store
        if (!db.objectStoreNames.contains(STORES.SYNC_METADATA)) {
          db.createObjectStore(STORES.SYNC_METADATA, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onclose = () => {
          dbPromise = null;
        };
        db.onversionchange = () => {
          try {
            db.close();
          } catch {
            // ignore
          }
          dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        console.warn('[IndexedDB] Failed to open database:', request.error);
        dbPromise = null;
        resolve(null);
      };

      request.onblocked = () => {
        console.warn('[IndexedDB] Database open blocked by another connection');
        dbPromise = null;
      };
    } catch (err) {
      console.warn('[IndexedDB] Exception opening database:', err);
      dbPromise = null;
      resolve(null);
    }
  });

  return dbPromise;
}

// ── study_words Operations ──────────────────────────────────────────

export async function putStudyWord(word: OfflineStudyWord): Promise<void> {
  const db = await openStudyDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.STUDY_WORDS, 'readwrite');
      const store = tx.objectStore(STORES.STUDY_WORDS);
      store.put(word);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function putStudyWords(words: OfflineStudyWord[]): Promise<void> {
  if (words.length === 0) return;
  const db = await openStudyDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.STUDY_WORDS, 'readwrite');
      const store = tx.objectStore(STORES.STUDY_WORDS);
      for (const word of words) {
        store.put(word);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function getStudyWord(id: string): Promise<OfflineStudyWord | null> {
  const db = await openStudyDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.STUDY_WORDS, 'readonly');
      const store = tx.objectStore(STORES.STUDY_WORDS);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function getStudyWordsByUser(
  userId: string,
  queueType?: 'review' | 'new',
): Promise<OfflineStudyWord[]> {
  const db = await openStudyDatabase();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.STUDY_WORDS, 'readonly');
      const store = tx.objectStore(STORES.STUDY_WORDS);

      if (queueType) {
        const index = store.index('by_queue');
        const req = index.getAll(IDBKeyRange.only([userId, queueType]));
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      } else {
        const index = store.index('by_user');
        const req = index.getAll(IDBKeyRange.only(userId));
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      }
    } catch (err) {
      reject(err);
    }
  });
}

export async function deleteStudyWord(id: string): Promise<void> {
  const db = await openStudyDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.STUDY_WORDS, 'readwrite');
      const store = tx.objectStore(STORES.STUDY_WORDS);
      store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function clearStudyWords(userId?: string): Promise<void> {
  const db = await openStudyDatabase();
  if (!db) return;

  if (!userId) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORES.STUDY_WORDS, 'readwrite');
        tx.objectStore(STORES.STUDY_WORDS).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Delete words belonging to a specific user
  const userWords = await getStudyWordsByUser(userId);
  if (userWords.length === 0) return;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.STUDY_WORDS, 'readwrite');
      const store = tx.objectStore(STORES.STUDY_WORDS);
      for (const word of userWords) {
        store.delete(word.id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// ── offline_review_queue Operations (WAL) ───────────────────────────

export async function appendReviewEvent(event: OfflineReviewEvent): Promise<void> {
  const db = await openStudyDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.OFFLINE_REVIEW_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.OFFLINE_REVIEW_QUEUE);
      store.put(event);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function getPendingReviews(userId: string): Promise<OfflineReviewEvent[]> {
  const db = await openStudyDatabase();
  if (!db) return [];

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.OFFLINE_REVIEW_QUEUE, 'readonly');
      const store = tx.objectStore(STORES.OFFLINE_REVIEW_QUEUE);
      const index = store.index('by_user');
      const req = index.getAll(IDBKeyRange.only(userId));

      req.onsuccess = () => {
        const all = (req.result || []) as OfflineReviewEvent[];
        const pending = all
          .filter(
            (ev) =>
              ev.status === 'pending' ||
              ev.status === 'syncing' ||
              (ev.status === 'failed' && (ev.retryCount || 0) < 10),
          )
          .sort((a, b) => {
            if (a.clientTimestamp !== b.clientTimestamp) {
              return a.clientTimestamp - b.clientTimestamp;
            }
            return (a.sequence ?? 0) - (b.sequence ?? 0);
          });
        resolve(pending);
      };
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function updateReviewEvent(event: OfflineReviewEvent): Promise<void> {
  const db = await openStudyDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.OFFLINE_REVIEW_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.OFFLINE_REVIEW_QUEUE);
      store.put(event);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function deleteReviewEvent(reviewId: string): Promise<void> {
  const db = await openStudyDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.OFFLINE_REVIEW_QUEUE, 'readwrite');
      const store = tx.objectStore(STORES.OFFLINE_REVIEW_QUEUE);
      store.delete(reviewId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// ── audio_cache Operations ──────────────────────────────────────────

export async function putAudio(key: string, blob: Blob, mimeType = 'audio/mp3'): Promise<void> {
  const db = await openStudyDatabase();
  if (!db) return;

  const normalizedKey = key.trim().toLowerCase();
  const record: OfflineAudioRecord = {
    key: normalizedKey,
    blob,
    mimeType,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.AUDIO_CACHE, 'readwrite');
      const store = tx.objectStore(STORES.AUDIO_CACHE);
      store.put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function getAudio(key: string): Promise<Blob | null> {
  const db = await openStudyDatabase();
  if (!db) return null;

  const normalizedKey = key.trim().toLowerCase();

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.AUDIO_CACHE, 'readonly');
      const store = tx.objectStore(STORES.AUDIO_CACHE);
      const req = store.get(normalizedKey);
      req.onsuccess = () => {
        const record = req.result as OfflineAudioRecord | undefined;
        resolve(record ? record.blob : null);
      };
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function deleteAudio(key: string): Promise<void> {
  const db = await openStudyDatabase();
  if (!db) return;

  const normalizedKey = key.trim().toLowerCase();

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.AUDIO_CACHE, 'readwrite');
      const store = tx.objectStore(STORES.AUDIO_CACHE);
      store.delete(normalizedKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

// ── sync_metadata Operations ────────────────────────────────────────

export async function setSyncMetadata(meta: SyncMetadata): Promise<void> {
  const db = await openStudyDatabase();
  if (!db) return;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.SYNC_METADATA, 'readwrite');
      const store = tx.objectStore(STORES.SYNC_METADATA);
      store.put(meta);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function getSyncMetadata(key: string): Promise<SyncMetadata | null> {
  const db = await openStudyDatabase();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(STORES.SYNC_METADATA, 'readonly');
      const store = tx.objectStore(STORES.SYNC_METADATA);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}
