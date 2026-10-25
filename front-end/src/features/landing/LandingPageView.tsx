import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useDictionaryLookup } from '@/hooks/dictionary/useDictionaryLookup';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/useAuthStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import '@/features/landing/LandingPage.css';

interface SeoLandingStatsDto {
  totalWords?: number;
  totalPacks?: number;
  totalRoutes?: number;
}

interface DemoDictEntry {
  word: string;
  ipa: string;
  pos: string;
  meaningVi: string;
  exampleEn: string;
  exampleVi: string;
  synonyms: string[];
}

const FALLBACK_DEMO_ENTRIES: Record<string, DemoDictEntry> = {
  resilient: {
    word: 'resilient',
    ipa: '/rɪˈzɪl.i.ənt/',
    pos: 'adjective · B2-C1',
    meaningVi: 'Kiên cường, có khả năng phục hồi nhanh sau khó khăn hoặc biến cố',
    exampleEn: 'She is a resilient learner who never gives up on difficult vocabulary.',
    exampleVi: 'Cô ấy là một người học kiên cường không bao giờ bỏ cuộc trước từ vựng khó.',
    synonyms: ['tough', 'adaptable', 'strong'],
  },
  mitigate: {
    word: 'mitigate',
    ipa: '/ˈmɪt.ɪ.ɡeɪt/',
    pos: 'verb · C1',
    meaningVi: 'Giảm nhẹ, làm dịu bớt mức độ nghiêm trọng của rủi ro hoặc thiệt hại',
    exampleEn: 'Spaced repetition helps mitigate the forgetting curve effectively.',
    exampleVi: 'Lặp lại ngắt quãng giúp giảm nhẹ đường cong quên lãng một cách hiệu quả.',
    synonyms: ['alleviate', 'reduce', 'ease'],
  },
  sustainable: {
    word: 'sustainable',
    ipa: '/səˈsteɪ.nə.bəl/',
    pos: 'adjective · B2',
    meaningVi: 'Bền vững, có thể duy trì lâu dài mà không gây kiệt sức',
    exampleEn: 'Five minutes a day is a sustainable habit for busy professionals.',
    exampleVi: 'Năm phút mỗi ngày là một thói quen bền vững cho người đi làm bận rộn.',
    synonyms: ['viable', 'long-lasting', 'feasible'],
  },
  proficient: {
    word: 'proficient',
    ipa: '/prəˈfɪʃ.ənt/',
    pos: 'adjective · C1',
    meaningVi: 'Thành thạo, giỏi giang trong một kỹ năng hoặc ngôn ngữ',
    exampleEn: 'He became proficient in business English after three months on LingoPro.',
    exampleVi: 'Anh ấy trở nên thành thạo tiếng Anh thương mại sau ba tháng dùng LingoPro.',
    synonyms: ['skilled', 'competent', 'adept'],
  },
  pragmatic: {
    word: 'pragmatic',
    ipa: '/præɡˈmæt.ɪk/',
    pos: 'adjective · C1',
    meaningVi: 'Thực tế, thực dụng, ưu tiên giải quyết vấn đề hiệu quả hơn lý thuyết suông',
    exampleEn: 'We take a pragmatic approach to TOEIC and IELTS vocabulary.',
    exampleVi: 'Chúng tôi áp dụng cách tiếp cận thực tế với từ vựng TOEIC và IELTS.',
    synonyms: ['practical', 'realistic', 'sensible'],
  },
};

const STEPS = [
  {
    n: '01',
    icon: '🔍',
    title: 'Tra từ',
    text: '1 chạm trên web hoặc trong app — có nghĩa Việt, IPA, ví dụ.',
  },
  {
    n: '02',
    icon: '📥',
    title: 'Lưu kho',
    text: '1 bấm vào kho từ riêng; hoặc chọn bộ từ IELTS, TOEIC, THPT có sẵn.',
  },
  {
    n: '03',
    icon: '🧠',
    title: 'Ôn FSRS',
    text: '5–8 phút/ngày; thuật toán FSRS nhắc đúng lúc sắp quên.',
  },
];

