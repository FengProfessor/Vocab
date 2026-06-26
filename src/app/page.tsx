import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Brain,
  Repeat2,
  Trophy,
  ArrowRight,
  Zap,
  BookOpen,
  Chrome,
  Star,
  Check,
  X,
  Sparkles,
  Clock3,
  Bell,
  Library,
  GraduationCap,
  Target,
  MessageSquare,
} from 'lucide-react';
import {
  PLAN_PRICES,
  PLAN_ANNUAL_PRICES,
  PLAN_LABELS,
  formatVND,
} from '@/lib/billing';
import AuthRedirectGate from './_components/AuthRedirectGate';
import DictionaryDemo from './_components/DictionaryDemo';

// Số liệu kho từ vựng — gõ cứng (cập nhật tay khi catalog đổi)
const VOCAB_STATS = {
  words: '9.000+',
  packs: '660+',
  routes: '30+',
};

// Lộ trình kho từ vựng (showcase tĩnh)
const VOCAB_ROUTES = [
  { icon: GraduationCap, color: 'text-emerald-400', bg: 'bg-emerald-500/15', title: 'Theo chương trình THPT', desc: 'Bám sát sách Global Success — học đúng từ thầy cô dạy trên lớp.' },
  { icon: Target, color: 'text-amber-400', bg: 'bg-amber-500/15', title: 'Luyện thi TOEIC & IELTS', desc: 'Từ vựng theo band điểm, chia chặng nhỏ ~15 từ học trong 5–8 phút.' },
  { icon: MessageSquare, color: 'text-sky-400', bg: 'bg-sky-500/15', title: 'Giao tiếp & đời sống', desc: '7 lộ trình theo tình huống thực: du lịch, công việc, đời sống hằng ngày.' },
] as const;

// So sánh LingoPro vs Anki
const COMPARE_ROWS: { label: string; lingo: string; anki: string; lingoWin: boolean }[] = [
  { label: 'Bắt đầu học', lingo: 'Mở web là học ngay', anki: 'Cài app + tự tải bộ thẻ', lingoWin: true },
  { label: 'Nội dung có sẵn', lingo: '9.000+ từ theo lộ trình THPT/TOEIC/IELTS', anki: 'Deck rời rạc, chất lượng tùy người tạo', lingoWin: true },
  { label: 'Tra & lưu từ 1 chạm', lingo: 'Tra 3 nguồn + AI, lưu 1 nút', anki: 'Phải tự gõ nghĩa vào thẻ', lingoWin: true },
  { label: 'AI làm giàu từ', lingo: 'Tự thêm nghĩa, IPA, ví dụ, ảnh', anki: 'Không có', lingoWin: true },
  { label: 'Tiếng Việt', lingo: 'Giao diện + nghĩa Việt sẵn', anki: 'Tiếng Anh, cộng đồng tự dịch', lingoWin: true },
  { label: 'Thuật toán ôn tập', lingo: 'FSRS v5 (mới nhất)', anki: 'SM-2 mặc định (FSRS phải cài add-on)', lingoWin: true },
  { label: 'Nhắc ôn', lingo: 'Tự nhắc qua thông báo đúng giờ', anki: 'Phải nhớ tự mở app', lingoWin: true },
  { label: 'Miễn phí & offline', lingo: 'Có bản free (cần mạng)', anki: 'Miễn phí, mã nguồn mở, chạy offline', lingoWin: false },
];

export const metadata: Metadata = {
  title: 'LingoPro — Học từ vựng tiếng Anh thông minh hơn với AI + FSRS',
  description:
    'Nền tảng học từ vựng tiếng Anh dùng AI (Gemini) + Spaced Repetition FSRS v5. Nhớ lâu hơn 5x, nhắc ôn đúng lúc bạn sắp quên. Miễn phí cho học sinh và gia sư.',
  openGraph: {
    title: 'LingoPro — Học từ vựng tiếng Anh thông minh hơn',
    description:
      'AI + Spaced Repetition giúp bạn nhớ lâu hơn 5x. Ngữ pháp có hệ thống, Chrome Extension tra từ, gamification XP & streak.',
    type: 'website',
    locale: 'vi_VN',
    siteName: 'LingoPro',
  },
};

