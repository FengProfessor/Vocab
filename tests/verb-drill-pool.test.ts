import assert from 'node:assert/strict';
import {
  getTeacherPresetIpa,
  optimizeQuizImageUrl,
  resolveBestBareIpa,
  selectReliableQuizImageUrl,
} from '../src/lib/verb-drill-pool';
import type { GlobalDictRowInput } from '../src/lib/vocab-entry-resolver';

// Case 1: Preset IPA heals textbook phrases & words cleanly
{
  assert.equal(getTeacherPresetIpa('Cut down on'), 'ˌkʌt ˈdaʊn ɒn');
  assert.equal(getTeacherPresetIpa('food poisoning'), 'ˈfuːd ˌpɔɪzənɪŋ');
  assert.equal(getTeacherPresetIpa('Antibiotic'), 'ˌæntɪbaɪˈɒtɪk');
}

// Case 2: resolveBestBareIpa heals from row, JSON, presets, and global_dictionary
{
  const gdMap = new Map<string, GlobalDictRowInput>([
    [
      'serendipity',
      {
        word: 'serendipity',
        data: { pronunciations: [{ region: 'US', ipa: '/ˌserənˈdɪpəti/' }] },
      },
    ],
  ]);

  assert.equal(resolveBestBareIpa('/ˈhelθ/', 'health'), 'ˈhelθ');
  assert.equal(resolveBestBareIpa('{"us":"/ˈstæmɪnə/"}', 'stamina'), 'ˈstæmɪnə');
  assert.equal(resolveBestBareIpa('', 'Cut down on'), 'kʌt daʊn ɑn');
  assert.equal(resolveBestBareIpa('', 'Star jump'), 'ˈstɑːr dʒʌmp');
  assert.equal(resolveBestBareIpa('', 'Centenarian'), getTeacherPresetIpa('Centenarian'));
  assert.equal(resolveBestBareIpa(null, 'serendipity', gdMap), 'ˌserənˈdɪpəti');
}

// Case 3: selectReliableQuizImageUrl filters slow, low-confidence, and off-meaning images
{
  // Reject -low suffix from Vision fallback
  assert.equal(
    selectReliableQuizImageUrl({
      word: 'longevity',
      pos: 'n',
      imageUrl: 'https://images.pexels.com/photos/123/pexels-photo-123.jpeg',
      imageSource: 'pexels-low',
      imageConfidence: 42,
    }),
    undefined,
  );

  // Reject confidence < 65 even without -low suffix
  assert.equal(
    selectReliableQuizImageUrl({
      word: 'discipline',
      pos: 'n',
      imageUrl: 'https://images.pexels.com/photos/456/pexels-photo-456.jpeg',
      imageSource: 'pexels',
      imageConfidence: 58,
    }),
    undefined,
  );

  // Reject Pollinations slow/unverified generative images
  assert.equal(
    selectReliableQuizImageUrl({
      word: 'happiness',
      pos: 'n',
      imageUrl: 'https://image.pollinations.ai/prompt/happiness?width=800',
      imageSource: 'pollinations',
      imageConfidence: null,
    }),
    undefined,
  );

  // Reject unverified DuckDuckGo / Openverse scrapes
  assert.equal(
    selectReliableQuizImageUrl({
      word: 'resilience',
      pos: 'n',
      imageUrl: 'https://example.com/thumb.jpg',
      imageSource: 'duckduckgo',
      imageConfidence: null,
    }),
    undefined,
  );

  // Reject function words even with image URL
  assert.equal(
    selectReliableQuizImageUrl({
      word: 'although',
      pos: 'conj',
      imageUrl: 'https://images.pexels.com/photos/789/pexels-photo-789.jpeg',
      imageSource: 'pexels',
      imageConfidence: 90,
    }),
    undefined,
  );

  // Accept Pexels photo and downsize to fast 480px mobile thumbnail
  const pexelsOpt = selectReliableQuizImageUrl({
    word: 'apple',
    pos: 'n',
    imageUrl: 'https://images.pexels.com/photos/102/pexels-photo-102.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    imageSource: 'pexels',
    imageConfidence: 92,
  });
  assert.ok(pexelsOpt);
  assert.ok(pexelsOpt.includes('w=480'));
  assert.ok(!pexelsOpt.includes('w=940'));
  assert.ok(!pexelsOpt.includes('h=650'));

  // Leave signed Pixabay URL untouched
  const pixabayRaw = 'https://pixabay.com/get/g12345_640.jpg?token=abc';
  assert.equal(optimizeQuizImageUrl(pixabayRaw), pixabayRaw);
}

console.log('ALL verb-drill-pool tests PASSED!');
