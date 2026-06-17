'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { track } from '@/lib/analytics';

type PilotPlan = 'tutor' | 'teacher_pro' | 'center';
type Audience = 'tutor' | 'teacher' | 'center';

export function TeacherLandingTracker() {
  useEffect(() => {
    const source = new URLSearchParams(window.location.search).get('utm_source') ?? 'direct';
    track('teacher_landing_viewed', { source });
  }, []);
  return null;
}

export function PilotLink({
  plan,
  placement,
  href,
  className,
  children,
}: {
  plan: PilotPlan;
  placement: string;
  href:string;
  className: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() => {
        const source = new URLSearchParams(window.location.search).get('utm_source') ?? 'direct';
        sessionStorage.setItem('teacher_pilot_source', source);
        sessionStorage.setItem('teacher_pilot_plan', plan);
        track('teacher_pilot_cta_clicked', { plan, placement });
      }}
    >
      {children}
    </Link>
  );
}

const audienceContent = {
  tutor: {
    badge: 'Cho gia sư 1:1 & nhóm nhỏ',
    lead: 'Dạy sát từng em.',
    accent: 'Không cần thêm giờ.',
    sub: 'Giảm 2–4 giờ soạn và chấm mỗi tuần, giữ học viên bằng kết quả thấy rõ.',
    bullets: ['Nhắc học sinh ôn tự động theo FSRS', 'Thấy ngay từ/cấu trúc em đang yếu', 'Tạo lớp và mời học sinh trong vài phút'],
    ctaPrimary: { plan: 'tutor', text: 'Tạo lớp miễn phí', href: '/auth?mode=signup&role=teacher&pilot=tutor' },
  },
  teacher: {
    badge: 'Cho giáo viên nhiều lớp',
    lead: 'Biết ai cần giúp,',
    accent: 'trước khi điểm rớt.',
    sub: 'Một dashboard cho mọi lớp — can thiệp đúng người, đúng lúc.',
    bullets: ['Dashboard tiến độ cả lớp theo thời gian thực', 'Phát hiện học sinh hụt nhịp sớm', 'Giao drill đúng lỗi thay vì đại trà'],
    ctaPrimary: { plan: 'teacher_pro', text: 'Tạo lớp miễn phí', href: '/auth?mode=signup&role=teacher&pilot=teacher_pro' },
  },
  center: {
    badge: 'Cho trung tâm & chuỗi',
    lead: 'Chuẩn hóa chất lượng dạy',
    accent: 'trên mọi lớp.',
    sub: 'Theo dõi nhiều giáo viên, báo cáo cho phụ huynh, onboarding đội ngũ nhanh.',
    bullets: ['Bổ sung learning layer cho phần mềm CRM sẵn có', 'Báo cáo tiến độ gửi phụ huynh', 'Onboarding & hỗ trợ triển khai riêng'],
    ctaPrimary: { plan: 'center', text: 'Đặt lịch demo', href: '#tu-van-trung-tam' },
  },
};

