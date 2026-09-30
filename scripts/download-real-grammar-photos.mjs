import fs from 'fs';
import path from 'path';

const targetDir = path.resolve('public/grammar/topics/personal-pronouns');
fs.mkdirSync(targetDir, { recursive: true });

const realPhotos = [
  {
    filename: 'real_01_i.jpg',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
    title: 'Đại từ I (Chủ ngữ ngôi thứ nhất số ít)',
  },
  {
    filename: 'real_02_me.jpg',
    url: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80',
    title: 'Đại từ Me (Tân ngữ ngôi thứ nhất số ít)',
  },
  {
    filename: 'real_03_you.jpg',
    url: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80',
    title: 'Đại từ You (Ngôi thứ hai số ít & số nhiều)',
  },
  {
    filename: 'real_04_he_him.jpg',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    title: 'Đại từ He & Him (Ngôi thứ ba số ít giống đực)',
  },
  {
    filename: 'real_05_she_her.jpg',
    url: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80',
    title: 'Đại từ She & Her (Ngôi thứ ba số ít giống cái)',
  },
  {
    filename: 'real_06_it.jpg',
    url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    title: 'Đại từ It (Ngôi thứ ba số ít chỉ vật & thiết bị)',
  },
  {
    filename: 'real_07_we_us.jpg',
    url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80',
    title: 'Đại từ We & Us (Ngôi thứ nhất số nhiều có người nói)',
  },
  {
    filename: 'real_08_they_them.jpg',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=800&q=80',
    title: 'Đại từ They & Them (Ngôi thứ ba số nhiều)',
  },
];

async function downloadAll() {
  console.log('Downloading real researched photographs for all pronouns...');
  for (const item of realPhotos) {
    const dest = path.join(targetDir, item.filename);
    console.log(`Fetching ${item.title} -> ${item.filename}...`);
    try {
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(dest, buf);
      console.log(`✓ Saved ${item.filename} (${(buf.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`✗ Error downloading ${item.filename}:`, err.message);
    }
  }
  console.log('All real photos downloaded successfully into public/grammar/topics/personal-pronouns/');
}

downloadAll();
