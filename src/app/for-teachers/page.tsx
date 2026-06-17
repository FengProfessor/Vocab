import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Brain,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  GraduationCap,
  Layers3,
  LineChart,
  MessageCircle,
  MessageSquareText,
  School,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  UserRoundCheck,
  Users,
  WandSparkles,
  X,
  Zap,
} from 'lucide-react';
import {
  AudienceTabs,
  CenterLeadForm,
  FaqAccordion,
  PilotLink,
  TeacherLandingTracker,
  ZaloButton,
} from '@/components/marketing/TeacherPilotClient';

export const metadata: Metadata = {
  title: 'LingoPro cho Giáo viên & Trung tâm',
  description:
    'Quản lý lớp học tiếng Anh, giao bài, theo dõi tiến độ và phát hiện học sinh cần hỗ trợ bằng AI và FSRS. Giảm 2-4 giờ soạn bài và chấm điểm mỗi tuần.',
  keywords: ['phần mềm quản lý lớp học tiếng Anh','app học từ vựng cho học sinh','dashboard giáo viên tiếng Anh','FSRS','học từ vựng AI'],
  openGraph: {
    title: 'LingoPro cho Giáo viên & Trung tâm',
    description: 'Quản lý lớp học tiếng Anh, giao bài, theo dõi tiến độ và phát hiện học sinh cần hỗ trợ bằng AI và FSRS.',
    type: 'website',
  }
};

const outcomes = [
  {
    icon: Clock3,
    line1: 'Tiết kiệm 2–4 giờ/tuần',
    line2: 'soạn bài, chấm và nhắc ôn thủ công',
  },
  {
    icon: Target,
    line1: '1 dashboard',
    line2: 'nắm tiến độ, độ chính xác và từ khó của cả lớp',
  },
  {
    icon: UserRoundCheck,
    line1: 'Nhắc ôn tự động',
    line2: 'mỗi học sinh có lịch ghi nhớ riêng theo FSRS',
  },
];

const comparison = [
  { label: 'Theo dõi tiến độ từng học sinh', lingo: true, old: false },
  { label: 'Nhắc ôn cá nhân hóa tự động', lingo: true, old: false },
  { label: 'Phát hiện từ khó và lỗi phổ biến', lingo: true, old: false },
  { label: 'Giao bài theo vấn đề của lớp', lingo: true, old: false },
  { label: 'Một nơi cho từ vựng và ngữ pháp', lingo: true, old: false },
];

const workflow = [
  {
    number: '01',
    title: 'Tạo lớp và mời học sinh',
    description: 'Gửi một mã lớp. Học sinh tham gia trong vài giây, không cần cài đặt phức tạp.',
  },
  {
    number: '02',
    title: 'Giao nội dung cần học',
    description: 'Tạo danh sách từ, giao bài ngữ pháp và duyệt nội dung học sinh tự thêm.',
  },
  {
    number: '03',
    title: 'Theo dõi và can thiệp',
    description: 'Xem ai đang chậm, từ nào gây khó và giao bài luyện tập đúng vấn đề.',
  },
];

const features = [
  {
    icon: CircleGauge,
    title: 'Dashboard tiến độ lớp',
    description: 'Theo dõi số học sinh hoạt động, độ chính xác, lượng từ đã học và bài cần ôn.',
  },
  {
    icon: Brain,
    title: 'Ôn tập cá nhân hóa FSRS',
    description: 'Mỗi học sinh có lịch ôn riêng, giúp giáo viên không phải tự nhắc từng em.',
  },
  {
    icon: WandSparkles,
    title: 'AI hỗ trợ tạo nội dung',
    description: 'Làm giàu từ vựng, tạo ví dụ, bài luyện ngữ pháp và phân tích lỗi học tập.',
  },
  {
    icon: BookOpenCheck,
    title: 'Giao bài và duyệt từ',
    description: 'Quản lý nội dung theo lớp, duyệt từ học sinh thêm và giao drill theo lỗi.',
  },
  {
    icon: LineChart,
    title: 'Phát hiện học sinh cần hỗ trợ',
    description: 'Nhìn thấy nhóm học sinh đang hụt nhịp trước khi kết quả kiểm tra giảm.',
  },
  {
    icon: MessageSquareText,
    title: 'Từ vựng, ngữ pháp, phát âm',
    description: 'Một luồng học thống nhất thay vì ghép nhiều công cụ và bảng tính rời rạc.',
  },
];

