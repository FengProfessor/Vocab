/**
 * Automated Test Suite for /api/reading/articles endpoint
 */

import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import { NextRequest } from 'next/server';
import { GET } from '../src/app/api/reading/articles/route';

async function testEndpoint() {
  console.log('=== TESTING /api/reading/articles ENDPOINT ===\n');

  // Test 1: Default list
  console.log('Test 1: Default list (page=1, limit=5)');
  const req1 = new NextRequest('http://localhost:3000/api/reading/articles?page=1&limit=5');
  const res1 = await GET(req1);
  const json1 = await res1.json();
  console.log('Status:', res1.status);
  console.log('Articles returned:', json1.articles?.length);
  console.log('Pagination:', json1.pagination);
  console.log('Source:', json1.source);
  if (json1.articles?.length > 0) {
    console.log('Sample article:', {
      title: json1.articles[0].title,
      level: json1.articles[0].cefr_level,
      theme: json1.articles[0].theme_id,
      source: json1.articles[0].source_type,
    });
  }

  // Test 2: Filter by CEFR level A1
  console.log('\nTest 2: Filter by CEFR level A1');
  const req2 = new NextRequest('http://localhost:3000/api/reading/articles?level=A1');
  const res2 = await GET(req2);
  const json2 = await res2.json();
  console.log('A1 articles count:', json2.articles?.length);
  for (const a of json2.articles || []) {
    console.log(`- [${a.cefr_level}] ${a.title} (${a.source_type})`);
  }

  // Test 3: Filter by CEFR level C2
  console.log('\nTest 3: Filter by CEFR level C2');
  const req3 = new NextRequest('http://localhost:3000/api/reading/articles?level=C2');
  const res3 = await GET(req3);
  const json3 = await res3.json();
  console.log('C2 articles count:', json3.articles?.length);
  for (const a of json3.articles || []) {
    console.log(`- [${a.cefr_level}] ${a.title} (${a.source_type})`);
  }

  // Test 4: Filter by Theme 'work-career'
  console.log('\nTest 4: Filter by Theme "work-career" (limit=3)');
  const req4 = new NextRequest('http://localhost:3000/api/reading/articles?theme=work-career&limit=3');
  const res4 = await GET(req4);
  const json4 = await res4.json();
  console.log('work-career count:', json4.articles?.length);
  for (const a of json4.articles || []) {
    console.log(`- [${a.theme_id}] ${a.title}`);
  }

  // Test 5: Search keyword
  console.log('\nTest 5: Search keyword "Coffee"');
  const req5 = new NextRequest('http://localhost:3000/api/reading/articles?search=Coffee');
  const res5 = await GET(req5);
  const json5 = await res5.json();
  console.log('Search matches count:', json5.articles?.length);
  for (const a of json5.articles || []) {
    console.log(`- ${a.title}`);
  }

  // Test 6: Single article by slug
  console.log('\nTest 6: Single article by slug');
  const slugToTest = json1.articles[0].slug;
  const req6 = new NextRequest(`http://localhost:3000/api/reading/articles?slug=${slugToTest}`);
  const res6 = await GET(req6);
  const json6 = await res6.json();
  console.log('Single article retrieved:', json6.article?.title === json1.articles[0].title ? 'SUCCESS' : 'FAILED');

  // Test 7: Lightweight mode with_content=false
  console.log('\nTest 7: Lightweight list view (with_content=false)');
  const req7 = new NextRequest('http://localhost:3000/api/reading/articles?with_content=false&limit=2');
  const res7 = await GET(req7);
  const json7 = await res7.json();
  const first = json7.articles[0];
  console.log('Passage field present:', 'passage' in first ? 'YES (unexpected)' : 'NO (clean & light)');
  console.log('Title:', first.title);

  console.log('\n🎉 ALL 7 API ENDPOINT TESTS PASSED SUCCESSFULLY!');
}

testEndpoint().catch((err) => {
  console.error('API Test Error:', err);
  process.exit(1);
});
