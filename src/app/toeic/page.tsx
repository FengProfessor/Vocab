import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  Clock,
  Layers,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';

const SITE_URL = 'https://lingopro.online/toeic';

export const metadata: Metadata = {
  title: 'Luyện thi TOEIC Reading miễn phí — Part 5, 6, 7 | LingoPro',
  description:
    'Luyện đề TOEIC Reading Part 5, 6, 7 với giải thích chi tiết bằng tiếng Việt. Ngân hàng câu hỏi theo level 450+, 650+, 800+. Miễn phí bắt đầu.',
  keywords: [
    'luyện thi TOEIC',
    'TOEIC Reading',
    'TOEIC Part 5',
    'TOEIC Part 6',
    'TOEIC Part 7',
    'luyện TOEIC miễn phí',
    'đề thi TOEIC',
    'TOEIC online',
    'ôn TOEIC',
    'LingoPro',
  ],
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Luyện thi TOEIC Reading — Miễn phí | LingoPro',
    description:
      'Part 5, 6, 7 với giải thích tiếng Việt. Lộ trình từ 450 → 650 → 800+. Bắt đầu ngay.',
    type: 'website',
    locale: 'vi_VN',
    url: SITE_URL,
    siteName: 'LingoPro',
  },
};

const PARTS = [
  {
    part: 'Part 5',
    title: 'Incomplete Sentences',
    desc: 'Điền từ/ngữ pháp vào chỗ trống trong câu đơn. 30 câu trong đề thật.',
    icon: Zap,
    color: 'from-blue-500 to-indigo-600',
    href: '/toeic/part5/set-p5-01',
    count: '30 câu',
  },
  {
    part: 'Part 6',
    title: 'Text Completion',
    desc: 'Đọc đoạn văn (email, thông báo...) và điền vào 4 chỗ trống. 16 câu trong đề thật.',
    icon: BookOpenCheck,
    color: 'from-emerald-500 to-teal-600',
    href: '/toeic/part6/set-p6-01',
    count: '16 câu',
  },
  {
    part: 'Part 7',
    title: 'Reading Comprehension',
    desc: 'Đọc hiểu email, quảng cáo, bài báo... và trả lời câu hỏi. 54 câu trong đề thật.',
    icon: Brain,
    color: 'from-amber-500 to-orange-600',
    href: '/toeic/part7/set-p7s-01',
    count: '54 câu',
  },
] as const;

const LEVELS = [
  {
    score: '450+',
    label: 'Nền tảng',
    desc: 'Nắm ngữ pháp cơ bản, từ vựng công sở thường gặp.',
    color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  },
  {
    score: '650+',
    label: 'Bứt phá',
    desc: 'Xử lý nhanh Part 5, đọc hiểu văn bản dài và phức tạp.',
    color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  },
  {
    score: '800+',
    label: 'Chinh phục',
    desc: 'Nắm vững mọi dạng bẫy, đọc nhanh và chính xác cao.',
    color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
  },
];

const FEATURES = [
  {
    icon: CheckCircle2,
    title: 'Giải thích tiếng Việt',
    text: 'Mỗi câu có giải thích rõ ràng tại sao đáp án đúng — không chỉ cho đáp án.',
  },
  {
    icon: Target,
    title: 'Phân loại theo level',
    text: 'Từ 450+ đến 800+. Học đúng mức, không bị quá dễ hay quá khó.',
  },
  {
    icon: Layers,
    title: 'Lộ trình có cấu trúc',
    text: 'Tích hợp vào lộ trình Journey — theo dõi tiến độ, mở khóa từng bước.',
  },
  {
    icon: Clock,
    title: 'Mini Test có đồng hồ',
    text: 'Mô phỏng áp lực thời gian thi thật. Luyện cả tốc độ lẫn độ chính xác.',
  },
];

export default function ToeicLandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/20">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pt-16 pb-12 text-center space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 dark:bg-blue-900/30 px-4 py-1.5 text-sm font-semibold text-blue-700 dark:text-blue-300">
          <Trophy className="w-4 h-4" />
          TOEIC Reading Practice
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight">
          Luyện thi{' '}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
            TOEIC Reading
          </span>{' '}
          miễn phí
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Part 5, 6, 7 — giải thích chi tiết bằng tiếng Việt. Lộ trình từ{' '}
          <b>450 → 650 → 800+</b>. Luyện đúng trọng tâm, không lãng phí thời gian.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/toeic/part5/set-p5-01">
            <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
              Bắt đầu luyện Part 5
              <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/toeic/exam/mini-reading-001">
            <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 px-6 py-3 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              <Clock className="w-4 h-4" />
              Làm Mini Test thử
            </button>
          </Link>
        </div>
      </section>

      {/* Parts */}
      <section className="mx-auto max-w-4xl px-4 pb-16 space-y-8">
        <h2 className="text-2xl font-bold text-center">3 Part trong TOEIC Reading</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {PARTS.map((p) => (
            <Link key={p.part} href={p.href} className="group">
              <div className="rounded-2xl border bg-white dark:bg-slate-900 p-5 space-y-3 hover:shadow-lg transition-all group-hover:border-primary/40 h-full">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center`}>
                  <p.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground">{p.part}</p>
                  <h3 className="font-bold">{p.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{p.desc}</p>
                <p className="text-xs font-semibold text-primary group-hover:underline">
                  Luyện ngay → {p.count}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Levels */}
      <section className="mx-auto max-w-4xl px-4 pb-16 space-y-8">
        <h2 className="text-2xl font-bold text-center">Lộ trình 3 cấp độ</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {LEVELS.map((l) => (
            <div key={l.score} className="rounded-2xl border bg-white dark:bg-slate-900 p-5 space-y-3">
              <div className={`inline-flex rounded-full px-3 py-1 text-sm font-bold ${l.color}`}>
                {l.score}
              </div>
              <h3 className="font-bold text-lg">{l.label}</h3>
              <p className="text-sm text-muted-foreground">{l.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-4 pb-16 space-y-8">
        <h2 className="text-2xl font-bold text-center">Tại sao luyện TOEIC trên LingoPro?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-4 rounded-xl border bg-white dark:bg-slate-900 p-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-20 text-center space-y-4">
        <h2 className="text-2xl font-bold">Sẵn sàng luyện TOEIC?</h2>
        <p className="text-muted-foreground">
          Miễn phí, không cần đăng ký. Bắt đầu ngay với Part 5.
        </p>
        <Link href="/toeic/part5/set-p5-01">
          <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-3.5 font-semibold text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
            Luyện ngay
            <ArrowRight className="w-4 h-4" />
          </button>
        </Link>
      </section>
    </div>
  );
}