const plans = [
  {
    key: 'tutor',
    name: 'Gia sư',
    audience: 'Dạy 1:1 hoặc nhóm nhỏ',
    price: '299.000đ',
    unit: '/ tháng',
    note: 'Ưu đãi early-access',
    icon: GraduationCap,
    featured: false,
    features: ['Tối đa 3 lớp', 'Tối đa 30 học sinh', 'Dashboard tiến độ', 'Giao từ vựng và ngữ pháp', 'AI coaching insight', 'Trả năm: tặng 2 tháng'],
  },
  {
    key: 'teacher_pro',
    name: 'Giáo viên Pro',
    audience: 'Giáo viên có nhiều lớp',
    price: '599.000đ',
    unit: '/ tháng',
    note: 'Phù hợp nhất',
    icon: Users,
    featured: true,
    features: ['Tối đa 10 lớp', 'Tối đa 150 học sinh', 'Toàn bộ tính năng Gia sư', 'Phân tích nâng cao theo lớp', 'Hỗ trợ ưu tiên', 'Trả năm: tặng 2 tháng', 'Hoàn tiền 30 ngày'],
  },
  {
    key: 'center',
    name: 'Trung tâm',
    audience: 'Nhiều giáo viên, cần triển khai chung',
    price: 'Báo giá',
    unit: '',
    note: 'Báo giá theo quy mô',
    icon: School,
    featured: false,
    features: ['Từ 10 tài khoản giáo viên', 'Từ 500 học sinh', 'Onboarding đội ngũ', 'Báo cáo vận hành', 'Hỗ trợ triển khai riêng'],
  },
];

