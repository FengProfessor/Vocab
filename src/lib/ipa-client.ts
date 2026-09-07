'use client';

import ipaDataJson from '@/data/pronunciation/ipa-chart-v1.json';
import type { IpaChartData, IpaPhoneme, UserPhonemeProgress } from '@/types/ipa';
import { playWordAudio } from '@/lib/audio';

export const IPA_DATA: IpaChartData = ipaDataJson as unknown as IpaChartData;

const STORAGE_KEY = 'lingopro_ipa_progress_v1';

export function getPhonemeById(id: string): IpaPhoneme | undefined {
  return IPA_DATA.phonemes.find((p) => p.id === id);
}

export function getAllPhonemes(): IpaPhoneme[] {
  return IPA_DATA.phonemes;
}

export function getStoredIpaProgress(): Record<string, UserPhonemeProgress> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, UserPhonemeProgress>;
  } catch {
    return {};
  }
}

export function savePhonemeProgress(
  phonemeId: string,
  updates: Partial<UserPhonemeProgress>,
): UserPhonemeProgress {
  const current = getStoredIpaProgress();
  const existing = current[phonemeId] || {
    phonemeId,
    masteryPercent: 0,
    stagesCompleted: 0,
    stars: 0,
  };

  const next: UserPhonemeProgress = {
    ...existing,
    ...updates,
    lastPracticed: new Date().toISOString(),
  };

  current[phonemeId] = next;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // ignore
    }
  }

  return next;
}

export interface IpaPair {
  title: string;
  mouthPosition: string;
  phoneme1Id: string;
  phoneme2Id: string;
  tip?: string;
}

export interface IpaStage {
  id: string;
  stageNumber: number;
  title: string;
  shortTitle: string;
  badge: string;
  coachNote: string;
  pedagogicalTip: string;
  phonemeIds: string[];
  pairs?: IpaPair[];
}