const WHY = [
  {
    icon: '🧠',
    title: 'Ôn đúng lúc sắp quên',
    text: 'FSRS tính lịch riêng cho từng từ theo lịch sử nhớ — quên của chính bạn.',
  },
  {
    icon: '🌐',
    title: 'Từ lấy từ chỗ bạn đọc',
    text: 'Tra trên báo, tài liệu, phụ đề rồi lưu thẳng vào kho — nhớ kèm ngữ cảnh.',
  },
  {
    icon: '🎯',
    title: 'Lộ trình dựng sẵn',
    text: 'IELTS, TOEIC, THPT, Giao tiếp chia thành chặng ngắn 5–8 phút, mở là học.',
  },
];

const COMPARE_ROWS = [
  {
    label: 'Bắt đầu học',
    lingo: 'Chọn lộ trình hoặc tra từ là học ngay',
    anki: 'Tải bộ thẻ, chỉnh mẫu thẻ, tự cấu hình',
  },
  {
    label: 'Thêm từ mới',
    lingo: '1 chạm từ trang web hoặc từ điển tích hợp',
    anki: 'Tự gõ hoặc import file CSV thủ công',
  },
  {
    label: 'Thuật toán ôn',
    lingo: 'FSRS bật sẵn — tự khớp nhịp nhớ của bạn',
    anki: 'SM-2 mặc định; FSRS phải tự bật và tinh chỉnh',
  },
  {
    label: 'Kiểu luyện',
    lingo: 'Flashcard + quiz + điền từ + ngữ cảnh + AI',
    anki: 'Chủ yếu lật thẻ tự chấm',
  },
];

const TESTIMONIALS = [
  {
    name: 'Minh Anh',
    role: 'IELTS 6.5 · ĐH Ngoại thương',
    initials: 'MA',
    text: 'Đọc báo gặp từ mới là bấm lưu. Tối mở app đã có sẵn chặng ôn 6 phút.',
  },
  {
    name: 'Hoàng Khang',
    role: 'Product Designer',
    initials: 'HK',
    text: 'Mình bỏ Anki vì lười làm thẻ. LingoPro mở lên là có lộ trình và từ đã lưu.',
  },
  {
    name: 'Cô Thanh Hương',
    role: 'Giáo viên THPT',
    initials: 'TH',
    text: 'Giao bộ từ theo bài trên lớp rất nhanh. Học sinh vào mã lớp là ôn được ngay.',
  },
];

const FAQS = [
  {
    q: 'LingoPro là gì?',
    a: 'Ứng dụng học từ vựng tiếng Anh cho người Việt: kết hợp từ điển Anh–Việt, tiện ích tra từ 1 chạm trên trình duyệt, lộ trình dựng sẵn (IELTS, TOEIC, THPT, Giao tiếp) và thuật toán lặp lại ngắt quãng FSRS.',
  },
  {
    q: 'FSRS khác gì học flashcard thông thường?',
    a: 'FSRS ước tính xác suất bạn còn nhớ từng từ để chỉ nhắc ôn ngay trước khi quên — giảm số lần ôn thừa mà vẫn giữ từ lâu hơn.',
  },
  {
    q: 'Có miễn phí không?',
    a: 'Có. Gói Miễn phí dùng được lâu dài (FSRS, lộ trình cơ bản, 200 từ mới/tháng, 5 lượt AI/ngày). Nâng cấp Pro từ 59.000₫/tháng khi cần không giới hạn.',
  },
  {
    q: 'Mỗi ngày cần học bao lâu?',
    a: 'Một chặng chuẩn mất khoảng 5–8 phút (10–15 từ). Duy trì đều hiệu quả hơn học dồn cuối tuần.',
  },
];

/**
 * Interactive Dictionary Demo component calling GET /api/v1/dictionary/lookup via apiClient
 * instead of SSR, with instant rich fallback so guests can test lookup in 0ms.
 */
