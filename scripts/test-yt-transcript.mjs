async function test() {
  const res = await fetch('https://www.youtube.com/watch?v=dJ4kPGdUShQ', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
  });
  const html = await res.text();
  const match = html.match(/"captionTracks":(\[.*?\])/);
  if (match) {
    const tracks = JSON.parse(match[1]);
    console.log('Tracks count:', tracks.length);
    const enTrack = tracks.find(t => t.languageCode === 'en' || t.vssId?.includes('en'));
    if (enTrack) {
      console.log('enTrack baseUrl:', enTrack.baseUrl);
      const capRes = await fetch(enTrack.baseUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
      });
      console.log('Status:', capRes.status);
      const xml = await capRes.text();
      console.log('XML length:', xml.length);
      console.log('XML snippet:', xml.slice(0, 500));
    } else {
      console.log('No enTrack found');
    }
  }
}
test();