export const IPA_STAGES: IpaStage[] = [
  {
    id: 'stage-must-fix',
    stageNumber: 1,
    title: 'Chặng 1: 14 Âm "Tử Huyệt" Người Việt Dễ Sai',
    shortTitle: '1. Âm Cấp Bách (14)',
    badge: 'Ưu tiên số 1',
    coachNote:
      'Đừng vội học cả 44 âm. Hãy làm chủ 14 âm này trước vì tiếng Việt không có hoặc phát âm rất khác. Sửa xong 14 âm này là phát âm của bạn đã lột xác 80%!',
    pedagogicalTip:
      'Tập trung sửa các lỗi sai nghiêm trọng nhất: ngọng "th" (/θ/, /ð/), nuốt âm đuôi /s/, /z/, và nhầm lẫn cặp /iː/ - /ɪ/.',
    phonemeIds: [
      'th-voiced',
      'th-voiceless',
      's-sound',
      'z-sound',
      'sh-sound',
      'zh-sound',
      'ch-sound',
      'j-consonant',
      'p-sound',
      't-sound',
      'k-sound',
      'v-sound',
      'i-long',
      'i-short',
    ],
  },
  {
    id: 'stage-vowel-pairs',
    stageNumber: 2,
    title: 'Chặng 2: Cặp Nguyên Âm Đối Lập (Dài ↔ Ngắn)',
    shortTitle: '2. Cặp Nguyên Âm (12)',
    badge: 'Căng ↔ Thả lỏng',
    coachNote:
      'Luôn học nguyên âm theo từng cặp đối lập. Chú ý cảm nhận cơ miệng: âm dài cơ miệng phải CĂNG, còn âm ngắn cơ miệng hoàn toàn THẢ LỎNG.',
    pedagogicalTip:
      'Tránh thói quen đọc âm tiếng Anh thành "i, u, o" tiếng Việt. Hãy quan sát độ mở hàm của giáo viên.',
    phonemeIds: [
      'i-long',
      'i-short',
      'u-long',
      'u-short',
      'aw-sound',
      'o-short',
      'er-sound',
      'schwa',
      'e-sound',
      'ae-sound',
      'ah-sound',
      'uh-sound',
    ],
    pairs: [
      {
        title: 'Cặp /iː/ - /ɪ/',
        mouthPosition: 'Căng môi mỉm cười ↔ Thả lỏng hạ hàm',
        phoneme1Id: 'i-long',
        phoneme2Id: 'i-short',
        tip: 'sheep (/ʃiːp/) vs ship (/ʃɪp/) - Nhầm lẫn tai hại nhất',
      },
      {
        title: 'Cặp /uː/ - /ʊ/',
        mouthPosition: 'Chu môi tròn căng ↔ Thả lỏng môi mở',
        phoneme1Id: 'u-long',
        phoneme2Id: 'u-short',
        tip: 'shoot (/ʃuːt/) vs book (/bʊk/)',
      },
      {
        title: 'Cặp /ɔː/ - /ɒ/',
        mouthPosition: 'Tròn môi sâu đáy họng ↔ Mở to tròn tự nhiên',
        phoneme1Id: 'aw-sound',
        phoneme2Id: 'o-short',
        tip: 'door (/dɔːr/) vs on (/ɒn/)',
      },
      {
        title: 'Cặp /ɜː/ - /ə/',
        mouthPosition: 'Uốn lưỡi giữa họng ↔ Âm lướt ngắn thả lỏng',
        phoneme1Id: 'er-sound',
        phoneme2Id: 'schwa',
        tip: 'bird (/bɜːd/) vs teacher (/ˈtiːtʃər/)',
      },
      {
        title: 'Cặp /e/ - /æ/',
        mouthPosition: 'Miệng mở vừa ↔ Hạ quai hàm tối đa (âm bướm)',
        phoneme1Id: 'e-sound',
        phoneme2Id: 'ae-sound',
        tip: 'bed (/bed/) vs cat (/kæt/)',
      },
      {
        title: 'Cặp /ɑː/ - /ʌ/',
        mouthPosition: 'Mở rộng sâu cuống họng ↔ Bật nhanh dứt khoát',
        phoneme1Id: 'ah-sound',
        phoneme2Id: 'uh-sound',
        tip: 'car (/kɑːr/) vs cup (/kʌp/)',
      },
    ],
  },
  {
    id: 'stage-consonant-pairs',
    stageNumber: 3,
    title: 'Chặng 3: 8 Cặp Phụ Âm Đối Xứng (Cùng Khẩu Hình)',
    shortTitle: '3. Cặp Phụ Âm (16)',
    badge: 'Vô thanh ↔ Hữu thanh',
    coachNote:
      'Bí quyết học nhanh gấp đôi: Hai âm trong cùng 1 cặp có khẩu hình môi - răng - lưỡi GIỐNG HỆT NHAU, chỉ khác: 1 âm chỉ thổi hơi ra (vô thanh), âm kia rung cổ họng (hữu thanh).',
    pedagogicalTip:
      'Đặt ngón tay lên cổ họng: khi đọc /b/, /d/, /g/, /v/, /ð/, /z/, /ʒ/, /dʒ/ cổ họng phải rung rõ rệt.',
    phonemeIds: [
      'p-sound',
      'b-sound',
      't-sound',
      'd-sound',
      'k-sound',
      'g-sound',
      'f-sound',
      'v-sound',
      'th-voiceless',
      'th-voiced',
      's-sound',
      'z-sound',
      'sh-sound',
      'zh-sound',
      'ch-sound',
      'j-consonant',
    ],
    pairs: [
      {
        title: 'Cặp /p/ - /b/',
        mouthPosition: 'Hai môi mím chặt rồi bật hơi',
        phoneme1Id: 'p-sound',
        phoneme2Id: 'b-sound',
        tip: '/p/ chỉ thổi gió, /b/ rung thanh quản (pen vs ball)',
      },
      {
        title: 'Cặp /t/ - /d/',
        mouthPosition: 'Đầu lưỡi chạm chân răng hàm trên',
        phoneme1Id: 't-sound',
        phoneme2Id: 'd-sound',
        tip: '/t/ bật hơi dứt khoát, /d/ rung thanh quản (tea vs dog)',
      },
      {
        title: 'Cặp /k/ - /g/',
        mouthPosition: 'Cuống lưỡi nâng chạm vòm họng mềm',
        phoneme1Id: 'k-sound',
        phoneme2Id: 'g-sound',
        tip: '/k/ bật hơi cuống họng, /g/ rung cổ họng (cat vs go)',
      },
      {
        title: 'Cặp /f/ - /v/',
        mouthPosition: 'Răng cửa trên cắn nhẹ môi dưới',
        phoneme1Id: 'f-sound',
        phoneme2Id: 'v-sound',
        tip: '/f/ thổi gió nhẹ, /v/ rung môi mạnh (fish vs voice)',
      },
      {
        title: 'Cặp /θ/ - /ð/ (Th)',
        mouthPosition: 'Đặt đầu lưỡi kẹp giữa hai hàm răng',
        phoneme1Id: 'th-voiceless',
        phoneme2Id: 'th-voiced',
        tip: '/θ/ thổi gió mát, /ð/ rung tê đầu lưỡi (think vs this)',
      },
      {
        title: 'Cặp /s/ - /z/',
        mouthPosition: 'Hai hàm răng khép nhẹ, đẩy luồng hơi',
        phoneme1Id: 's-sound',
        phoneme2Id: 'z-sound',
        tip: '/s/ xì hơi như rắn, /z/ rung như ong kêu (see vs zoo)',
      },
      {
        title: 'Cặp /ʃ/ - /ʒ/',
        mouthPosition: 'Chu môi tròn về phía trước, thân lưỡi nâng',
        phoneme1Id: 'sh-sound',
        phoneme2Id: 'zh-sound',
        tip: '/ʃ/ suỵt im lặng, /ʒ/ rung dây thanh quản (she vs vision)',
      },
      {
        title: 'Cặp /tʃ/ - /dʒ/',
        mouthPosition: 'Chặn hơi đầu lưỡi rồi bật chu môi dứt khoát',
        phoneme1Id: 'ch-sound',
        phoneme2Id: 'j-consonant',
        tip: '/tʃ/ bật gió dứt khoát, /dʒ/ rung thanh âm (chin vs jam)',
      },
    ],
  },
  {
    id: 'stage-diphthongs-sonorants',
    stageNumber: 4,
    title: 'Chặng 4: Nguyên Âm Đôi & Phụ Âm Mũi / Lướt',
    shortTitle: '4. Âm Đôi & Âm Lướt (16)',
    badge: 'Nối âm & Ngữ lưu',
    coachNote:
      'Chặng hoàn thiện phát âm tự nhiên. Nguyên âm đôi cần lướt mượt từ âm 1 sang âm 2. Các âm mũi và âm lướt giúp câu nói nghe có nhịp điệu và trôi chảy.',
    pedagogicalTip:
      'Đặc biệt lưu ý âm /l/ (Dark L) và âm /r/ khi đứng ở vị trí cuối từ.',
    phonemeIds: [
      'ei-sound',
      'ai-sound',
      'oi-sound',
      'ou-sound',
      'au-sound',
      'ia-sound',
      'ea-sound',
      'ua-sound',
      'm-sound',
      'n-sound',
      'ng-sound',
      'h-sound',
      'l-sound',
      'r-sound',
      'w-sound',
      'j-sound',
    ],
  },
];

export function getPhonemesForStage(stageId: string): IpaPhoneme[] {
  const stage = IPA_STAGES.find((s) => s.id === stageId);
  if (!stage) return [];
  return stage.phonemeIds
    .map((id) => getPhonemeById(id))
    .filter((p): p is IpaPhoneme => Boolean(p));
}

export function getNextRecommendedPhoneme(
  userProgress: Record<string, UserPhonemeProgress>,
): IpaPhoneme | null {
  // Tìm âm đầu tiên chưa đạt 80% độ thành thạo, ưu tiên theo thứ tự Chặng 1 -> 2 -> 3 -> 4
  for (const stage of IPA_STAGES) {
    for (const pid of stage.phonemeIds) {
      const progress = userProgress[pid];
      if (!progress || progress.masteryPercent < 80) {
        const found = getPhonemeById(pid);
        if (found) return found;
      }
    }
  }
  // Nếu đã học hết hoặc chưa tìm thấy, trả về âm đầu tiên
  return getPhonemeById('th-voiced') || IPA_DATA.phonemes[0] || null;
}

export function playPhonemeAudio(phoneme: IpaPhoneme): void {
  // Phát âm từ mẫu anchorWord bằng audio giọng thật
  void playWordAudio(phoneme.anchorWord);
}