export function AudienceTabs() {
  const [activeAudience, setActiveAudience] = useState<Audience>('teacher');
  const content = audienceContent[activeAudience];

  return (
    <div>
      <div className="flex w-full rounded-full border border-gray-200 bg-white/80 p-1.5 backdrop-blur-sm sm:max-w-md">
        {(Object.keys(audienceContent) as Audience[]).map((audience) => (
          <button
            key={audience}
            onClick={() => setActiveAudience(audience)}
            className={`w-1/3 rounded-full py-2.5 text-sm font-bold transition-colors ${
              activeAudience === audience
                ? 'bg-[#17231d] text-[#d7ff64]'
                : 'border border-transparent bg-transparent text-[#526057] hover:bg-white'
            }`}
          >
            {audience === 'tutor' ? 'Gia sư' : audience === 'teacher' ? 'Giáo viên' : 'Trung tâm'}
          </button>
        ))}
      </div>

      <div className="mt-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#17231d]/10 bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#526057]">
          <Sparkles className="size-4 text-[#567600]" />
          {content.badge}
        </div>
        <h1 className="max-w-4xl text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-7xl">
          {content.lead}
          <span className="mt-2 block text-[#567600]">{content.accent}</span>
        </h1>
        <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-[#526057] sm:text-xl">
          {content.sub}
        </p>
        <ul className="mt-7 space-y-2.5">
          {content.bullets.map((bullet) => (
            <li key={bullet} className="flex items-center gap-3 font-semibold text-[#17231d]">
              <CheckCircle2 className="size-5 shrink-0 text-[#567600]" />
              {bullet}
            </li>
          ))}
        </ul>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <PilotLink
            plan={content.ctaPrimary.plan as PilotPlan}
            placement={`hero_${activeAudience}`}
            href={content.ctaPrimary.href}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#17231d] px-7 py-4 font-black text-white shadow-[0_12px_0_#b9df4d] transition-transform hover:-translate-y-1"
          >
            {content.ctaPrimary.text} <ArrowRight className="size-5" />
          </PilotLink>
          <a
            href="#bang-gia"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#17231d]/15 bg-white/70 px-7 py-4 font-black transition-colors hover:bg-white"
          >
            Xem bảng giá
          </a>
        </div>
         <p className="mt-6 flex items-center gap-x-4 text-sm font-semibold text-[#657269]">
            <span className="flex items-center gap-2"><ShieldCheck className="size-4 text-[#567600]" /> Không cần thẻ</span>
            <span>Hủy bất cứ lúc nào</span>
            <span>Dữ liệu học sinh bảo mật</span>
        </p>
      </div>
    </div>
  );
}

const faqItems = [
    {
        q: 'Học sinh có phải trả tiền không?',
        a: 'Không. Học sinh tham gia lớp miễn phí bằng mã lớp; chỉ tài khoản giáo viên/trung tâm mới có gói trả phí.',
    },
    {
        q: 'Có cần cài đặt phần mềm không?',
        a: 'Không. LingoPro chạy trên trình duyệt (PWA), thêm vào màn hình chính như một app. Có thêm Chrome Extension để tra & lưu từ khi đọc web.',
    },
    {
        q: 'Học sinh dùng trên điện thoại được không?',
        a: 'Được. Giao diện thiết kế mobile-first, học sinh học mọi lúc trên điện thoại.',
    },
    {
        q: 'Dữ liệu học sinh có an toàn không?',
        a: 'Có. Mỗi giáo viên chỉ thấy lớp của mình nhờ bảo mật theo dòng (RLS) ở tầng cơ sở dữ liệu. Chúng tôi không bán dữ liệu.',
    },
    {
        q: 'LingoPro khác Quizlet / Anki ở đâu?',
        a: 'LingoPro thêm lớp quản lý lớp học, AI làm giàu từ vựng và dashboard phát hiện học sinh tụt — những thứ Quizlet/Anki không có.',
    },
    {
        q: 'Có hỗ trợ tiếng Việt không?',
        a: 'Có. Toàn bộ sản phẩm và hỗ trợ đều bằng tiếng Việt.',
    },
    {
        q: 'Mất bao lâu để bắt đầu?',
        a: 'Vài phút: tạo lớp, gửi mã lớp, học sinh tham gia và bắt đầu học ngay.',
    },
    {
        q: 'Có thể hủy bất cứ lúc nào không?',
        a: 'Được, không ràng buộc hợp đồng.',
    },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {faqItems.map((item, index) => (
        <div key={index} className="rounded-2xl border border-[#17231d]/10 bg-white">
          <button
            onClick={() => toggleItem(index)}
            className="flex w-full items-center justify-between gap-4 p-6 text-left"
          >
            <span className="text-lg font-black text-[#17231d]">{item.q}</span>
            <ChevronDown
              className={`size-5 shrink-0 text-[#657269] transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
            />
          </button>
          {openIndex === index && (
            <div className="px-6 pb-6 text-base font-medium text-[#526057]">
                {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}


const INITIAL_FORM = {
  contactName: '',
  email: '',
  phone: '',
  organization: '',
  teacherCount: 10,
  studentCount: 200,
  message: '',
  website: '',
};

// TODO: thay link Zalo OA thật của LingoPro
const ZALO_URL = 'https://zalo.me/'; 

export function ZaloButton() {
    return (
        <a 
            href={ZALO_URL}
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[#17231d]/15 bg-white/70 px-6 py-4 font-black text-[#17231d] transition-colors hover:bg-white"
        >
            <MessageCircle className="size-5"/>
            Chat Zalo tư vấn
        </a>
    );
}

export function CenterLeadForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/pilot/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'teacher_landing_center_form' }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error || 'Không thể gửi yêu cầu.');
      track('center_lead_submitted', {
        teacher_count: form.teacherCount,
        student_count: form.studentCount,
        source: 'teacher_landing_center_form',
      });
      setIsSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể gửi yêu cầu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex min-h-80 flex-col items-center justify-center rounded-[2rem] bg-[#17231d] p-8 text-center text-white">
        <span className="flex size-14 items-center justify-center rounded-full bg-[#d7ff64] text-[#17231d]">
          <CheckCircle2 className="size-7" />
        </span>
        <h3 className="mt-5 text-2xl font-black">Đã nhận yêu cầu tư vấn</h3>
        <p className="mt-3 max-w-md text-sm font-medium leading-6 text-[#aab5ae]">
          Đội ngũ LingoPro sẽ liên hệ để xác nhận nhu cầu, quy mô và lịch demo phù hợp.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="ph-no-capture rounded-[2rem] bg-[#17231d] p-6 text-white sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Người liên hệ">
          <input required value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} className="pilot-input" maxLength={80} />
        </Field>
        <Field label="Tên trung tâm">
          <input required value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} className="pilot-input" maxLength={160} />
        </Field>
        <Field label="Email">
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="pilot-input" maxLength={160} />
        </Field>
        <Field label="Số điện thoại">
          <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="pilot-input" maxLength={30} />
        </Field>
        <Field label="Số giáo viên">
          <input required type="number" min={1} max={10000} value={form.teacherCount} onChange={(e) => setForm({ ...form, teacherCount: Number(e.target.value) })} className="pilot-input" />
        </Field>
        <Field label="Số học sinh">
          <input required type="number" min={1} max={1000000} value={form.studentCount} onChange={(e) => setForm({ ...form, studentCount: Number(e.target.value) })} className="pilot-input" />
        </Field>
      </div>
      <Field label="Nhu cầu hiện tại" className="mt-4">
        <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="pilot-input min-h-24 resize-y" maxLength={1000} />
      </Field>
      <input
        tabIndex={-1}
        autoComplete="off"
        value={form.website}
        onChange={(e) => setForm({ ...form, website: e.target.value })}
        className="hidden"
        aria-hidden="true"
      />
      {error && <p className="mt-4 text-sm font-semibold text-[#ff9c89]">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d7ff64] px-6 py-4 font-black text-[#17231d] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
        Gửi yêu cầu demo <ArrowRight className="size-5" />
      </button>
    </form>
  );
}

function Field({ label, className = '', children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block text-sm font-bold text-[#cbd4ce] ${className}`}>
      <span className="mb-2 block">{label}</span>
      {children}
    </label>
  );
}