const InteractiveDictionaryDemo: React.FC = () => {
  const [searchInput, setSearchInput] = useState('resilient');
  const [selectedWord, setSelectedWord] = useState('resilient');
  const [savedToast, setSavedToast] = useState(false);

  const lookupQuery = useDictionaryLookup(selectedWord);

  const fallback =
    FALLBACK_DEMO_ENTRIES[selectedWord.toLowerCase()] ?? FALLBACK_DEMO_ENTRIES.resilient;

  const apiData = lookupQuery.data;
  const firstSense = apiData?.senses?.[0];
  const displayEntry: DemoDictEntry = apiData
    ? {
        word: apiData.term || selectedWord,
        ipa: apiData.ipa || fallback.ipa,
        pos: apiData.partOfSpeech || fallback.pos,
        meaningVi: firstSense?.vi || firstSense?.en || fallback.meaningVi,
        exampleEn: firstSense?.example || fallback.exampleEn,
        exampleVi: fallback.exampleVi,
        synonyms: apiData.synonyms?.length ? apiData.synonyms : fallback.synonyms,
      }
    : fallback;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = searchInput.trim().toLowerCase();
    if (cleaned) {
      setSelectedWord(cleaned);
      setSavedToast(false);
    }
  };

  return (
    <div>
      {/* Search bar */}
      <form
        onSubmit={handleSearchSubmit}
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Nhập từ tiếng Anh bất kỳ (VD: resilient, mitigate...)"
          style={{
            flex: 1,
            padding: '11px 16px',
            borderRadius: '14px',
            border: '1.5px solid #d7c7b6',
            background: '#fffaf5',
            fontSize: '14px',
            fontWeight: 600,
            color: '#241710',
            outline: 'none',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '11px 18px',
            borderRadius: '14px',
            border: 'none',
            background: '#241710',
            color: '#f6efe6',
            fontWeight: 800,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          🔍 Tra ngay
        </button>
      </form>

      {/* Quick chips */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginBottom: '16px',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#7b6558' }}>Thử nhanh:</span>
        {Object.keys(FALLBACK_DEMO_ENTRIES).map((word) => {
          const active = selectedWord.toLowerCase() === word;
          return (
            <button
              key={word}
              type="button"
              onClick={() => {
                setSearchInput(word);
                setSelectedWord(word);
                setSavedToast(false);
              }}
              style={{
                padding: '4px 11px',
                borderRadius: '999px',
                border: active ? '1.5px solid #b5502f' : '1px solid #d7c7b6',
                background: active ? '#b5502f' : '#fffaf5',
                color: active ? '#fff' : '#4f3f35',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {word}
            </button>
          );
        })}
      </div>

      {/* Dictionary Card Result */}
      <div
        style={{
          borderRadius: '20px',
          border: '1px solid #eadfd0',
          background: '#fffaf5',
          padding: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3
                className="lp-landing-serif"
                style={{
                  fontSize: '26px',
                  fontWeight: 800,
                  margin: 0,
                  color: '#241710',
                }}
              >
                {displayEntry.word}
              </h3>
              <span
                style={{
                  fontSize: '14px',
                  color: '#7b6558',
                  fontFamily: 'monospace',
                }}
              >
                {displayEntry.ipa}
              </span>
              <button
                type="button"
                onClick={() => {
                  if ('speechSynthesis' in window) {
                    const u = new SpeechSynthesisUtterance(displayEntry.word);
                    u.lang = 'en-US';
                    window.speechSynthesis.speak(u);
                  }
                }}
                title="Nghe phát âm"
                style={{
                  border: '1px solid #d7c7b6',
                  background: '#fff',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '13px',
                }}
              >
                🔊
              </button>
            </div>
            <span
              style={{
                display: 'inline-block',
                marginTop: '4px',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: '#b5502f',
              }}
            >
              {displayEntry.pos}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setSavedToast(true)}
            style={{
              padding: '8px 14px',
              borderRadius: '999px',
              border: 'none',
              background: savedToast ? '#2d7f5e' : '#b5502f',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {savedToast ? '✓ Đã thêm vào kho FSRS' : '+ Lưu vào kho FSRS'}
          </button>
        </div>

        <div
          style={{
            marginTop: '14px',
            padding: '12px 14px',
            borderRadius: '14px',
            background: '#ffffff',
            border: '1px solid #eadfd0',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#7b6558' }}>NGHĨA TIẾNG VIỆT</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#241710', marginTop: '3px' }}>
            {displayEntry.meaningVi}
          </div>
        </div>

        <div style={{ marginTop: '12px', fontSize: '13.5px', color: '#4f3f35', lineHeight: 1.6 }}>
          <div>
            <strong>Ví dụ:</strong> “{displayEntry.exampleEn}”
          </div>
          <div style={{ color: '#7b6558', fontSize: '12.5px' }}>→ {displayEntry.exampleVi}</div>
        </div>

        <div
          style={{
            marginTop: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#7b6558' }}>Từ đồng nghĩa:</span>
          {displayEntry.synonyms.map((syn) => (
            <span
              key={syn}
              style={{
                padding: '2px 9px',
                borderRadius: '999px',
                background: '#f3ebe1',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#5e4b40',
              }}
            >
              {syn}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Public Marketing Landing Page ported from /src/app/page.tsx.
 * Replaces Next.js Server-Side Rendering with client-side API calls to the .NET 10 backend.
 */
export const LandingPageView: React.FC = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Client-side API call replacing SSR catalog statistics
  const statsQuery = useQuery({
    queryKey: ['seo-landing-stats'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<SeoLandingStatsDto>>('/seo/landing');
      return response.data.data;
    },
    staleTime: 30 * 60 * 1000,
    retry: 0,
  });

  const vocabStats = {
    words: statsQuery.data?.totalWords
      ? statsQuery.data.totalWords.toLocaleString('vi-VN')
      : '4.170',
    packs: statsQuery.data?.totalPacks ? String(statsQuery.data.totalPacks) : '360',
    routes: statsQuery.data?.totalRoutes ? String(statsQuery.data.totalRoutes) : '12',
  };

  return (
    <div className="lp-landing-root">
      <div className="lp-landing-ambient" aria-hidden="true">
        <div className="lp-landing-blob-left" />
        <div className="lp-landing-blob-right" />
      </div>

      {/* ── HEADER ── */}
      <header className="lp-landing-header">
        <div className="lp-landing-header-inner">
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: '#241710',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: '#241710',
                color: '#f6efe6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: '16px',
              }}
            >
              L
            </div>
            <span className="lp-landing-serif" style={{ fontSize: '19px', fontWeight: 800 }}>
              LingoPro
            </span>
          </Link>

          <nav className="lp-landing-nav" aria-label="Điều hướng chính">
            <a href="#cach-hoc">Cách học</a>
            <Link
              to="/student/speaking"
              style={{
                color: '#92400e',
                fontWeight: 800,
              }}
            >
              🗣️ Phiên Âm IPA
            </Link>
            <Link
              to="/toeic"
              style={{
                color: '#4338ca',
                fontWeight: 800,
              }}
            >
              🎧 Sát Thủ TOEIC
            </Link>
            <a href="#demo">Thử tra từ</a>
            <a href="#bang-gia">Giá</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAuthenticated ? (
              <Link
                to="/student"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '999px',
                  background: '#059669',
                  color: '#ffffff',
                  padding: '9px 18px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                Vào bàn học →
              </Link>
            ) : (
              <Link
                to="/auth"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  borderRadius: '999px',
                  background: '#241710',
                  color: '#f6efe6',
                  padding: '9px 18px',
                  fontSize: '13.5px',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                Dùng miễn phí →
              </Link>
            )}
          </div>
        </div>
      </header>

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* ── HERO ── */}
        <section className="lp-landing-hero">
          <div>
            <div className="lp-landing-tag">✨ App học từ vựng · FSRS</div>

            <h1 className="lp-landing-serif lp-landing-h1">
              Học từ vựng tiếng Anh —{' '}
              <span style={{ color: '#b5502f' }}>tra 1 chạm, nhớ lâu hơn</span>
            </h1>

            <p
              style={{
                maxWidth: '32rem',
                fontSize: '1.125rem',
                lineHeight: 1.7,
                color: '#5e4b40',
                margin: '0 0 1.5rem',
              }}
            >
              Tra từ trên web → lưu kho riêng → ôn đúng lúc bằng FSRS. Chặng ngắn 5–8 phút, lộ
              trình sẵn cho người Việt.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
              <Link to={isAuthenticated ? '/student' : '/auth'} className="lp-landing-btn-primary">
                {isAuthenticated ? 'Tiếp tục lộ trình học' : 'Bắt đầu miễn phí'} →
              </Link>
              <a href="#demo" className="lp-landing-btn-secondary">
                Thử tra từ ngay
              </a>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '18px',
                fontSize: '13.5px',
                fontWeight: 700,
                color: '#7b6558',
              }}
            >
              {['Miễn phí bắt đầu', '5–8 phút/chặng', 'Lộ trình sẵn'].map((t) => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#2d7f5e', fontWeight: 900 }}>✓</span> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right Compact Product Card */}
          <div className="lp-landing-hero-card">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <span className="lp-landing-serif" style={{ fontSize: '20px', fontWeight: 700 }}>
                3 bước nhớ từ
              </span>
              <span
                style={{
                  borderRadius: '999px',
                  background: '#d7bb76',
                  padding: '2px 10px',
                  fontSize: '11px',
                  fontWeight: 900,
                  color: '#241710',
                }}
              >
                FSRS
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '14px',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: '#f6efe6',
                      color: '#241710',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 900,
                          letterSpacing: '0.1em',
                          color: '#cbb7a6',
                        }}
                      >
                        {s.n}
                      </span>
                      <span style={{ fontSize: '15px', fontWeight: 800 }}>{s.title}</span>
                    </div>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: '13.5px',
                        lineHeight: 1.45,
                        color: '#d8c9bc',
                      }}
                    >
                      {s.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Catalog Stats from API */}
            <div
              style={{
                marginTop: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              {[
                { v: vocabStats.words, l: 'từ' },
                { v: vocabStats.packs, l: 'chặng' },
                { v: vocabStats.routes, l: 'lộ trình' },
              ].map((x) => (
                <div
                  key={x.l}
                  style={{
                    borderRadius: '12px',
                    background: '#f6efe6',
                    padding: '12px 8px',
                    textAlign: 'center',
                    color: '#241710',
                  }}
                >
                  <div className="lp-landing-serif" style={{ fontSize: '22px', fontWeight: 800 }}>
                    {x.v}
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      color: '#7b6558',
                    }}
                  >
                    {x.l}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                marginTop: '12px',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#cbb7a6',
                }}
              >
                Lộ trình
              </span>
              {['IELTS', 'TOEIC', 'THPT', 'Giao tiếp'].map((t) => (
                <span
                  key={t}
                  style={{
                    borderRadius: '999px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(255,255,255,0.06)',
                    padding: '2px 10px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#e9dccf',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── INTERACTIVE DICTIONARY DEMO (API-Powered) ── */}
        <section
          id="demo"
          style={{
            borderTop: '1px solid rgba(215, 199, 182, 0.7)',
            borderBottom: '1px solid rgba(215, 199, 182, 0.7)',
            background: '#fffaf5',
            padding: '4.5rem 1.5rem',
          }}
        >
          <div style={{ maxWidth: '72rem', margin: '0 auto' }} className="lp-landing-demo-grid">
            <div>
              <div className="lp-landing-tag">✨ Thử ngay qua API</div>
              <h2
                className="lp-landing-serif"
                style={{
                  fontSize: 'clamp(1.85rem, 3vw, 2.5rem)',
                  fontWeight: 800,
                  margin: '16px 0 12px',
                  color: '#241710',
                }}
              >
                Tra thử một từ — <span style={{ color: '#b5502f' }}>không cần tài khoản</span>
              </h2>
              <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#5e4b40', margin: '0 0 16px' }}>
                Xem nghĩa Việt, IPA, ví dụ thực tế trực tiếp từ hệ thống từ điển LingoPro API. Đăng ký
                chỉ khi muốn lưu và ôn FSRS.
              </p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#5e4b40',
                }}
              >
                {[
                  'Kho từ học thuật + nguồn ngữ cảnh thực tế',
                  'Web & Chrome Extension đồng bộ cùng một kho',
                  'Biết có hợp mình ngay trong 30 giây',
                ].map((line) => (
                  <li key={line} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: '#b5502f',
                      }}
                    />
                    {line}
                  </li>
                ))}
              </ul>
            </div>

            <div
              style={{
                borderRadius: '28px',
                border: '1px solid #d7c7b6',
                background: '#ffffff',
                padding: '20px',
                boxShadow: '0 20px 55px rgba(95, 69, 52, 0.10)',
              }}
            >
              <InteractiveDictionaryDemo />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="cach-hoc" style={{ padding: '4.5rem 1.5rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <div style={{ maxWidth: '42rem', marginBottom: '2.5rem' }}>
              <div className="lp-landing-tag">✨ Cách học</div>
              <h2
                className="lp-landing-serif"
                style={{
                  fontSize: 'clamp(1.85rem, 3vw, 2.5rem)',
                  fontWeight: 800,
                  margin: '16px 0 12px',
                  color: '#241710',
                }}
              >
                Ít phút mỗi ngày —{' '}
                <span style={{ color: '#b5502f' }}>nhớ dai hơn sau nhiều tuần</span>
              </h2>
              <p style={{ fontSize: '16px', lineHeight: 1.7, color: '#5e4b40', margin: 0 }}>
                Không nhồi từ. Mỗi từ có lịch ôn riêng; hệ thống nhắc, bạn chỉ cần mở và làm chặng.
              </p>
            </div>

            <div className="lp-landing-grid-3">
              {WHY.map((s) => (
                <article
                  key={s.title}
                  style={{
                    borderRadius: '24px',
                    border: '1px solid rgba(215, 199, 182, 0.8)',
                    background: 'rgba(255, 255, 255, 0.85)',
                    padding: '24px',
                    boxShadow: '0 12px 36px rgba(95, 69, 52, 0.06)',
                  }}
                >
                  <div
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      background: '#241710',
                      color: '#f6efe6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    {s.icon}
                  </div>
                  <h3 style={{ margin: '16px 0 6px', fontSize: '18px', fontWeight: 800 }}>
                    {s.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.65, color: '#5e4b40' }}>
                    {s.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── COMPARE: LINGOPRO VS ANKI ── */}
        <section
          style={{
            borderTop: '1px solid rgba(215, 199, 182, 0.7)',
            borderBottom: '1px solid rgba(215, 199, 182, 0.7)',
            background: '#fffaf5',
            padding: '4.5rem 1.5rem',
          }}
        >
          <div style={{ maxWidth: '52rem', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div className="lp-landing-tag">✨ LingoPro vs Anki</div>
              <h2
                className="lp-landing-serif"
                style={{
                  fontSize: 'clamp(1.85rem, 3vw, 2.5rem)',
                  fontWeight: 800,
                  margin: '16px 0 0',
                }}
              >
                Muốn học ngay — <span style={{ color: '#b5502f' }}>không tự dựng hệ thống</span>
              </h2>
            </div>

            <div
              style={{
                borderRadius: '20px',
                border: '1px solid #d7c7b6',
                overflow: 'hidden',
                background: '#fff',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1.2fr 1.2fr',
                  background: '#241710',
                  color: '#f6efe6',
                  fontWeight: 800,
                  fontSize: '14px',
                }}
              >
                <div style={{ padding: '14px 16px' }}>Tiêu chí</div>
                <div style={{ padding: '14px 16px', color: '#f1c46d' }}>LingoPro</div>
                <div style={{ padding: '14px 16px', color: '#d5c1b4' }}>Anki</div>
              </div>
              {COMPARE_ROWS.map((row, idx) => (
                <div
                  key={row.label}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1.2fr 1.2fr',
                    fontSize: '13.5px',
                    borderTop: '1px solid #eadfd0',
                    background: idx % 2 === 0 ? '#ffffff' : '#fff9f3',
                  }}
                >
                  <div style={{ padding: '14px 16px', fontWeight: 800 }}>{row.label}</div>
                  <div
                    style={{
                      padding: '14px 16px',
                      background: 'rgba(249, 238, 232, 0.7)',
                      fontWeight: 600,
                      color: '#4f3f35',
                    }}
                  >
                    <span style={{ color: '#2d7f5e', fontWeight: 900, marginRight: '6px' }}>✓</span>
                    {row.lingo}
                  </div>
                  <div style={{ padding: '14px 16px', color: '#6d574a' }}>
                    <span style={{ color: '#b5502f', fontWeight: 900, marginRight: '6px' }}>✕</span>
                    {row.anki}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF ── */}
        <section style={{ padding: '4.5rem 1.5rem' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div className="lp-landing-tag">✨ Người dùng</div>
              <h2
                className="lp-landing-serif"
                style={{
                  fontSize: 'clamp(1.85rem, 3vw, 2.5rem)',
                  fontWeight: 800,
                  margin: '16px 0 0',
                }}
              >
                Dễ quay lại mỗi ngày
              </h2>
            </div>

            <div className="lp-landing-grid-3">
              {TESTIMONIALS.map((t) => (
                <blockquote
                  key={t.name}
                  style={{
                    margin: 0,
                    borderRadius: '24px',
                    border: '1px solid rgba(215, 199, 182, 0.8)',
                    background: '#ffffff',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 12px 36px rgba(95, 69, 52, 0.06)',
                  }}
                >
                  <div style={{ color: '#d39b29', fontSize: '14px', letterSpacing: '2px' }}>
                    ★★★★★
                  </div>
                  <p
                    style={{
                      flex: 1,
                      margin: '12px 0 16px',
                      fontSize: '15px',
                      lineHeight: 1.7,
                      color: '#4f3f35',
                    }}
                  >
                    “{t.text}”
                  </p>
                  <footer
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      borderTop: '1px solid #eadfd0',
                      paddingTop: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: '#241710',
                        color: '#f6efe6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 900,
                      }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 800 }}>{t.name}</div>
                      <div style={{ fontSize: '12px', color: '#7b6558', fontWeight: 600 }}>
                        {t.role}
                      </div>
                    </div>
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section
          id="bang-gia"
          style={{
            borderTop: '1px solid rgba(215, 199, 182, 0.7)',
            borderBottom: '1px solid rgba(215, 199, 182, 0.7)',
            background: '#fffaf5',
            padding: '4.5rem 1.5rem',
          }}
        >
          <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <div className="lp-landing-tag">✨ Bảng giá</div>
              <h2
                className="lp-landing-serif"
                style={{
                  fontSize: 'clamp(1.85rem, 3vw, 2.5rem)',
                  fontWeight: 800,
                  margin: '16px 0 0',
                }}
              >
                Miễn phí bắt đầu · <span style={{ color: '#b5502f' }}>Pro hoặc gói nhóm</span>
              </h2>
            </div>

            <div className="lp-landing-grid-3">
              {/* Free Plan */}
              <div
                style={{
                  borderRadius: '28px',
                  border: '1px solid #d7c7b6',
                  background: '#ffffff',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.18em',
                    color: '#7b6558',
                  }}
                >
                  Miễn phí
                </div>
                <div className="lp-landing-serif" style={{ fontSize: '36px', fontWeight: 800, marginTop: '8px' }}>
                  0₫
                </div>
                <p style={{ margin: '4px 0 20px', fontSize: '13.5px', color: '#7b6558', fontWeight: 600 }}>
                  Tra · lưu · ôn FSRS cơ bản
                </p>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 24px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#4f3f35',
                  }}
                >
                  {[
                    'Flashcard FSRS',
                    'Lưu 200 từ mới/tháng',
                    'Lộ trình từ vựng sẵn',
                    'Tra từ AI: 5 lượt/ngày',
                  ].map((item) => (
                    <li key={item} style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#2d7f5e', fontWeight: 900 }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/auth"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: '999px',
                    border: '1px solid #d7c7b6',
                    background: '#fffaf5',
                    color: '#241710',
                    fontWeight: 800,
                    fontSize: '14px',
                    textDecoration: 'none',
                  }}
                >
                  Dùng thử miễn phí
                </Link>
              </div>

              {/* Pro Plan */}
              <div
                style={{
                  borderRadius: '28px',
                  border: '1px solid rgba(181, 80, 47, 0.3)',
                  background: '#241710',
                  color: '#f6efe6',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      borderRadius: '999px',
                      background: '#d7bb76',
                      color: '#241710',
                      padding: '2px 10px',
                      fontSize: '11px',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                    }}
                  >
                    Phổ biến
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.18em',
                    color: '#cbb7a6',
                    marginTop: '10px',
                  }}
                >
                  LingoPro Pro
                </div>
                <div className="lp-landing-serif" style={{ fontSize: '36px', fontWeight: 800, marginTop: '4px' }}>
                  79.000₫
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#cbb7a6' }}>/tháng</span>
                </div>
                <p style={{ margin: '4px 0 20px', fontSize: '13.5px', color: '#d8c9bc', fontWeight: 600 }}>
                  hoặc <strong style={{ color: '#fff' }}>590.000₫/năm</strong> (tiết kiệm 38%)
                </p>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 24px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  {[
                    'AI: tra từ + phân tích câu không giới hạn',
                    'Ngữ pháp, quiz, điền từ đầy đủ',
                    'Thống kê tiến độ chi tiết',
                    'Phòng luyện nói & chấm điểm AI',
                  ].map((item) => (
                    <li key={item} style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#d7bb76', fontWeight: 900 }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/upgrade"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '13px',
                    borderRadius: '999px',
                    background: '#b5502f',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '14px',
                    textDecoration: 'none',
                  }}
                >
                  Nâng cấp Pro →
                </Link>
              </div>

              {/* Group Plan */}
              <div
                style={{
                  borderRadius: '28px',
                  border: '1px solid #d7c7b6',
                  background: '#ffffff',
                  padding: '28px',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.18em',
                    color: '#7b6558',
                  }}
                >
                  Nhóm
                </div>
                <div className="lp-landing-serif" style={{ fontSize: '30px', fontWeight: 800, marginTop: '8px' }}>
                  từ 49.000₫
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#7b6558' }}>
                    /người/tháng
                  </span>
                </div>
                <p style={{ margin: '4px 0 20px', fontSize: '13.5px', color: '#7b6558', fontWeight: 600 }}>
                  Bạn học · lớp nhỏ · 2–20 người
                </p>
                <ul
                  style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 24px',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#4f3f35',
                  }}
                >
                  {[
                    'Mỗi người = quyền Pro đầy đủ',
                    'Giảm giá theo số người',
                    'Mời bằng mã nhóm',
                    '1 người thanh toán cho cả nhóm',
                  ].map((item) => (
                    <li key={item} style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#2d7f5e', fontWeight: 900 }}>✓</span> {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/upgrade?mode=group"
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    padding: '12px',
                    borderRadius: '999px',
                    border: '1px solid #d7c7b6',
                    background: '#fffaf5',
                    color: '#241710',
                    fontWeight: 800,
                    fontSize: '14px',
                    textDecoration: 'none',
                  }}
                >
                  Xem gói nhóm
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" style={{ padding: '4.5rem 1.5rem' }}>
          <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div className="lp-landing-tag">✨ FAQ</div>
              <h2
                className="lp-landing-serif"
                style={{
                  fontSize: 'clamp(1.85rem, 3vw, 2.5rem)',
                  fontWeight: 800,
                  margin: '16px 0 0',
                }}
              >
                Câu hỏi thường gặp
              </h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FAQS.map((item) => (
                <details
                  key={item.q}
                  style={{
                    borderRadius: '16px',
                    border: '1px solid rgba(215, 199, 182, 0.85)',
                    background: '#ffffff',
                    padding: '16px 20px',
                  }}
                >
                  <summary
                    style={{
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#241710',
                    }}
                  >
                    {item.q}
                  </summary>
                  <p
                    style={{
                      margin: '10px 0 0',
                      fontSize: '14px',
                      lineHeight: 1.7,
                      color: '#5e4b40',
                    }}
                  >
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section style={{ padding: '0 1.5rem 5rem' }}>
          <div
            style={{
              maxWidth: '64rem',
              margin: '0 auto',
              borderRadius: '28px',
              background: '#241710',
              color: '#f6efe6',
              padding: '36px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '24px',
            }}
          >
            <div style={{ maxWidth: '34rem' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.2em',
                  color: '#d7bb76',
                  marginBottom: '8px',
                }}
              >
                ⚡ Bắt đầu hôm nay
              </div>
              <h2
                className="lp-landing-serif"
                style={{ fontSize: '28px', fontWeight: 800, margin: '0 0 8px' }}
              >
                Một từ lạ đầu tiên là đủ để bắt đầu.
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#d8c9bc' }}>
                Không cài phức tạp · Miễn phí ngay · 5–8 phút/chặng.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <Link
                to="/auth"
                style={{
                  padding: '12px 24px',
                  borderRadius: '999px',
                  background: '#f6efe6',
                  color: '#241710',
                  fontWeight: 800,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                Tạo tài khoản →
              </Link>
              <Link
                to="/teacher"
                style={{
                  padding: '12px 24px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: '#f6efe6',
                  fontWeight: 800,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                Cho giáo viên
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: '1px solid rgba(215, 199, 182, 0.7)',
          padding: '2rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: '72rem',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            fontSize: '14px',
            color: '#6d574a',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#241710',
                color: '#f6efe6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
              }}
            >
              L
            </div>
            <div>
              <div className="lp-landing-serif" style={{ fontWeight: 800, color: '#241710' }}>
                LingoPro
              </div>
              <div style={{ fontSize: '12px' }}>Học từ vựng · tra từ · FSRS</div>
            </div>
          </div>

          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontWeight: 700 }}>
            <Link to="/student/speaking" style={{ color: '#6d574a', textDecoration: 'none' }}>
              Phiên Âm IPA
            </Link>
            <Link to="/toeic" style={{ color: '#4338ca', textDecoration: 'none' }}>
              Sát Thủ TOEIC
            </Link>
            <Link to="/teacher" style={{ color: '#6d574a', textDecoration: 'none' }}>
              Giáo viên
            </Link>
            <Link to="/auth" style={{ color: '#6d574a', textDecoration: 'none' }}>
              Đăng nhập
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default LandingPageView;