// Social proof — bê từ /landing (Nguyễn Linh / Trần Minh / Ms. Phương)
const TESTIMONIALS = [
  {
    name: 'Nguyễn Linh',
    role: 'English Tutor, HCM',
    text: 'LingoPro giúp tôi tiết kiệm 3 tiếng mỗi tuần. Học sinh học hiệu quả gấp đôi nhờ thuật toán ôn tập theo khoa học.',
    stars: 5,
  },
  {
    name: 'Trần Minh',
    role: 'IELTS Student',
    text: 'Tôi học được 500 từ trong 1 tháng. App nhắc ôn đúng lúc, không bao giờ quên từ nữa. Điểm IELTS từ 6.0 lên 7.5.',
    stars: 5,
  },
  {
    name: 'Ms. Phương',
    role: 'School Teacher, Hà Nội',
    text: 'Dashboard thầy cô rất trực quan. Tôi biết ngay học sinh nào cần giúp thêm mà không cần hỏi từng em.',
    stars: 5,
  },
] as const;

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-slate-950 text-white font-sans">
      {/* Side-effect: đã đăng nhập → redirect /student. Không render gì → bot vẫn index. */}
      <AuthRedirectGate />

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-black text-xl text-white">
            <Brain className="h-6 w-6 text-indigo-400" />
            LingoPro
          </Link>
          <div className="flex items-center gap-4">
            <nav className="hidden items-center gap-6 text-sm font-bold text-slate-300 md:flex">
              <a href="#try" className="transition-colors hover:text-white">Tra từ</a>
              <a href="#library" className="transition-colors hover:text-white">Kho từ vựng</a>
              <a href="#method" className="transition-colors hover:text-white">Phương pháp</a>
              <a href="#pricing" className="transition-colors hover:text-white">Giá</a>
            </nav>
            <Link
              href="/for-teachers"
              className="hidden text-sm font-bold text-slate-300 transition-colors hover:text-white sm:block"
            >
              Dành cho giáo viên
            </Link>
            <Link
              href="/auth"
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-sm transition-colors"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO + DEMO TRA TỪ ── */}
      <section id="try" className="relative overflow-hidden pt-24 pb-24 px-4 sm:px-6 text-center scroll-mt-16">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-semibold">
            <Zap className="h-3.5 w-3.5" /> FSRS v5 + Gemini AI
          </div>

          <h1 className="text-4xl sm:text-6xl font-black leading-tight tracking-tight">
            Học từ vựng tiếng Anh{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              thông minh hơn
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 font-medium max-w-xl mx-auto leading-relaxed">
            AI + Spaced Repetition giúp bạn nhớ lâu hơn 5x. Dành cho học sinh và gia sư tiếng Anh.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              href="/auth"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black text-base border-b-4 border-indigo-800 hover:brightness-110 active:translate-y-0.5 active:border-b-0 transition-all shadow-lg shadow-indigo-900/40"
            >
              Bắt đầu miễn phí <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#library"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-base transition-colors"
            >
              Xem kho từ vựng
            </a>
          </div>
        </div>

        {/* Demo tra từ ngay trong hero — màn hình đầu đã tương tác được */}
        <div className="relative mt-16 text-left">
          <p className="mb-4 flex items-center justify-center gap-2 text-center text-sm font-semibold text-emerald-300">
            <Sparkles className="h-4 w-4" /> Thử ngay — gõ một từ, không cần tài khoản
          </p>
          <DictionaryDemo />
        </div>
      </section>

      {/* ── KHO TỪ VỰNG ── */}
      <section id="library" className="scroll-mt-16 py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-semibold text-indigo-300">
              <Library className="h-3.5 w-3.5" /> Kho từ vựng dựng sẵn
            </div>
            <h2 className="text-3xl font-black sm:text-4xl">Không biết học từ gì? Có lộ trình sẵn.</h2>
            <p className="mx-auto mt-4 max-w-xl font-medium text-slate-400">
              Hàng nghìn từ được biên soạn theo lộ trình, chia thành chặng nhỏ. Chọn mục tiêu rồi học từng chặng 5–8 phút.
            </p>
          </div>

          {/* Stats */}
          <div className="mb-10 grid grid-cols-3 gap-4">
            {[
              { value: VOCAB_STATS.words, label: 'từ vựng' },
              { value: VOCAB_STATS.packs, label: 'chặng học' },
              { value: VOCAB_STATS.routes, label: 'lộ trình' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 py-6 text-center">
                <div className="text-3xl font-black text-indigo-400 sm:text-4xl">{s.value}</div>
                <div className="mt-1 text-sm font-medium text-slate-400">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Route cards */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {VOCAB_ROUTES.map((r) => (
              <div key={r.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:bg-white/[0.07]">
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${r.bg}`}>
                  <r.icon className={`h-6 w-6 ${r.color}`} />
                </div>
                <h3 className="mb-2 text-lg font-black">{r.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{r.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-slate-400">
            <Clock3 className="h-4 w-4 text-indigo-400" /> Mỗi chặng ~15 từ · học gọn trong 5–8 phút
          </div>
        </div>
      </section>

      {/* ── PHƯƠNG PHÁP HỌC ── */}
      <section id="method" className="scroll-mt-16 border-y border-white/5 bg-white/[0.02] py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-semibold text-purple-300">
              <Repeat2 className="h-3.5 w-3.5" /> Phương pháp học
            </div>
            <h2 className="text-3xl font-black sm:text-4xl">Học ít, nhớ lâu — nhờ khoa học trí nhớ</h2>
            <p className="mx-auto mt-4 max-w-xl font-medium text-slate-400">
              LingoPro dùng thuật toán Spaced Repetition FSRS v5: tính đúng thời điểm bạn sắp quên và nhắc ôn ngay lúc đó. Nhớ lâu hơn, ôn ít lần hơn.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15">
                <Repeat2 className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="mb-2 text-lg font-black">1 · Lặp lại ngắt quãng</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                Mỗi từ có lịch ôn riêng theo tốc độ nhớ của bạn. Nhớ tốt → giãn xa; quên → ôn lại sau ~10 phút.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15">
                <Clock3 className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="mb-2 text-lg font-black">2 · Chặng học siêu ngắn</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                ~15 từ mỗi chặng, gọn trong 5–8 phút. Học mọi lúc rảnh, không ngộp, dễ duy trì thói quen.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15">
                <Bell className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="mb-2 text-lg font-black">3 · Nhắc đúng lúc</h3>
              <p className="text-sm leading-relaxed text-slate-400">
                App tự gửi thông báo khi tới hạn ôn. Không phải tự nhớ, không bỏ sót từ nào.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO GIỚI THIỆU ── */}
      <section id="video" className="scroll-mt-16 py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <h2 className="mb-4 text-3xl font-black sm:text-4xl">Xem LingoPro hoạt động</h2>
            <p className="mx-auto max-w-lg font-medium text-slate-400">
              Lưu từ ngay trên web, rồi ôn lại bằng flashcard, quiz, streak — tất cả trong một chỗ.
            </p>
          </div>

          {/* Video chính — tổng quan có tiếng */}
          <div className="mb-3 flex items-center gap-2 text-sm font-bold">
            <span className="rounded-full bg-indigo-500/15 px-3 py-1 text-indigo-300">Tổng quan</span>
            <span className="text-slate-500">~25 giây · bấm để xem (có tiếng)</span>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-indigo-950/40">
            <video
              className="absolute inset-0 h-full w-full"
              src="/lingopro-demo.mp4"
              controls
              playsInline
              preload="metadata"
              aria-label="Video giới thiệu tổng quan LingoPro"
            />
          </div>

          {/* Video phụ — lưu từ trên web (loop im lặng) */}
          <div className="mb-3 mt-12 flex items-center gap-2 text-sm font-bold">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-300">Lưu từ trên web</span>
            <span className="text-slate-500">demo 10 giây · tự chạy</span>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl shadow-indigo-950/40">
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src="/intro-save-word.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              aria-label="Demo lưu từ vựng ngay trên web LingoPro"
            />
          </div>
        </div>
      </section>

      {/* ── TÍNH NĂNG KHÁC (compact) ── */}
      <section id="features" className="scroll-mt-16 py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black sm:text-4xl">Còn nhiều hơn thế</h2>
            <p className="mx-auto mt-4 max-w-lg font-medium text-slate-400">
              Mọi thứ một người học tiếng Anh cần, gói gọn trong một chỗ.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { icon: Brain, color: 'text-indigo-400', bg: 'bg-indigo-500/15', title: 'AI làm giàu từ', desc: 'Tự thêm nghĩa, IPA, ví dụ, ảnh cho mỗi từ.' },
              { icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/15', title: 'Ngữ pháp hệ thống', desc: '67 bài kèm bài tập AI, ôn theo lịch SRS.' },
              { icon: Trophy, color: 'text-amber-400', bg: 'bg-amber-500/15', title: 'Game hóa', desc: 'XP, streak, bảng xếp hạng trong lớp.' },
              { icon: Chrome, color: 'text-sky-400', bg: 'bg-sky-500/15', title: 'Chrome Extension', desc: 'Tra & lưu từ ngay khi đang duyệt web.' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-5 transition-colors hover:bg-white/[0.07]">
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${f.bg}`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <h3 className="mb-1 font-black">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS (social proof) ── */}
      <section id="testimonials" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">
            Học viên & giáo viên nói gì?
          </h2>
          <p className="text-center text-slate-400 font-medium mb-16 max-w-lg mx-auto">
            Hàng nghìn học sinh và gia sư tiếng Anh đang học hiệu quả hơn cùng LingoPro.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed flex-1">“{t.text}”</p>
                <div>
                  <div className="font-black text-white">{t.name}</div>
                  <div className="text-slate-500 text-sm">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SO SÁNH VỚI ANKI ── */}
      <section id="compare" className="scroll-mt-16 border-y border-white/5 bg-white/[0.02] py-24 px-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-black sm:text-4xl">LingoPro so với Anki</h2>
            <p className="mx-auto mt-4 max-w-xl font-medium text-slate-400">
              Anki mạnh nhưng phải tự dựng mọi thứ. LingoPro làm sẵn nội dung, tra từ và tiếng Việt cho người Việt — vào là học.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[1.1fr_1.4fr_1.4fr] bg-white/5 text-sm font-black">
              <div className="p-4 text-slate-400" />
              <div className="flex items-center gap-2 p-4 text-indigo-300">
                <Brain className="h-4 w-4" /> LingoPro
              </div>
              <div className="p-4 text-slate-400">Anki</div>
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1.1fr_1.4fr_1.4fr] text-sm ${i % 2 === 0 ? 'bg-transparent' : 'bg-white/[0.02]'}`}
              >
                <div className="border-t border-white/5 p-4 font-bold text-slate-300">{row.label}</div>
                <div className="flex items-start gap-2 border-t border-white/5 bg-indigo-500/[0.06] p-4 text-slate-200">
                  {row.lingoWin ? (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  )}
                  {row.lingo}
                </div>
                <div className="flex items-start gap-2 border-t border-white/5 p-4 text-slate-400">
                  {row.lingoWin ? (
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-slate-600" />
                  ) : (
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  )}
                  {row.anki}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-slate-500">
            Anki là phần mềm tuyệt vời cho người thích tự tùy biến. LingoPro hợp với học sinh muốn vào là học ngay, bằng tiếng Việt.
          </p>
        </div>
      </section>

      {/* ── PRICING (Free vs Pro rút gọn) ── */}
      <section id="pricing" className="py-24 px-4 sm:px-6 border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">
            Giá đơn giản, minh bạch
          </h2>
          <p className="text-center text-slate-400 font-medium mb-16 max-w-lg mx-auto">
            Bắt đầu miễn phí. Nâng cấp {PLAN_LABELS.pro} khi cần học không giới hạn.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Free */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-7 flex flex-col gap-5">
              <div>
                <div className="font-black text-lg">{PLAN_LABELS.free}</div>
                <div className="mt-2 text-3xl font-black">
                  0₫
                  <span className="text-base font-medium text-slate-500"> /tháng</span>
                </div>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-300 flex-1">
                {['Lưu & học từ vựng cơ bản', 'Flashcard FSRS v5', 'Ngữ pháp có hệ thống', 'Chrome Extension tra từ'].map(
                  (f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" /> {f}
                    </li>
                  ),
                )}
              </ul>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-sm transition-colors"
              >
                Bắt đầu miễn phí
              </Link>
            </div>

            {/* Pro */}
            <div className="relative bg-indigo-600/10 border border-indigo-500/40 rounded-2xl p-7 flex flex-col gap-5">
              <div className="absolute -top-3 left-7 px-3 py-1 rounded-full bg-indigo-600 text-xs font-black">
                Phổ biến nhất
              </div>
              <div>
                <div className="font-black text-lg text-indigo-300">{PLAN_LABELS.pro}</div>
                <div className="mt-2 text-3xl font-black">
                  {formatVND(PLAN_PRICES.pro)}
                  <span className="text-base font-medium text-slate-500"> /tháng</span>
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  hoặc {formatVND(PLAN_ANNUAL_PRICES.pro)}/năm — tiết kiệm hơn
                </div>
              </div>
              <ul className="space-y-2.5 text-sm text-slate-200 flex-1">
                {[
                  'Tất cả tính năng Free',
                  'Học từ vựng không giới hạn',
                  'AI làm giàu từ vựng nâng cao',
                  'Thống kê & leaderboard đầy đủ',
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-black text-sm border-b-4 border-indigo-800 hover:brightness-110 active:translate-y-0.5 active:border-b-0 transition-all"
              >
                Nâng cấp {PLAN_LABELS.pro} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BOTTOM ── */}
      <section className="py-28 px-4 sm:px-6 text-center">
        <div className="max-w-xl mx-auto space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black leading-tight">
            Sẵn sàng học{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              thông minh hơn?
            </span>
          </h2>
          <p className="text-slate-400 font-medium">
            Miễn phí. Không cần thẻ tín dụng. Bắt đầu trong 30 giây.
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 font-black text-base border-b-4 border-indigo-800 hover:brightness-110 active:translate-y-0.5 active:border-b-0 transition-all shadow-lg shadow-indigo-900/40"
          >
            Đăng ký ngay <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2 font-bold text-slate-400">
            <Brain className="h-4 w-4 text-indigo-400" /> LingoPro
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link href="/for-teachers" className="hover:text-white transition-colors">
              Dành cho giáo viên
            </Link>
            <Link href="/auth" className="hover:text-white transition-colors">
              Đăng nhập
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Bảo mật
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              Điều khoản
            </Link>
          </nav>
          <span className="text-slate-600">© 2026 LingoPro. Học thông minh, nhớ lâu hơn.</span>
        </div>
      </footer>
    </div>
  );
}
