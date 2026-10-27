import { beforeEach, describe, expect, it } from 'vitest';
import {
  BrowserStorage,
  STORAGE_KEYS,
  clearUserAccountStorage,
  getLastUserId,
  userStorage,
} from '@/shared/lib/storage';

describe('User-scoped storage & clearUserAccountStorage', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it('reads and writes JSON objects safely and updates LAST_USER_ID', () => {
    const store = userStorage('user-101');
    store.set(STORAGE_KEYS.PROFILE, {
      id: 'user-101',
      full_name: 'Nguyen Van A',
      plan: 'pro',
    });

    const cached = store.get<{ id: string; full_name: string; plan: string }>(
      STORAGE_KEYS.PROFILE,
    );
    expect(cached).toEqual({
      id: 'user-101',
      full_name: 'Nguyen Van A',
      plan: 'pro',
    });
    expect(getLastUserId()).toBe('user-101');

    store.remove(STORAGE_KEYS.PROFILE);
    expect(store.get(STORAGE_KEYS.PROFILE)).toBeNull();
  });

  it('strictly isolates cached records between two different userIds', () => {
    const userA = userStorage('user-alpha');
    const userB = userStorage('user-beta');

    userA.set(STORAGE_KEYS.WORD_SUMMARY, { total: 42, newCount: 10, reviewDueCount: 5 });
    userB.set(STORAGE_KEYS.WORD_SUMMARY, { total: 180, newCount: 0, reviewDueCount: 25 });

    expect(
      userA.get<{ total: number; newCount: number; reviewDueCount: number }>(
        STORAGE_KEYS.WORD_SUMMARY,
      ),
    ).toEqual({ total: 42, newCount: 10, reviewDueCount: 5 });

    expect(
      userB.get<{ total: number; newCount: number; reviewDueCount: number }>(
        STORAGE_KEYS.WORD_SUMMARY,
      ),
    ).toEqual({ total: 180, newCount: 0, reviewDueCount: 25 });

    // Clearing userA only removes userA's cache, leaving userB intact
    clearUserAccountStorage('user-alpha');
    expect(userA.get(STORAGE_KEYS.WORD_SUMMARY)).toBeNull();
    expect(
      userB.get<{ total: number; newCount: number; reviewDueCount: number }>(
        STORAGE_KEYS.WORD_SUMMARY,
      ),
    ).toEqual({ total: 180, newCount: 0, reviewDueCount: 25 });
  });

  it('clears all account-scoped caches on sign-out without deleting offline or theme keys', () => {
    const userA = userStorage('user-alpha');
    const userB = userStorage('user-beta');

    userA.set(STORAGE_KEYS.PROFILE, { id: 'user-alpha', email: 'a@example.com' });
    userA.set(STORAGE_KEYS.GAMIFICATION, { total_xp: 500, current_streak: 4 });
    userB.set(STORAGE_KEYS.DASHBOARD_WORDS, [{ id: 'w1', word: 'resilient' }]);

    // Non-account keys: theme preferences and offline study data
    BrowserStorage.setLocal('theme', 'dark');
    BrowserStorage.setLocal('vite-ui-theme', 'system');
    BrowserStorage.setLocal('lp:offline:study_deck_v1', { cards: 120 });
    BrowserStorage.setLocal(STORAGE_KEYS.LIBRARY_CATALOG, { routes: ['a1'] });
    BrowserStorage.setLocal(STORAGE_KEYS.READING_LIBRARY_BOOKMARKS, ['art-1', 'art-2']);

    clearUserAccountStorage();

    // Account caches must be gone
    expect(userA.get(STORAGE_KEYS.PROFILE)).toBeNull();
    expect(userA.get(STORAGE_KEYS.GAMIFICATION)).toBeNull();
    expect(userB.get(STORAGE_KEYS.DASHBOARD_WORDS)).toBeNull();
    expect(getLastUserId()).toBeNull();

    // Offline and theme preferences must remain intact
    expect(BrowserStorage.getLocal('theme', '')).toBe('dark');
    expect(BrowserStorage.getLocal('vite-ui-theme', '')).toBe('system');
    expect(BrowserStorage.getLocal('lp:offline:study_deck_v1', null)).toEqual({ cards: 120 });
    expect(BrowserStorage.getLocal(STORAGE_KEYS.LIBRARY_CATALOG, null)).toEqual({
      routes: ['a1'],
    });
    expect(BrowserStorage.getLocal(STORAGE_KEYS.READING_LIBRARY_BOOKMARKS, [])).toEqual([
      'art-1',
      'art-2',
    ]);
  });
});
