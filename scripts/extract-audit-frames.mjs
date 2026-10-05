import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

mkdirSync('out/audit_frames', { recursive: true });

const extractTargets = [
  { file: 'out/tiktok-toeic-part3-100/P3/001,p3.mp4', time: '00:00:25', out: 'out/audit_frames/p3_audio_answering.png' },
  { file: 'out/tiktok-toeic-part3-100/P3/001,p3.mp4', time: '00:01:14', out: 'out/audit_frames/p3_audio_transcript.png' },
  { file: 'out/tiktok-toeic-part3-100/P3/009,p3.mp4', time: '00:00:25', out: 'out/audit_frames/p3_graphic_answering.png' },
  { file: 'out/tiktok-toeic-part3-100/P3/009,p3.mp4', time: '00:01:05', out: 'out/audit_frames/p3_graphic_transcript.png' },
  { file: 'out/tiktok-toeic-part4-100/P4/001,p4.mp4', time: '00:00:25', out: 'out/audit_frames/p4_audio_answering.png' },
  { file: 'out/tiktok-toeic-part4-100/P4/001,p4.mp4', time: '00:01:08', out: 'out/audit_frames/p4_audio_transcript.png' },
  { file: 'out/tiktok-toeic-part4-100/P4/005,p4.mp4', time: '00:00:25', out: 'out/audit_frames/p4_graphic_answering.png' },
  { file: 'out/tiktok-toeic-part4-100/P4/005,p4.mp4', time: '00:01:06', out: 'out/audit_frames/p4_graphic_transcript.png' },
];

for (const t of extractTargets) {
  try {
    execSync(`ffmpeg -y -ss ${t.time} -i "${t.file}" -frames:v 1 "${t.out}"`, { stdio: 'ignore' });
    console.log(`Extracted: ${t.out}`);
  } catch (e) {
    console.error(`Failed on ${t.out}:`, e.message);
  }
}
