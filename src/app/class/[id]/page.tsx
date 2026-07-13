'use client';

/**
 * /class/[id] — Trang đăng ký lớp live Facebook trả phí (cohort).
 * Luồng: xem khóa → dán link FB + đăng ký → VietQR → SePay tự xác nhận → success (mã + link group).
 * CHƯA gắn link ở đâu trong app ("chưa mở") — vào bằng URL trực tiếp.
 */

import { useState, useEffect, useCallback, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { CalendarClock, Loader2, CheckCircle2, Copy, ExternalLink, Ticket, Users } from 'lucide-react';
import { toast } from 'sonner';

const BANK_INFO = {
  bankId: process.env.NEXT_PUBLIC_BANK_ID || 'MB',
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '',
  accountName: process.env.NEXT_PUBLIC_BANK_OWNER || 'LINGOPRO',
};

interface ClassInfo {
  id: string;
  title: string;
  price: number;
  session_count: number;
  start_date: string | null;
  end_date: string;
  status: string;
  fb_group_url: string | null;
}

function fmtVND(n: number) { return n.toLocaleString('vi-VN') + '₫'; }
function fmtDate(s: string | null) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ClassCheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [cls, setCls] = useState<ClassInfo | null>(null);
  const [paid, setPaid] = useState(false);
  const [fbUrl, setFbUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<{ id: string; amount: number } | null>(null);

  const token = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }, []);

  const load = useCallback(async () => {
    const t = await token();
    if (!t) { router.push('/auth'); return; }
    try {
      const res = await fetch(`/api/fbclass/${id}`, { headers: { Authorization: `Bearer ${t}` } });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setCls(json.class);
      setPaid(json.paid);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [id, router, token]);

  useEffect(() => { load(); }, [load]);

  // Poll trạng thái vé sau khi tạo QR — SePay xác nhận xong sẽ chuyển paid.
  useEffect(() => {
    if (!order || paid) return;
    const iv = setInterval(async () => {
      const t = await token();
      if (!t) return;
      const res = await fetch(`/api/fbclass/${id}`, { headers: { Authorization: `Bearer ${t}` } });
      const json = await res.json();
      if (res.ok && json.paid) {
        setPaid(true);
        setCls(json.class); // giờ có fb_group_url
        toast.success('Đã nhận thanh toán! Mở khóa vào group.');
        clearInterval(iv);
      }
    }, 5000);
    return () => clearInterval(iv);
  }, [order, paid, id, token]);

  const handleRegister = async () => {
    if (!fbUrl.trim() || !/facebook\.com|fb\.com|\/profile\.php/i.test(fbUrl)) {
      toast.error('Dán link Facebook cá nhân hợp lệ (để duyệt vào group)');
      return;
    }
    setBusy(true);
    try {
      const t = await token();
      const res = await fetch('/api/billing/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderKind: 'fbclass', fbClassId: id, fbProfileUrl: fbUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setOrder({ id: json.order.id, amount: json.order.amount });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const copy = (text: string, label = 'Đã copy!') => { navigator.clipboard.writeText(text); toast.success(label); };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#070711]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!cls) {
    return <div className="min-h-dvh flex items-center justify-center bg-[#070711] text-white">Khóa học không tồn tại.</div>;
  }

  const code = order ? `LINGOPRO ${order.id.slice(0, 8).toUpperCase()}` : '';
  const qrSrc = order && BANK_INFO.accountNumber
    ? `https://img.vietqr.io/image/${BANK_INFO.bankId}-${BANK_INFO.accountNumber}-compact.png?amount=${order.amount}&addInfo=${encodeURIComponent(code)}&accountName=${encodeURIComponent(BANK_INFO.accountName)}`
    : '';

  return (
    <div className="min-h-dvh bg-[#070711] text-white font-sans">
      <main className="max-w-lg mx-auto px-4 py-10 space-y-6">
        {/* Header khóa */}
        <div className="bg-gradient-to-br from-violet-500/15 to-blue-500/10 border border-violet-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-2 text-xs text-violet-300 font-bold mb-2">
            <Users className="h-4 w-4" /> LỚP LIVE FACEBOOK
          </div>
          <h1 className="text-2xl font-extrabold mb-3">{cls.title}</h1>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-300">
            <span>📚 {cls.session_count} buổi</span>
            <span className="flex items-center gap-1.5"><CalendarClock className="h-4 w-4 text-violet-400" /> {fmtDate(cls.start_date)} → {fmtDate(cls.end_date)}</span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-slate-400 mb-0.5">Phí cam kết</p>
            <div className="text-3xl font-extrabold text-emerald-400">{fmtVND(cls.price)}</div>
          </div>
        </div>

        {/* Đã trả phí → success */}
        {paid ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-6 space-y-4 text-center">
            <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold">Đăng ký thành công!</h2>
            <p className="text-sm text-slate-300">Bấm vào group rồi gửi yêu cầu tham gia. Chủ nhóm thấy bạn trong <b>danh sách đã đóng phí</b> sẽ duyệt (khớp đúng link Facebook bạn vừa nhập).</p>
            {cls.fb_group_url && (
              <a href={cls.fb_group_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-xl w-full justify-center">
                <ExternalLink className="h-4 w-4" /> Vào group Facebook
              </a>
            )}
          </div>
        ) : order ? (
          /* Đã tạo order → QR chờ chuyển khoản */
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold flex items-center gap-2"><Ticket className="h-5 w-5 text-violet-400" /> Quét QR để đóng {fmtVND(order.amount)}</h2>
            {qrSrc ? (
              <img src={qrSrc} alt="VietQR" className="w-60 h-60 mx-auto rounded-xl bg-white p-2" />
            ) : (
              <p className="text-amber-400 text-sm text-center">Chưa cấu hình tài khoản ngân hàng (NEXT_PUBLIC_BANK_ACCOUNT).</p>
            )}
            <div className="bg-white/5 rounded-xl p-3 text-sm">
              <p className="text-xs text-slate-400 mb-1">Nội dung chuyển khoản (bắt buộc đúng)</p>
              <button onClick={() => copy(code)} className="font-mono font-bold text-violet-300 flex items-center gap-2">
                {code} <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" /> Đang chờ xác nhận tự động sau khi bạn chuyển khoản…
            </p>
          </div>
        ) : (
          /* Chưa đăng ký → form dán link FB */
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <div>
              <label className="text-sm font-semibold">Link Facebook cá nhân của bạn</label>
              <p className="text-xs text-slate-400 mb-2">Để chủ nhóm duyệt bạn vào group đúng người đã đóng phí cam kết.</p>
              <input
                value={fbUrl}
                onChange={(e) => setFbUrl(e.target.value)}
                placeholder="https://facebook.com/ten.ban"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button
              onClick={handleRegister}
              disabled={busy || cls.status !== 'active'}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Đóng phí cam kết · ${fmtVND(cls.price)}`}
            </button>
            {cls.status !== 'active' && <p className="text-amber-400 text-xs text-center">Khóa này đã đóng đăng ký.</p>}
          </div>
        )}
      </main>
    </div>
  );
}
