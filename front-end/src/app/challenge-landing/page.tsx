import type { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Target,
  Zap,
  TrendingDown,
  CheckCircle2,
  RefreshCcw,
  Award,
  ArrowRight,
  Play,
  MessageSquareQuote,
  XCircle,
  Flame,
  Clock,
  Gift,
  ShieldCheck,
  Star,
  BookOpen,
  Check,
  Users,
} from 'lucide-react';
import { ChallengeInteractiveWrapper } from '@/components/challenge-landing/ChallengeInteractiveWrapper';
import { BeforeAfterSection } from '@/components/challenge-landing/BeforeAfterSection';
import { GuaranteeSeal } from '@/components/challenge-landing/GuaranteeSeal';
import { LeadMagnetSection } from '@/components/challenge-landing/LeadMagnetSection';
import { FaqAccordion } from '@/components/challenge-landing/FaqAccordion';
import { challengeFaqs } from '@/data/challenge/faqs';

export const metadata: Metadata = {
  title: 'Thử Thách Tiếng Anh 180 Ngày - Kiên Trì Mỗi Ngày, Hoàn Tiền 100% | LingoPro',
  description:
    'Thử thách học từ vựng tiếng Anh 90 - 180 ngày dành cho sinh viên và người đi làm. Làm chủ 3.000 từ vựng cốt lõi theo phương pháp lặp lại ngắt quãng, cam kết hoàn tiền 100% khi hoàn thành mục tiêu + Tặng tài khoản Pro!',
  keywords: [
    'học tiếng Anh',
    'thử thách tiếng Anh',
    'thử thách 180 ngày',
    'luyện thi TOEIC',
    'từ vựng tiếng Anh',
    '3000 từ vựng tiếng Anh',
    'phương pháp ôn tập thông minh',
    'spaced repetition',
    'ứng dụng học tiếng Anh',
    'sinh viên',
    'hoàn tiền 100%',
  ],
  alternates: {
    canonical: 'https://challenge.lingopro.online',
  },
  openGraph: {
    title: 'Thử Thách Tiếng Anh 180 Ngày - Kiên Trì Mỗi Ngày, Hoàn Tiền 100% | LingoPro',
    description:
      'Làm chủ 3.000 từ vựng cốt lõi & xây dựng thói quen 15 phút mỗi ngày. Hoàn tiền 100% khi hoàn thành thử thách + Tặng tài khoản Pro.',
    url: 'https://challenge.lingopro.online',
    siteName: 'LingoPro Challenge',
    images: [
      {
        url: 'https://challenge.lingopro.online/badges/tier-elite-showcase.jpg',
        width: 1200,
        height: 630,
        alt: 'LingoPro Challenge 180 Ngày Hoàn Tiền 100%',
      },
    ],
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Thử Thách Tiếng Anh 180 Ngày - Hoàn Tiền 100% | LingoPro',
    description:
      'Chinh phục 3.000 từ vựng tiếng Anh trong 90 - 180 ngày. Hoàn tiền 100% khi hoàn thành mục tiêu!',
    images: ['https://challenge.lingopro.online/badges/tier-elite-showcase.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const chang1 = [
  { id: 1, vi: 'Gia đình & Bản thân', en: 'Family & Self', count: 75, icon: '👨‍👩‍👧‍👦' },
  { id: 2, vi: 'Thời gian & Lịch trình', en: 'Time & Calendar', count: 75, icon: '⏰' },
  { id: 3, vi: 'Đồ ăn & Thức uống', en: 'Food & Drinks', count: 75, icon: '🍳' },
  { id: 4, vi: 'Nhà cửa & Đồ gia dụng', en: 'Home & Appliances', count: 75, icon: '🏠' },
  { id: 5, vi: 'Trường học & Học tập', en: 'School & Study', count: 75, icon: '📚' },
  { id: 6, vi: 'Cơ thể & Sức khỏe căn bản', en: 'Body & Basic Health', count: 75, icon: '💪' },
  { id: 7, vi: 'Quần áo & Thời trang', en: 'Clothes & Daily Wear', count: 75, icon: '👕' },
  { id: 8, vi: 'Động vật & Thiên nhiên', en: 'Animals & Nature', count: 75, icon: '🐾' },
  { id: 9, vi: 'Mua sắm & Tiền bạc cơ bản', en: 'Shopping & Money', count: 75, icon: '🛒' },
];

const chang2 = [
  { id: 1, vi: 'Công sở & Nghề nghiệp', en: 'Office & Careers', count: 84, icon: '💼' },
  { id: 2, vi: 'Công nghệ số & Thiết bị', en: 'Digital Tech & Devices', count: 84, icon: '💻' },
  { id: 3, vi: 'Du lịch, Sân bay & Khách sạn', en: 'Travel, Airport & Hotel', count: 84, icon: '✈️' },
  { id: 4, vi: 'Nhà hàng, Ẩm thực & Nấu nướng', en: 'Restaurant & Culinary', count: 84, icon: '🍽️' },
  { id: 5, vi: 'Cảm xúc & Tính cách', en: 'Feelings & Personality', count: 83, icon: '🧠' },
  { id: 6, vi: 'Môi trường & Khí hậu', en: 'Environment & Climate', count: 83, icon: '🌍' },
  { id: 7, vi: 'Thể thao & Thể hình', en: 'Sports & Fitness', count: 83, icon: '🏆' },
  { id: 8, vi: 'Mối quan hệ & Giao tiếp', en: 'Relationships & Socializing', count: 83, icon: '🤝' },
  { id: 9, vi: 'Dịch vụ & Mua sắm trực tuyến', en: 'Online Shopping & Services', count: 83, icon: '📦' },
  { id: 10, vi: 'Sức khỏe, Bệnh viện & Y tế', en: 'Healthcare & Medicine', count: 83, icon: '🏥' },
];

const chang3 = [
  { id: 1, vi: 'Kinh doanh & Thương mại', en: 'Business, Trade & Markets', count: 84, icon: '📈' },
  { id: 2, vi: 'Giáo dục đại học & Đào tạo', en: 'Higher Education & Training', count: 84, icon: '🎓' },
  { id: 3, vi: 'Khoa học, Đổi mới & AI', en: 'Science, Innovation & AI', count: 84, icon: '🔬' },
  { id: 4, vi: 'Xã hội học & Đô thị hóa', en: 'Sociology & Urban Life', count: 84, icon: '🏙️' },
  { id: 5, vi: 'Văn hóa, Lịch sử & Nghệ thuật', en: 'Culture, History & Arts', count: 83, icon: '🎭' },
  { id: 6, vi: 'Tâm lý học & Động lực', en: 'Psychology & Human Behavior', count: 83, icon: '🧘' },
  { id: 7, vi: 'Tài chính cá nhân & Đầu tư', en: 'Personal Finance & Investment', count: 83, icon: '💎' },
  { id: 8, vi: 'Pháp luật & Chính sách', en: 'Law, Rights & Policy', count: 83, icon: '⚖️' },
  { id: 9, vi: 'Kỹ năng thuyết trình & Tranh biện', en: 'Presentation & Debating', count: 83, icon: '🎤' },
  { id: 10, vi: 'Tư duy phản biện', en: 'Critical Thinking & Problem Solving', count: 83, icon: '🧩' },
];

const TopicCard = ({ topic }: { topic: any }) => (
  <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-100 flex items-center gap-3 mb-3 hover:shadow-md transition-shadow cursor-default">
    <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-xl shrink-0">
      {topic.icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-bold text-slate-800 text-[13px] leading-tight truncate mb-0.5">
        {topic.id}. {topic.vi}
      </div>
      <div className="text-slate-500 text-[11px] truncate">{topic.en}</div>
    </div>
    <div className="text-[11px] font-bold text-slate-500 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md shrink-0">
      {topic.count} từ
    </div>
  </div>
);

export default function ChallengeLandingPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Course',
        '@id': 'https://challenge.lingopro.online/#course',
        name: 'Thử Thách Tiếng Anh 180 Ngày - Kiên Trì Mỗi Ngày, Hoàn Tiền 100%',
        description:
          'Chương trình rèn luyện thói quen học 3000 từ vựng tiếng Anh mỗi ngày theo phương pháp Spaced Repetition, cam kết hoàn tiền 100% khi hoàn thành mục tiêu.',
        provider: {
          '@type': 'Organization',
          name: 'LingoPro',
          url: 'https://lingopro.online',
        },
        offers: [
          {
            '@type': 'Offer',
            name: 'Gói Thử Thách 3 Tháng (90 Ngày)',
            price: '300000',
            priceCurrency: 'VND',
            url: 'https://challenge.lingopro.online/#pricing',
            availability: 'https://schema.org/InStock',
          },
          {
            '@type': 'Offer',
            name: 'Gói Thử Thách 6 Tháng (180 Ngày)',
            price: '500000',
            priceCurrency: 'VND',
            url: 'https://challenge.lingopro.online/#pricing',
            availability: 'https://schema.org/InStock',
          },
        ],
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          courseWorkload: 'PT15M',
        },
      },
      {
        '@type': 'Product',
        '@id': 'https://challenge.lingopro.online/#product',
        name: 'LingoPro Challenge - Thử Thách Tiếng Anh 180 Ngày',
        description:
          'Thử thách cam kết học tiếng Anh mỗi ngày 15 phút, chinh phục 3.000 từ vựng cốt lõi, hoàn tiền 100% khi hoàn thành.',
        image: 'https://challenge.lingopro.online/badges/tier-elite-showcase.jpg',
        url: 'https://challenge.lingopro.online',
        brand: {
          '@type': 'Brand',
          name: 'LingoPro',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: '4.9',
          bestRating: '5',
          worstRating: '1',
          ratingCount: '1250',
        },
        offers: {
          '@type': 'AggregateOffer',
          priceCurrency: 'VND',
          lowPrice: '300000',
          highPrice: '500000',
          offerCount: '2',
          offers: [
            {
              '@type': 'Offer',
              name: 'Gói Thử Thách 3 Tháng (90 Ngày)',
              price: '300000',
              priceCurrency: 'VND',
              url: 'https://challenge.lingopro.online/#pricing',
              availability: 'https://schema.org/InStock',
              priceValidUntil: '2026-12-31',
            },
            {
              '@type': 'Offer',
              name: 'Gói Thử Thách 6 Tháng (180 Ngày)',
              price: '500000',
              priceCurrency: 'VND',
              url: 'https://challenge.lingopro.online/#pricing',
              availability: 'https://schema.org/InStock',
              priceValidUntil: '2026-12-31',
            },
          ],
        },
      },
      {
        '@type': 'FAQPage',
        '@id': 'https://challenge.lingopro.online/#faq',
        mainEntity: challengeFaqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <ChallengeInteractiveWrapper>
      {/* Inject Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-amber-100 selection:text-amber-900">
        {/* 1. HERO SECTION */}
        <section className="relative pt-24 pb-20 lg:pt-32 lg:pb-28 overflow-hidden px-4 sm:px-6 lg:px-8 bg-slate-950">
          <div className="absolute inset-0 z-0">
            {/* Top-Right angled image */}
            <div
              className="absolute inset-0 w-full h-full"
              style={{ clipPath: 'polygon(100% 0, 0 0, 100% 100%)' }}
            >
              <img
                src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
                alt="Thành tích, đỗ đạt"
                className="w-full h-full object-cover blur-[2px] opacity-25 scale-105"
              />
            </div>

            {/* Bottom-Left angled image */}
            <div
              className="absolute inset-0 w-full h-full"
              style={{ clipPath: 'polygon(0 0, 0 100%, 100% 100%)' }}
            >
              <img
                src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop"
                alt="Bàn học từ trên xuống"
                className="w-full h-full object-cover blur-[2px] opacity-20 scale-105"
              />
            </div>

            {/* Diagonal line */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <svg className="absolute w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <line x1="0" y1="0" x2="100" y2="100" stroke="rgba(245,158,11,0.2)" strokeWidth="0.3" />
              </svg>
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950 z-10"></div>
          </div>

          <div className="max-w-5xl mx-auto text-center relative z-10">
            {/* Top Rating & Status Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs tracking-wider uppercase">
                <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Khai giảng đợt này: Bắt đầu học 00:00 ngày mai</span>
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-amber-400 text-xs font-bold shadow-xs">
                <div className="flex text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </div>
                <span className="text-white ml-1 font-semibold">4.9/5</span>
                <span className="text-slate-400 text-[11px]">(1.250+ học viên)</span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.1]">
              Kiên Trì Mỗi Ngày.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-orange-500">
                Bứt Phá Tiếng Anh.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Thử thách 90 - 180 ngày giúp bạn rèn luyện phản xạ học 15 phút mỗi ngày qua{' '}
              <strong className="text-white">cơ chế cam kết hoàn cọc</strong>. Làm chủ 3.000 từ vựng cốt
              lõi, hoàn thành 100% lộ trình{' '}
              <span className="text-amber-400 font-black underline decoration-amber-400/60">
                NHẬN LẠI 100% TIỀN THAM GIA
              </span>{' '}
              + Tặng thêm tài khoản Pro cao cấp!
            </p>

            {/* Dual CTAs: Pay or Free Lead Magnet */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#pricing">
                <Button
                  size="lg"
                  className="h-14 px-8 sm:px-10 text-base sm:text-lg font-black bg-gradient-to-r from-amber-500 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-full shadow-lg shadow-orange-950/60 transition-all hover:-translate-y-1 border-0 uppercase tracking-wide cursor-pointer"
                >
                  Tham gia thử thách <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>

              <button
                data-trigger="lead-modal"
                className="h-14 px-8 text-base sm:text-lg font-bold rounded-full border-2 border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 backdrop-blur-sm transition-all flex items-center gap-2 cursor-pointer"
              >
                <Gift className="w-5 h-5 text-amber-400" />
                <span>Nhận Sổ Tay 3000 Từ (0đ)</span>
              </button>
            </div>

            {/* Trust Highlights Strip */}
            <div className="mt-12 pt-8 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Hoàn tiền 100% qua STK/MoMo</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Clock className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Chỉ 15 phút tập trung mỗi ngày</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Award className="w-5 h-5 text-blue-400 shrink-0" />
                <span>Tặng thêm 6 - 12 tháng Pro</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-300">
                <Users className="w-5 h-5 text-purple-400 shrink-0" />
                <span>12.000+ sinh viên toàn quốc</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. PAIN POINTS & SOLUTION */}
        <section className="py-16 bg-white relative -mt-6 rounded-t-[36px] z-20 shadow-md">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Nỗi đau */}
              <div>
                <div className="inline-block bg-red-100 text-red-600 font-bold text-xs tracking-widest uppercase px-3 py-1 rounded-full mb-4">
                  Thực trạng phổ biến
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-6 leading-tight">
                  Tại sao chúng ta thường dễ nản chí và bỏ cuộc khi học từ vựng tiếng Anh?
                </h2>
                <ul className="space-y-6">
                  <li className="flex gap-4">
                    <div className="w-10 h-10 shrink-0 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shadow-xs border border-red-100">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="block text-base mb-1 text-slate-800">
                        Thiếu áp lực kỷ luật (Đầu voi đuôi chuột)
                      </strong>
                      <p className="text-slate-600 text-sm">
                        Đăng ký khoá học lúc đầy hứng khởi, nhưng bận rộn bài vở trên trường khiến bạn dễ
                        hoãn lại 1 buổi, rồi 2 buổi... và cuối cùng bỏ quên luôn.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-10 h-10 shrink-0 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shadow-xs border border-red-100">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="block text-base mb-1 text-slate-800">
                        Học trước quên sau vì thiếu chu kỳ Spaced Repetition
                      </strong>
                      <p className="text-slate-600 text-sm">
                        Cố gắng chép từ vựng kín cả trang vở nhưng hôm sau lại quên sạch. Học nhiều nhưng
                        thiếu thuật toán lặp lại đúng lúc não bộ chuẩn bị quên.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-4">
                    <div className="w-10 h-10 shrink-0 bg-red-50 rounded-xl flex items-center justify-center text-red-500 shadow-xs border border-red-100">
                      <XCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <strong className="block text-base mb-1 text-slate-800">
                        Trì hoãn liên tục: &quot;Để rảnh rồi học&quot;
                      </strong>
                      <p className="text-slate-600 text-sm">
                        Chờ đợi thời gian rảnh rỗi tuyệt đối khiến việc chuẩn bị chứng chỉ TOEIC / B1 tốt
                        nghiệp bị trễ hạn từ năm này sang năm khác.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Giải pháp */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 p-8 sm:p-10 rounded-[32px] text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="inline-block bg-indigo-500/30 text-indigo-200 font-bold text-[11px] tracking-widest uppercase px-3 py-1 rounded-full border border-indigo-400/30 mb-5">
                    Giải pháp kỷ luật từ LingoPro
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-black mb-4 leading-tight">
                    Cam Kết Học Tập – Động Lực Đến Từ Tâm Lý Loss Aversion
                  </h3>
                  <p className="text-indigo-100 text-sm sm:text-base leading-relaxed mb-6">
                    LingoPro Challenge không bán những video bài giảng tĩnh nhàm chán. Đây là một sân chơi
                    rèn luyện kỷ luật. Bằng cách dùng một khoản cọc nhỏ để ràng buộc mục tiêu, bạn sẽ có lý
                    do bắt buộc mở app mỗi ngày. Học đều đặn, bạn lấy lại 100% tiền cọc và rinh thêm tài
                    khoản Pro cao cấp!
                  </p>
                  <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-2xl backdrop-blur-sm border border-white/10">
                    <Clock className="w-6 h-6 text-amber-400 shrink-0" />
                    <span className="font-bold text-xs sm:text-sm">
                      Chỉ cần 15 phút tập trung ôn luyện từ vựng mỗi ngày trên điện thoại hoặc máy tính.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BEFORE & AFTER COMPARISON */}
        <BeforeAfterSection />

        {/* 4. ROADMAP: 3 TIERS ANIMATED */}
        <section id="roadmap" className="py-20 bg-slate-50 relative overflow-hidden border-t border-slate-200">
          <style
            dangerouslySetInnerHTML={{
              __html: `
            @keyframes scrollUp {
              0% { transform: translateY(0); }
              100% { transform: translateY(-50%); }
            }
            @keyframes scrollDown {
              0% { transform: translateY(-50%); }
              100% { transform: translateY(0); }
            }
            .animate-scroll-up {
              animation: scrollUp 30s linear infinite;
            }
            .animate-scroll-down {
              animation: scrollDown 30s linear infinite;
            }
            .animate-scroll-up:hover, .animate-scroll-down:hover {
              animation-play-state: paused;
            }
          `,
            }}
          />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12">
              <span className="text-indigo-600 font-bold text-xs tracking-widest uppercase mb-2 block">
                Lộ trình từ vựng thực chiến
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">
                Đọc Hiểu &gt;80% Nội Dung Tiếng Anh<br />
                Với Lộ Trình{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                  3.000 Từ Vựng Trọng Tâm
                </span>
              </h2>
              <p className="text-base text-slate-600 max-w-2xl mx-auto">
                Hệ thống phân chia 3.000 từ vựng tần suất cao thành 3 chặng đột phá. Bạn sẽ vượt qua 34 chủ
                đề thực tế bám sát chuẩn ETS TOEIC và giao tiếp quốc tế.
              </p>
            </div>

            <div className="bg-slate-100/60 p-3 rounded-[28px] shadow-inner border border-slate-200/80">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Headers */}
                <div className="bg-white py-3 text-center rounded-xl shadow-xs border border-slate-200 relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-indigo-500"></div>
                  <div className="font-black text-indigo-700 uppercase tracking-widest text-[12px]">
                    Chặng 1: Nền Tảng
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">9 Chủ đề • 1.000 Từ</div>
                </div>
                <div className="bg-white py-3 text-center rounded-xl shadow-xs border border-slate-200 relative overflow-hidden hidden md:block">
                  <div className="absolute top-0 inset-x-0 h-1 bg-blue-500"></div>
                  <div className="font-black text-blue-700 uppercase tracking-widest text-[12px]">
                    Chặng 2: Tăng Tốc
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">10 Chủ đề • 1.000 Từ</div>
                </div>
                <div className="bg-white py-3 text-center rounded-xl shadow-xs border border-slate-200 relative overflow-hidden hidden md:block">
                  <div className="absolute top-0 inset-x-0 h-1 bg-amber-500"></div>
                  <div className="font-black text-amber-700 uppercase tracking-widest text-[12px]">
                    Chặng 3: Bứt Phá
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">10 Chủ đề • 1.000 Từ</div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4 h-[390px] overflow-hidden relative mt-3">
                {/* Fade overlays */}
                <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-slate-100 to-transparent z-20 pointer-events-none"></div>
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-100 to-transparent z-20 pointer-events-none"></div>

                {/* Col 1 */}
                <div className="relative px-1">
                  <div className="animate-scroll-up">
                    {[...chang1, ...chang1].map((topic, i) => (
                      <TopicCard key={`c1-${i}`} topic={topic} />
                    ))}
                  </div>
                </div>

                {/* Col 2 */}
                <div className="relative px-1 hidden md:block">
                  <div className="animate-scroll-down">
                    {[...chang2, ...chang2].map((topic, i) => (
                      <TopicCard key={`c2-${i}`} topic={topic} />
                    ))}
                  </div>
                </div>

                {/* Col 3 */}
                <div className="relative px-1 hidden md:block">
                  <div className="animate-scroll-up" style={{ animationDuration: '35s' }}>
                    {[...chang3, ...chang3].map((topic, i) => (
                      <TopicCard key={`c3-${i}`} topic={topic} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. MECHANISM & DEGRADING REWARD */}
        <section id="mechanism" className="py-24 bg-white border-y border-slate-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-950 rounded-[36px] p-8 md:p-14 relative overflow-hidden shadow-2xl">
              <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>

              <div className="grid md:grid-cols-2 gap-12 items-center relative z-10">
                <div>
                  <span className="text-amber-400 font-bold text-xs tracking-widest uppercase mb-3 block">
                    Cơ chế bảo vệ quyền lợi
                  </span>
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-6 leading-tight">
                    Nếu bận thi học kỳ, lỡ quên 1 ngày thì sao?
                  </h2>
                  <p className="text-slate-300 mb-8 leading-relaxed text-sm sm:text-base">
                    Chúng tôi hiểu sinh viên và người đi làm sẽ có những ngày bất khả kháng. Vì vậy, hệ thống
                    trang bị tính năng <strong>Quyền Hồi Phục Chuỗi</strong>:
                  </p>
                  <ul className="space-y-5">
                    <li className="flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                        <TrendingDown className="w-6 h-6 text-amber-400" />
                      </div>
                      <div>
                        <strong className="block text-lg text-amber-400 mb-1">
                          Thưởng giảm nhẹ theo nấc
                        </strong>
                        <span className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                          Mỗi ngày bạn quên học, số tiền hoàn và quyền lợi bonus chỉ bị giảm nhẹ một chút.
                          Bạn không bị mất trắng tiền cọc ngay lập tức!
                        </span>
                      </div>
                    </li>
                    <li className="flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                        <RefreshCcw className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <strong className="block text-lg text-blue-400 mb-1">
                          3 - 6 Lần Hồi Phục Cứu Cánh
                        </strong>
                        <span className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                          Gói 3 Tháng được nghỉ tối đa 3 lần, Gói 6 Tháng được tối đa 6 lần. Chỉ khi bạn bỏ
                          quên vượt quá số lần cho phép thì thử thách mới dừng lại.
                        </span>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-900/80 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-inner">
                  <h3 className="text-sm font-black mb-5 text-center text-white uppercase tracking-wider">
                    Minh hoạ Cơ chế Gói 3 Tháng (Cọc 300k)
                  </h3>
                  <div className="space-y-3 font-medium text-xs sm:text-sm">
                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-950 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                      <span className="text-white font-bold">0 lần quên</span>
                      <span className="text-emerald-400 font-black">Hoàn 100% (300k) + 6 Tháng Pro</span>
                    </div>
                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">1 lần quên</span>
                      <span className="text-slate-300">Hoàn ~200k + 5 Tháng Pro</span>
                    </div>
                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-slate-400">2 lần quên</span>
                      <span className="text-slate-300">Hoàn ~100k + 4 Tháng Pro</span>
                    </div>
                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-950/60 border border-amber-500/30">
                      <span className="text-amber-500">3 lần quên</span>
                      <span className="text-amber-400">Hoàn 0k + 3 Tháng Pro (Bảo lưu)</span>
                    </div>
                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 mt-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-red-500/10 animate-pulse"></div>
                      <span className="text-red-400 relative z-10 font-bold">Quên 4 lần</span>
                      <span className="text-red-400 font-black tracking-wider relative z-10">
                        Dừng thử thách (Mất cọc)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. GUARANTEE SEAL & TRUST BADGES */}
        <GuaranteeSeal />

        {/* 7. WALL OF COMMITMENT (Real Social Proof) */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold mb-4 border border-emerald-200 shadow-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Live: Hàng chục học viên vừa bắt đầu thử thách hôm nay
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-4 text-slate-900">
                Lời Nhắn Gửi Bản Thân Của 90 - 180 Ngày Sau
              </h2>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
                Khi bắt đầu thử thách, mỗi học viên đều viết một lời cam kết gửi bản thân ngày về đích. Hãy
                cùng xem các bạn sinh viên đã nói gì:
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white p-7 rounded-[28px] border border-slate-200 shadow-xs hover:-translate-y-1.5 transition-transform duration-300">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center font-black text-indigo-700 text-lg border-2 border-white shadow-xs">
                    T
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-base">Trần Tùng</p>
                    <p className="text-[11px] text-indigo-600 font-bold bg-indigo-50 inline-block px-2 py-0.5 rounded-md mt-0.5">
                      ĐH Bách Khoa • Gói 6 Tháng
                    </p>
                  </div>
                </div>
                <div className="relative bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <MessageSquareQuote className="absolute -top-3 -right-2 w-7 h-7 text-indigo-200 bg-white rounded-full" />
                  <p className="italic text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                    &quot;Gửi Tùng của 6 tháng sau. Mình hy vọng lúc đó đọc tài liệu chuyên ngành sẽ không
                    còn phải dùng Google Dịch liên tục nữa. Phải cố gắng lấy lại 500k tiền tiết kiệm nha!&quot;
                  </p>
                </div>
              </div>

              <div className="bg-white p-7 rounded-[28px] border border-slate-200 shadow-xs hover:-translate-y-1.5 transition-transform duration-300">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center font-black text-amber-700 text-lg border-2 border-white shadow-xs">
                    H
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-base">Hoàng Phương</p>
                    <p className="text-[11px] text-amber-600 font-bold bg-amber-50 inline-block px-2 py-0.5 rounded-md mt-0.5">
                      ĐH Ngoại Thương • Gói 3 Tháng
                    </p>
                  </div>
                </div>
                <div className="relative bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <MessageSquareQuote className="absolute -top-3 -right-2 w-7 h-7 text-amber-200 bg-white rounded-full" />
                  <p className="italic text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                    &quot;Sắp thi cuối kỳ rồi mà tiếng Anh vẫn dở. Đăng ký để tự tạo áp lực học mỗi ngày. Mong
                    3 tháng nữa đạt chuẩn đầu ra B1 để kịp xét tốt nghiệp. Cố lên!!&quot;
                  </p>
                </div>
              </div>

              <div className="bg-white p-7 rounded-[28px] border border-slate-200 shadow-xs hover:-translate-y-1.5 transition-transform duration-300">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center font-black text-emerald-700 text-lg border-2 border-white shadow-xs">
                    N
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-base">Nguyễn Anh L.</p>
                    <p className="text-[11px] text-emerald-600 font-bold bg-emerald-50 inline-block px-2 py-0.5 rounded-md mt-0.5">
                      ĐH Kinh Tế Quốc Dân • Gói 6 Tháng
                    </p>
                  </div>
                </div>
                <div className="relative bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <MessageSquareQuote className="absolute -top-3 -right-2 w-7 h-7 text-emerald-200 bg-white rounded-full" />
                  <p className="italic text-slate-600 text-xs sm:text-sm leading-relaxed font-medium">
                    &quot;Chào các bạn! Năm nhất đại học rồi, mình quyết tâm học từ vựng bài bản để thi TOEIC
                    sớm. Cố gắng duy trì 180 ngày để được hoàn học phí và rinh tài khoản Pro nhé!&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. LEAD MAGNET ON-PAGE SECTION (0Đ GIFTS) */}
        <LeadMagnetSection />

        {/* 9. PRICING */}
        <section id="pricing" className="py-24 bg-white relative border-t border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <span className="text-amber-600 font-bold text-xs uppercase tracking-widest px-3 py-1 rounded-full bg-amber-50 border border-amber-200 inline-block mb-3">
                Gói Cam Kết Rèn Luyện
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4 text-slate-900">
                Chọn Chặng Đường Cam Kết Của Bạn
              </h2>
              <p className="text-slate-600 text-base max-w-xl mx-auto">
                Chi phí thực tế = 0 đồng khi bạn hoàn thành lộ trình. Chọn gói phù hợp với mục tiêu ngay
                dưới đây:
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
              {/* Tier 1: 3 Months */}
              <Card className="relative overflow-visible border border-slate-200 hover:border-indigo-400 transition-all shadow-lg hover:shadow-xl bg-white flex flex-col rounded-[32px]">
                <CardHeader className="text-center border-b border-slate-100 pb-8 pt-10">
                  <CardTitle className="text-2xl font-black text-slate-900 mb-1">
                    Chặng Khởi Động
                  </CardTitle>
                  <CardDescription className="text-base font-semibold text-slate-500">
                    Thử thách 3 Tháng (90 Ngày)
                  </CardDescription>
                  <div className="mt-6 flex justify-center items-baseline gap-1">
                    <span className="text-5xl sm:text-6xl font-black text-slate-900 tracking-tight">
                      300k
                    </span>
                    <span className="text-slate-500 font-bold text-base">VNĐ cọc</span>
                  </div>
                  <div className="text-xs text-emerald-600 font-bold mt-2">
                    ✓ Hoàn 100% khi duy trì kỷ luật
                  </div>
                </CardHeader>
                <CardContent className="pt-8 flex-1 px-8">
                  <ul className="space-y-4">
                    <li className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium text-sm sm:text-base">
                        Cam kết học liên tục <strong>90 ngày</strong>
                      </span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <RefreshCcw className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium text-sm sm:text-base">
                        <strong>3 quyền</strong> hồi phục ngày bận rộn
                      </span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <BookOpen className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium text-sm sm:text-base">
                        Chinh phục <strong>1.500 từ vựng</strong> trọng tâm
                      </span>
                    </li>
                    <li className="flex gap-3 items-start font-bold text-emerald-700 bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 mt-3">
                      <Award className="w-5 h-5 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">
                        Thưởng: Hoàn 100% (300.000đ) + Tặng 6 Tháng Pro (Trị giá 400k)
                      </span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="pb-10 pt-4 px-8">
                  <Link href="/login?callbackUrl=/challenge" className="w-full">
                    <Button className="w-full h-14 text-base font-black bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg transition-transform hover:-translate-y-0.5 uppercase tracking-wide cursor-pointer">
                      Đăng ký gói 3 Tháng
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Tier 2: 6 Months (Recommended) */}
              <Card className="relative overflow-visible border-2 border-amber-400 shadow-[0_20px_50px_rgba(245,158,11,0.15)] bg-white flex flex-col transform md:-translate-y-4 rounded-[32px]">
                <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-r from-amber-400 to-orange-500 rounded-t-[30px]" />
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-black px-5 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                  ★ Khuyên Dùng Cho Sinh Viên
                </div>
                <CardHeader className="text-center border-b border-slate-100 pb-8 pt-10">
                  <CardTitle className="text-2xl font-black text-slate-900 mb-1">
                    Chặng Tăng Tốc
                  </CardTitle>
                  <CardDescription className="text-base font-bold text-amber-700">
                    Thử thách 6 Tháng (180 Ngày)
                  </CardDescription>
                  <div className="mt-6 flex justify-center items-baseline gap-1">
                    <span className="text-5xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-amber-500 to-orange-600 tracking-tight">
                      500k
                    </span>
                    <span className="text-slate-500 font-bold text-base">VNĐ cọc</span>
                  </div>
                  <div className="text-xs text-emerald-600 font-bold mt-2">
                    ✓ Hoàn 100% khi duy trì kỷ luật
                  </div>
                </CardHeader>
                <CardContent className="pt-8 flex-1 px-8">
                  <ul className="space-y-4">
                    <li className="flex gap-3 items-start">
                      <CheckCircle2 className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium text-sm sm:text-base">
                        Cam kết học liên tục <strong>180 ngày</strong>
                      </span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <RefreshCcw className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium text-sm sm:text-base">
                        <strong>6 quyền</strong> hồi phục ngày bận rộn
                      </span>
                    </li>
                    <li className="flex gap-3 items-start">
                      <BookOpen className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-medium text-sm sm:text-base">
                        Làm chủ trọn vẹn <strong>3.000 từ vựng</strong>
                      </span>
                    </li>
                    <li className="flex gap-3 items-start font-bold text-emerald-700 bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-100 mt-3">
                      <Award className="w-5 h-5 shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm">
                        Thưởng: Hoàn 100% (500.000đ) + Tặng 1 Năm Pro (Trị giá 800k)
                      </span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter className="pb-10 pt-4 px-8">
                  <Link href="/login?callbackUrl=/challenge" className="w-full">
                    <Button className="w-full h-14 text-base font-black bg-gradient-to-r from-amber-500 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white rounded-2xl shadow-lg shadow-orange-950/40 transition-transform hover:-translate-y-0.5 uppercase tracking-wide cursor-pointer">
                      Đăng ký gói 6 Tháng
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>

        {/* 10. FAQ ACCORDION */}
        <FaqAccordion />

        {/* 11. FOOTER MINIMAL */}
        <footer className="bg-slate-950 py-16 text-center text-slate-400 border-t border-slate-900 pb-28 md:pb-16">
          <div className="max-w-7xl mx-auto px-4 flex flex-col items-center">
            <div className="font-black text-2xl sm:text-3xl text-white mb-3 tracking-tight">
              LingoPro Challenge
            </div>
            <p className="mb-6 text-slate-500 text-sm max-w-md">
              Học tiếng Anh mỗi ngày, tự tin vươn xa với thói quen tự học bền vững.
            </p>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-8 mb-8 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <Link href="/" className="hover:text-white transition-colors">
                Trang chủ LingoPro
              </Link>
              <button
                data-trigger="lead-modal"
                className="hover:text-amber-400 text-amber-300 font-bold transition-colors cursor-pointer"
              >
                Nhận Sổ Tay 0đ
              </button>
              <Link href="/terms" className="hover:text-white transition-colors">
                Điều khoản cam kết
              </Link>
              <a
                href="https://zalo.me"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Zalo Hỗ Trợ
              </a>
            </div>
            <p className="text-xs text-slate-600">
              © 2026 LingoPro Inc. All rights reserved. Nền tảng học tiếng Anh chuẩn Spaced Repetition.
            </p>
          </div>
        </footer>
      </div>
    </ChallengeInteractiveWrapper>
  );
}
