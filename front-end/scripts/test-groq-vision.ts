/**
 * Quick test Groq Vision với 4 ảnh thực
 */
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function main() {
  const { verifyImageMeaningGroq } = await import('../src/lib/groq-vision');

  const tests = [
    {
      url: 'https://www.shutterstock.com/shutterstock/photos/2284126663/display_1500/stock-photo-data-science-and-big-data-technology-scientist-computing-analysing-and-visualizing-complex-data-2284126663.jpg',
      word: 'it',
      def: 'nó (đại từ chỉ vật, sự việc)',
    },
    {
      url: 'https://as2.ftcdn.net/v2/jpg/02/44/30/93/1000_F_244309318_2VSHQJf5G9VgOmq3Gvh6lkSkesMX0sZt.jpg',
      word: 'contention',
      def: 'Heated disagreement or an assertion',
    },
    {
      url: 'https://images.stockcake.com/public/2/c/2/2c2dc3dc-5f2b-496d-8f42-346c040f3e05_large/sunset-city-commute-stockcake.jpg',
      word: 'commute',
      def: 'To travel between home and work',
    },
    {
      url: 'https://images.pexels.com/photos/30354454/pexels-photo-30354454.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      word: 'festival',
      def: 'Lễ hội, ngày hội',
    },
  ];

  for (const t of tests) {
    const t0 = Date.now();
    const r = await verifyImageMeaningGroq(t.url, { word: t.word, definition: t.def });
    console.log(
      t.word.padEnd(15),
      'score=' + String(r.score).padEnd(4),
      '(' + ((Date.now() - t0) / 1000).toFixed(1) + 's)',
      '|',
      r.reason
    );
  }
}

main().catch(console.error);