export default function ForTeachersPage() {
  return (
    <div className="min-h-dvh overflow-hidden bg-[#f7f8f2] text-[#17231d]">
      <TeacherLandingTracker />
      
      {/* 1. Header sticky */}
      <header className="sticky top-0 z-50 border-b border-[#17231d]/10 bg-[#f7f8f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5 font-black tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-xl bg-[#17231d] text-[#d7ff64]">
              <Brain className="size-5" />
            </span>
            LingoPro
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#526057] md:flex">
            <a href="#giai-phap" className="transition-colors hover:text-[#17231d]">Giải pháp</a>
            <a href="#tinh-nang" className="transition-colors hover:text-[#17231d]">Tính năng</a>
            <a href="#demo" className="transition-colors hover:text-[#17231d]">Demo</a>
            <a href="#bang-gia" className="transition-colors hover:text-[#17231d]">Bảng giá</a>
            <a href="#faq" className="transition-colors hover:text-[#17231d]">FAQ</a>
          </nav>
          <PilotLink
            plan="teacher_pro"
            placement="header"
            href="/auth?mode=signup&role=teacher&pilot=teacher_pro"
            className="inline-flex items-center gap-2 rounded-full bg-[#17231d] px-4 py-2.5 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
          >
            Tạo lớp miễn phí <ArrowRight className="size-4" />
          </PilotLink>
        </div>
      </header>

      <main>
        {/* 2. Hero + AudienceTabs */}
        <section className="relative px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
          <div className="pointer-events-none absolute -right-32 top-0 size-[32rem] rounded-full bg-[#d7ff64]/35 blur-3xl" />
          <div className="pointer-events-none absolute -left-48 bottom-0 size-96 rounded-full bg-[#74cbb2]/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl items-start gap-14 lg:grid-cols-[1.08fr_0.92fr]">
            <AudienceTabs />
            <div className="relative mx-auto hidden w-full max-w-xl lg:block">
              <div className="absolute -inset-5 rotate-3 rounded-[2rem] bg-[#d7ff64]" />
              <div className="relative rounded-[2rem] border border-[#17231d]/10 bg-[#17231d] p-5 text-white shadow-2xl sm:p-7">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9caaa1]">Lớp IELTS 7.0</p>
                    <p className="mt-1 text-xl font-black">Tổng quan tuần này</p>
                  </div>
                  <div className="rounded-xl bg-[#d7ff64] p-2 text-[#17231d]"><BarChart3 className="size-5" /></div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[['24', 'Học sinh'], ['86%', 'Chính xác'], ['142', 'Lượt ôn']].map(([value, label]) => (
                    <div key={label} className="rounded-2xl bg-white/[0.07] p-3">
                      <p className="text-2xl font-black text-[#d7ff64]">{value}</p>
                      <p className="mt-1 text-xs font-semibold text-[#9caaa1]">{label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl bg-white/[0.07] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="font-bold">Cần hỗ trợ hôm nay</p>
                    <span className="rounded-full bg-[#ff8069]/15 px-2.5 py-1 text-xs font-bold text-[#ff9c89]">3 học sinh</span>
                  </div>
                  <div className="space-y-3">
                    {[['Minh Anh', 'Cụm động từ', '62%'], ['Gia Huy', 'Thì hoàn thành', '68%'], ['Thảo Vy', 'Từ học thuật', '71%']].map(([name, topic, score]) => (
                      <div key={name} className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full bg-[#d7ff64]/15 text-xs font-black text-[#d7ff64]">{name.slice(0, 1)}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold">{name}</p>
                          <p className="truncate text-xs text-[#9caaa1]">{topic}</p>
                        </div>
                        <span className="text-sm font-black text-[#ff9c89]">{score}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[#d7ff64] p-4 text-[#17231d]">
                  <Zap className="size-5 shrink-0" />
                  <p className="text-sm font-bold">AI đề xuất giao drill “phrasal verbs” cho 8 học sinh.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Dải kết quả */}
        <section className="border-y border-[#17231d]/10 bg-white/70 px-4 py-10 sm:px-6">
          <div className="mx-auto grid max-w-7xl gap-7 md:grid-cols-3">
            {outcomes.map((item) => (
              <div key={item.line1} className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#d7ff64]/60">
                  <item.icon className="size-5" />
                </span>
                <div>
                  <p className="text-xl font-black">{item.line1}</p>
                  <p className="mt-1 text-sm font-medium leading-6 text-[#657269]">{item.line2}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. So sánh */}
        <section className="bg-[#17231d] px-4 py-24 text-white sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-12 lg:grid-cols-2">
                <div>
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#d7ff64]">So sánh cách làm</p>
                    <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Gom Sheet, Quizlet, Zalo vào một luồng.</h2>
                    <p className="mt-6 max-w-xl font-medium leading-8 text-[#aab5ae]">
                        LingoPro là lớp học tập (learning layer) — bổ sung cho phần mềm quản lý/điểm danh trung tâm đang dùng, không thay thế.
                    </p>
                </div>
                <div className="overflow-hidden rounded-3xl border border-white/10">
                  <div className="grid grid-cols-[1fr_80px_80px] border-b border-white/10 bg-white/[0.06] px-4 py-3 text-xs font-black uppercase tracking-wider text-[#aab5ae]">
                    <span>Khả năng</span><span>LingoPro</span><span className="truncate">Sheet...</span>
                  </div>
                  {comparison.map((item) => (
                    <div key={item.label} className="grid grid-cols-[1fr_80px_80px] items-center border-b border-white/10 px-4 py-4 last:border-0">
                      <span className="pr-3 text-sm font-semibold">{item.label}</span>
                      <span className="flex justify-center">{item.lingo ? <Check className="size-5 text-[#d7ff64]" /> : <X className="size-5 text-[#ff9c89]" />}</span>
                      <span className="flex justify-center">{item.old ? <Check className="size-5 text-[#d7ff64]" /> : <X className="size-5 text-[#77837b]" />}</span>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </section>
        
        {/* 5. Quy trình 3 bước */}
        <section id="giai-phap" className="px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#567600]">Quy trình đơn giản</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.04em] sm:text-5xl">Từ tạo lớp đến quyết định can thiệp trong ba bước.</h2>
          </div>
          <div className="mx-auto mt-12 grid max-w-7xl gap-5 lg:grid-cols-3">
            {workflow.map((item) => (
              <div key={item.number} className="group rounded-[1.75rem] border border-[#17231d]/10 bg-white p-7 transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-5xl font-black tracking-[-0.08em] text-[#c8d0ca]">{item.number}</span>
                  <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
                </div>
                <h3 className="mt-10 text-xl font-black">{item.title}</h3>
                <p className="mt-3 text-sm font-medium leading-7 text-[#657269]">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Lưới tính năng */}
        <section id="tinh-nang" className="border-t border-[#17231d]/10 px-4 py-24 sm:px-6">
            <div className="mx-auto max-w-7xl">
                <div className="max-w-3xl">
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#567600]">Đủ sâu để hành động</p>
                    <h2 className="mt-4 text-4xl font-black tracking-[-0.04em]">Không chỉ báo cáo. LingoPro chỉ ra việc cần làm tiếp theo.</h2>
                    <p className="mt-5 font-medium leading-8 text-[#657269]">
                    Mỗi tính năng đều phục vụ một quyết định thực tế: dạy gì, giao gì và hỗ trợ ai trước.
                    </p>
                </div>
                <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature) => (
                    <div key={feature.title} className="rounded-3xl border border-[#17231d]/10 bg-white p-6">
                        <span className="flex size-11 items-center justify-center rounded-2xl bg-[#17231d] text-[#d7ff64]">
                        <feature.icon className="size-5" />
                        </span>
                        <h3 className="mt-5 text-lg font-black">{feature.title}</h3>
                        <p className="mt-2 text-sm font-medium leading-6 text-[#657269]">{feature.description}</p>
                    </div>
                    ))}
                </div>
            </div>
        </section>
        
        {/* 6.5 Demo video — quy trình giáo viên (+ video phụ so sánh app) */}
        <section id="demo" className="bg-[#17231d] px-4 py-24 text-white sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#d7ff64]/15 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#d7ff64]">
                <Sparkles className="size-4" /> Demo · quy trình giáo viên
              </div>
              <h2 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Quy trình của giáo viên — trong 5 bước.
              </h2>
              <p className="mt-5 font-medium leading-8 text-[#aab5ae]">
                Tạo lớp, mời học sinh, giao bài, theo dõi tiến độ và biết chính xác ai cần hỗ trợ — xem toàn bộ trong 30 giây.
              </p>
            </div>
            <div className="relative mx-auto mt-10 max-w-4xl">
              <div className="absolute -inset-4 rotate-1 rounded-[2rem] bg-[#d7ff64]/20 blur-2xl" />
              <video
                className="relative w-full rounded-[1.5rem] border border-white/10 shadow-2xl"
                controls
                playsInline
                preload="none"
                poster="/lingopro-teacher-flow-poster.jpg"
              >
                <source src="/lingopro-teacher-flow.mp4" type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ video.
              </video>
            </div>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-sm font-bold text-[#aab5ae]">
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-[#d7ff64]" /> Tạo lớp &amp; mời học sinh</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-[#d7ff64]" /> Giao từ vựng + ngữ pháp</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-[#d7ff64]" /> Dashboard tiến độ realtime</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-[#d7ff64]" /> 3 kiểu HS: đều đặn · lười · nhồi nhét</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="size-4 text-[#d7ff64]" /> Phát hiện HS tụt + AI giao drill</span>
            </div>

            {/* Video phụ: so sánh với app khác */}
            <div className="mx-auto mt-16 max-w-2xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#74cbb2]">Còn so với app khác?</p>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.02em]">LingoPro vs Anki · Quizlet · Duolingo</h3>
              <div className="relative mt-6">
                <video
                  className="relative w-full rounded-2xl border border-white/10 shadow-xl"
                  controls
                  playsInline
                  preload="none"
                  poster="/lingopro-vs-anki-poster.jpg"
                >
                  <source src="/lingopro-vs-anki.mp4" type="video/mp4" />
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Mockup sản phẩm */}
        <section className="bg-white/70 border-y border-[#17231d]/10 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">Thấy đúng những gì thầy cô và học sinh sẽ dùng.</h2>
            </div>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
                {/* Card A: Student View */}
                <div className="rounded-[2rem] border border-[#17231d]/10 bg-white p-6 shadow-lg">
                    <p className="text-center text-sm font-bold text-[#657269]">Minh họa giao diện học sinh</p>
                    <div className="mt-4 aspect-[3/4] rounded-2xl bg-[#17231d] p-4 flex flex-col justify-between">
                        <div className="text-white">
                            <p className="text-xs font-bold text-[#9caaa1]">Học từ vựng</p>
                            <p className="mt-2 text-2xl font-bold">catalyst</p>
                            <p className="text-sm text-[#9caaa1]">/ˈkæt.əl.ɪst/</p>
                        </div>
                        <div className="rounded-xl bg-white/10 p-3 text-center text-sm font-semibold text-white">Chất xúc tác</div>
                    </div>
                </div>
                {/* Card B: Teacher View */}
                <div className="rounded-[2rem] border border-[#17231d]/10 bg-white p-6 shadow-lg md:scale-105">
                    <p className="text-center text-sm font-bold text-[#657269]">Minh họa giao diện giáo viên</p>
                    <div className="mt-4 aspect-[3/4] rounded-2xl bg-[#17231d] p-4 text-white">
                        <p className="text-xs font-bold text-[#9caaa1]">Lớp IELTS 7.0</p>
                        <div className="mt-4 space-y-3">
                           <div className="rounded-xl bg-white/10 p-3">
                               <p className="text-xs font-semibold text-[#9caaa1]">Học sinh hoạt động</p>
                               <p className="text-lg font-bold text-[#d7ff64]">21/24</p>
                           </div>
                           <div className="rounded-xl bg-white/10 p-3">
                               <p className="text-xs font-semibold text-[#9caaa1]">Độ chính xác trung bình</p>
                               <p className="text-lg font-bold text-[#d7ff64]">86%</p>
                           </div>
                           <div className="rounded-xl bg-[#ff8069]/15 p-3">
                               <p className="text-xs font-semibold text-[#ff9c89]">Cần hỗ trợ</p>
                               <p className="text-lg font-bold text-white">Minh Anh, Gia Huy...</p>
                           </div>
                        </div>
                    </div>
                </div>
                {/* Card C: Grammar View */}
                <div className="rounded-[2rem] border border-[#17231d]/10 bg-white p-6 shadow-lg">
                    <p className="text-center text-sm font-bold text-[#657269]">Minh họa giao diện ngữ pháp</p>
                    <div className="mt-4 aspect-[3/4] rounded-2xl bg-[#17231d] p-4 text-white flex flex-col">
                        <p className="text-xs font-bold text-[#9caaa1]">Bài tập: Thì hoàn thành</p>
                        <div className="flex-1 mt-4 rounded-xl bg-white/10 p-3 text-sm">
                            <p className="text-[#9caaa1]">I have ____ (see) that movie before.</p>
                            <p className="mt-4 rounded-lg bg-[#d7ff64]/15 p-2 text-white">
                                <span className="font-bold text-[#d7ff64]">✓</span> seen
                            </p>
                             <p className="mt-2 rounded-lg bg-[#ff8069]/15 p-2 text-white">
                                <span className="font-bold text-[#ff9c89]">✗</span> saw
                            </p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </section>

        {/* 8. Giá trị theo vai trò */}
        <section className="px-4 py-24 sm:px-6">
            <div className="mx-auto max-w-7xl">
                <div className="grid gap-5 lg:grid-cols-3">
                    <div className="rounded-[1.75rem] border border-[#17231d]/10 bg-white p-7">
                        <h3 className="text-xl font-black">Gia sư 1:1/nhóm nhỏ</h3>
                        <p className="mt-3 text-sm font-medium leading-7 text-[#657269]">Giảm 2–4 giờ soạn & chấm mỗi tuần. Giữ học viên bằng kết quả thấy được. HS được nhắc ôn tự động để buổi học không phải ôn lại từ cũ.</p>
                    </div>
                    <div className="rounded-[1.75rem] border border-[#17231d]/10 bg-white p-7">
                        <h3 className="text-xl font-black">Giáo viên nhiều lớp</h3>
                        <p className="mt-3 text-sm font-medium leading-7 text-[#657269]">Một dashboard nắm cả lớp. Thấy ai tụt TRƯỚC khi điểm rớt. Giao drill đúng lỗi thay vì giao đại trà.</p>
                    </div>
                    <div className="rounded-[1.75rem] border border-[#17231d]/10 bg-white p-7">
                        <h3 className="text-xl font-black">Chủ trung tâm</h3>
                        <p className="mt-3 text-sm font-medium leading-7 text-[#657269]">Chuẩn hóa chất lượng nhiều giáo viên. Báo cáo tiến độ cho phụ huynh. Onboarding đội ngũ. Bổ sung learning layer cho phần mềm CRM sẵn có.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* 9. Bảng giá */}
        <section id="bang-gia" className="border-t border-[#17231d]/10 px-4 py-24 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">Giá minh bạch, hủy bất cứ lúc nào.</h2>
              <p className="mt-5 font-medium leading-7 text-[#657269]">
                Chọn gói theo quy mô lớp. Bắt đầu miễn phí, nâng cấp khi cần.
              </p>
            </div>
            <div className="mt-12 grid items-stretch gap-5 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-[2rem] border p-7 ${
                    plan.featured ? 'border-[#17231d] bg-[#17231d] text-white shadow-2xl' : 'border-[#17231d]/10 bg-white'
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-7 rounded-full bg-[#d7ff64] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#17231d]">
                      Phổ biến nhất
                    </span>
                  )}
                  <span className={`flex size-11 items-center justify-center rounded-2xl ${plan.featured ? 'bg-[#d7ff64] text-[#17231d]' : 'bg-[#d7ff64]/60'}`}>
                    <plan.icon className="size-5" />
                  </span>
                  <h3 className="mt-6 text-2xl font-black">{plan.name}</h3>
                  <p className={`mt-1 text-sm font-semibold ${plan.featured ? 'text-[#aab5ae]' : 'text-[#657269]'}`}>{plan.audience}</p>
                  <div className="mt-7">
                    <span className="text-3xl font-black tracking-[-0.04em]">{plan.price}</span>
                    {plan.unit && <span className={`ml-1 text-sm font-semibold ${plan.featured ? 'text-[#aab5ae]' : 'text-[#657269]'}`}>{plan.unit}</span>}
                  </div>
                  <p className={`mt-2 text-xs font-bold uppercase tracking-wider ${plan.featured ? 'text-[#d7ff64]' : 'text-[#567600]'}`}>{plan.note}</p>
                  <ul className="mt-7 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm font-semibold">
                        <CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${plan.featured ? 'text-[#d7ff64]' : 'text-[#567600]'}`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <PilotLink
                    plan={plan.key as 'tutor' | 'teacher_pro' | 'center'}
                    placement={`pricing_${plan.key}`}
                    href={plan.key === 'center' ? '#tu-van-trung-tam' : `/auth?mode=signup&role=teacher&pilot=${plan.key}`}
                    className={`mt-8 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-center text-sm font-black transition-transform hover:-translate-y-0.5 ${
                      plan.featured ? 'bg-[#d7ff64] text-[#17231d] shadow-[0_10px_0_#b9df4d]' : 'bg-[#17231d] text-white'
                    }`}
                  >
                    {plan.key === 'center' ? 'Đặt lịch demo' : 'Tạo lớp miễn phí'} <ArrowRight className="size-4" />
                  </PilotLink>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-sm font-semibold text-[#657269]">
                Không cần thẻ · Hoàn tiền 30 ngày · Trả năm tặng 2 tháng · Hủy bất cứ lúc nào
            </p>
          </div>
        </section>

        {/* 10. Tư vấn trung tâm + form */}
        <section id="tu-van-trung-tam" className="px-4 pb-24 sm:px-6">
          <div className="mx-auto grid max-w-7xl items-start gap-10 rounded-[2.25rem] bg-white p-6 sm:p-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-[#567600]">Dành cho trung tâm</p>
              <h2 className="mt-4 text-4xl font-black tracking-[-0.04em]">Nhận demo theo đúng quy mô vận hành.</h2>
              <p className="mt-5 font-medium leading-8 text-[#657269]">
                Gửi nhu cầu để LingoPro chuẩn bị demo dashboard, kế hoạch onboarding và mức giá phù hợp với số giáo viên, học sinh thực tế.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                 <CenterLeadForm />
                 <ZaloButton />
              </div>
            </div>
            <div className="hidden lg:block">
                 <ul className="space-y-4 text-sm font-bold">
                    {['Phản hồi trong 1 ngày làm việc', 'Không yêu cầu thanh toán trước', 'Dùng thử bằng lớp học thật trước khi chốt'].map((item) => (
                    <li key={item} className="flex items-center gap-3"><CheckCircle2 className="size-5 text-[#567600]" /> {item}</li>
                    ))}
                 </ul>
                 <div className="mt-6 rounded-2xl border border-[#17231d]/10 p-5">
                    <p className="font-bold text-[#17231d]">LingoPro bổ sung, không thay thế</p>
                    <p className="mt-2 text-sm leading-6 text-[#657269]">
                        Sản phẩm hoạt động như một lớp học tập (learning layer) bên trên phần mềm quản lý (CRM/LMS) trung tâm bạn đang dùng để điểm danh, xếp lớp.
                    </p>
                 </div>
            </div>
          </div>
        </section>

        {/* 11. FAQ */}
        <section id="faq" className="border-t border-[#17231d]/10 bg-white/70 px-4 py-24 sm:px-6">
            <div className="mx-auto max-w-4xl">
                <div className="text-center">
                    <h2 className="text-4xl font-black tracking-[-0.04em] sm:text-5xl">Câu hỏi thường gặp</h2>
                </div>
                <div className="mt-12">
                    <FaqAccordion />
                </div>
            </div>
        </section>

        {/* 12. CTA cuối */}
        <section className="px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.25rem] bg-[#17231d] p-8 sm:p-12">
            <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
              <div>
                <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-[#d7ff64]"><Layers3 className="size-5" /> Bắt đầu từ một lớp</div>
                <h2 className="mt-4 text-4xl font-black tracking-[-0.045em] text-white">Tạo lớp thật. Mời học sinh thật. Đo kết quả thật.</h2>
              </div>
              <div>
                <PilotLink plan="teacher_pro" placement="bottom_cta" href="/auth?mode=signup&role=teacher&pilot=teacher_pro" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#d7ff64] px-7 py-4 text-center font-black text-[#17231d] shadow-[0_12px_0_#b9df4d] transition-transform hover:-translate-y-1">
                  Tạo lớp ngay <ArrowRight className="size-5" />
                </PilotLink>
                <p className="mt-5 text-center text-sm font-semibold text-[#aab5ae]">Không cần thẻ · Hoàn tiền 30 ngày · Dữ liệu học sinh bảo mật</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 13. Footer */}
      <footer className="border-t border-[#17231d]/10 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm font-semibold text-[#657269] sm:flex-row">
          <Link href="/" className="flex items-center gap-2 font-black text-[#17231d]"><Brain className="size-4" /> LingoPro</Link>
          <p>AI + FSRS cho lớp học tiếng Anh tiến bộ có thể đo lường.</p>
          <Link href="/auth" className="font-black text-[#17231d]">Đăng nhập</Link>
        </div>
      </footer>
    </div>
  );
}
