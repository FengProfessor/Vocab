'use client';

import { useEffect, useState } from 'react';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Coins,
  Sparkles,
  ArrowRight,
  Clock,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Building2,
  SendHorizontal,
  Award,
  Zap,
  AlertCircle,
  HeartHandshake,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import { StudentShell } from '@/components/student/StudentShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { formatVND } from '@/lib/billing';

interface ReferralStats {
  totalInvited: number;
  activatedCount: number;
  convertedCount: number;
  totalProDays: number;
  availableCash: number;
  pendingCash: number;
}

interface ReferralItem {
  id: string;
  name: string;
  status: 'registered' | 'activated' | 'converted' | 'fraud_flagged';
  createdAt: string;
  activatedAt?: string | null;
  convertedAt?: string | null;
}

interface PayoutItem {
  id: string;
  amount: number;
  bankName: string;
  bankAccountNumber: string;
  bankAccountHolder: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  adminNote?: string | null;
  createdAt: string;
  processedAt?: string | null;
}

interface HubData {
  referralCode: string;
  shareUrl: string;
  clicksCount: number;
  stats: ReferralStats;
  rank: {
    currentRank: string;
    nextMilestone: {
      target: number;
      current: number;
      reward: string;
    };
  };
  referrals: ReferralItem[];
  payouts?: PayoutItem[];
}

const POPULAR_BANKS = [
  'Vietcombank',
  'MB Bank (Quân Đội)',
  'Techcombank',
  'ACB (Á Châu)',
  'VPBank',
  'BIDV',
  'VietinBank',
  'TPBank',
  'VIB',
  'Sacombank',
  'HDBank',
  'OCB (Phương Đông)',
  'MSB (Hàng Hải)',
  'SeABank',
  'LPBank (Bưu Điện Liên Việt)',
  'SHB (Sài Gòn - Hà Nội)',
  'Cake by VPBank',
  'Timo Digital Bank',
  'MoMo',
  'ZaloPay',
  'Ngân hàng khác (Tự nhập tên)',
];

export default function ReferralHubPage() {
  const [data, setData] = useState<HubData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const [msgTone, setMsgTone] = useState<'casual' | 'study'>('casual');

  // Payout modal state
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('100000');
  const [payoutBank, setPayoutBank] = useState('Vietcombank');
  const [customBank, setCustomBank] = useState('');
  const [payoutAccNumber, setPayoutAccNumber] = useState('');
  const [payoutAccHolder, setPayoutAccHolder] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setCanNativeShare(true);
    }
  }, []);

  const fetchHubData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/referral/hub', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error('Không thể tải dữ liệu');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Không thể tải thông tin giới thiệu bạn bè');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchHubData();
  }, []);

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 45,
        spread: 65,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }
  };

  const handleCopyLink = () => {
    if (!data?.shareUrl) return;
    navigator.clipboard.writeText(data.shareUrl);
    setCopiedLink(true);
    toast.success('Đã sao chép liên kết mời bạn bè!');
    triggerConfetti();
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode);
    setCopiedCode(true);
    toast.success(`Đã sao chép mã quà tặng: ${data.referralCode}!`);
    triggerConfetti();
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const getInviteMessage = () => {
    if (!data?.shareUrl) return '';
    if (msgTone === 'study') {
      return `Xin chào! Mình đang học từ vựng và luyện thi trên LingoPro. Gửi bạn gói 7 ngày Pro VIP trải nghiệm trọn vẹn toàn bộ tính năng cao cấp và kho bài học nhé: ${data.shareUrl}`;
    }
    return `Chào bạn! Mình gửi tặng bạn 7 ngày Pro VIP học tiếng Anh trên LingoPro nè. Ở đây học từ vựng theo phương pháp lặp lại ngắt quãng FSRS nhớ sâu lắm, lại có AI trợ lý chấm sửa câu cực hay. Bấm vào link nhận quà và học cùng mình nhé: ${data.shareUrl}`;
  };

  const handleCopyMessage = () => {
    const msg = getInviteMessage();
    if (!msg) return;
    navigator.clipboard.writeText(msg);
    setCopiedMsg(true);
    toast.success('Đã sao chép tin nhắn rủ bạn bè! Hãy dán vào Zalo/Messenger nhé.');
    triggerConfetti();
    setTimeout(() => setCopiedMsg(false), 2500);
  };

  const handleNativeShare = async () => {
    if (!data?.shareUrl) return;
    try {
      await navigator.share({
        title: 'Tặng bạn 7 ngày Pro VIP học tiếng Anh trên LingoPro',
        text: 'Cùng học tiếng Anh thông minh với AI và phương pháp FSRS trên LingoPro nha! Bấm vào link nhận ngay 7 ngày Pro VIP cùng mình:',
        url: data.shareUrl,
      });
    } catch {
      // Fallback copy if cancelled or rejected
    }
  };

  const handleShareZalo = () => {
    if (!data?.shareUrl) return;
    const url = `https://zalo.me/share?url=${encodeURIComponent(data.shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareFacebook = () => {
    if (!data?.shareUrl) return;
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.shareUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSetPresetAmount = (val: number) => {
    const maxVal = Math.min(2000000, data?.stats.availableCash || 0);
    const selected = Math.min(val, maxVal);
    setPayoutAmount(String(selected));
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(payoutAmount);
    if (!amountNum || amountNum < 100000) {
      toast.error('Số tiền rút tối thiểu là 100.000đ');
      return;
    }

    if (amountNum > 2000000) {
      toast.error('Số tiền rút mỗi lần tối đa là 2.000.000đ');
      return;
    }

    if (!data || amountNum > data.stats.availableCash) {
      toast.error('Số dư khả dụng không đủ để thực hiện yêu cầu này');
      return;
    }

    const effectiveBank =
      payoutBank === 'Ngân hàng khác (Tự nhập tên)' ? customBank.trim() : payoutBank;

    if (!effectiveBank) {
      toast.error('Vui lòng nhập tên ngân hàng thụ hưởng của bạn');
      return;
    }

    const cleanAccNum = payoutAccNumber.trim().replace(/\s+/g, '');
    if (!cleanAccNum || !payoutAccHolder.trim()) {
      toast.error('Vui lòng điền số tài khoản và tên chủ tài khoản thụ hưởng');
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/referral/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: amountNum,
          bankName: effectiveBank,
          bankAccountNumber: cleanAccNum,
          bankAccountHolder: payoutAccHolder.trim().toUpperCase(),
        }),
      });

      const resJson = await res.json();
      if (!res.ok || resJson.error) {
        throw new Error(resJson.error || 'Yêu cầu rút tiền thất bại');
      }

      toast.success(
        resJson.message ||
          'Yêu cầu rút tiền thành công! LingoPro sẽ duyệt và chuyển khoản qua VietQR trong vòng 24 giờ.',
      );
      setIsPayoutOpen(false);
      setPayoutAccNumber('');
      setPayoutAccHolder('');
      setCustomBank('');
      void fetchHubData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi gửi yêu cầu rút tiền');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  // Rank checks
  const activatedCount = data?.stats.activatedCount || 0;
  const isGold = activatedCount >= 10;
  const isSilver = activatedCount >= 3 && activatedCount < 10;
  const isBronze = activatedCount < 3;

  return (
    <StudentShell title="Mời bạn bè — Nhận quà VIP">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white shadow-lg">
          <div className="absolute -right-8 -top-8 h-60 w-60 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute left-1/2 bottom-0 h-40 w-40 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-3.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-indigo-100 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Chương trình Bạn Đồng Hành · Học cùng bạn bè, nhân đôi tiến bộ
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Cùng Bạn Bứt Phá Tiếng Anh — Nhận Trọn Pro VIP &amp; Thưởng Tri Ân
            </h1>
            <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
              Mời bạn bè cùng nâng cấp vốn từ vựng trên LingoPro: <span className="font-bold text-amber-300">Cả 2 đều nhận ngay 7 ngày Pro VIP</span>. Đặc biệt, bạn còn nhận thêm <span className="font-bold text-emerald-300">15% – 20% hoa hồng tri ân</span> rút thẳng về tài khoản ngân hàng khi bạn bè nâng cấp tài khoản!
            </p>

            {/* Quick value badges */}
            <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold text-indigo-100">
              <div className="inline-flex items-center gap-1 rounded-lg bg-black/20 px-2.5 py-1 backdrop-blur-xs">
                <Gift className="h-3.5 w-3.5 text-amber-300" />
                Tặng 7 ngày VIP cho cả hai
              </div>
              <div className="inline-flex items-center gap-1 rounded-lg bg-black/20 px-2.5 py-1 backdrop-blur-xs">
                <Coins className="h-3.5 w-3.5 text-emerald-300" />
                Nhận 15% – 20% hoa hồng tri ân
              </div>
              <div className="inline-flex items-center gap-1 rounded-lg bg-black/20 px-2.5 py-1 backdrop-blur-xs">
                <Zap className="h-3.5 w-3.5 text-blue-300" />
                Rút tiền 24/7 qua VietQR miễn phí
              </div>
            </div>
          </div>
        </div>

        {/* 3 Steps Guide */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border border-indigo-100 bg-white p-4.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-indigo-200">
            <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200 text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-black shadow-xs">
                1
              </span>
              Gửi link mời bạn bè
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Gửi liên kết độc quyền hoặc mã quà tặng qua Zalo, Messenger để rủ bạn bè cùng tham gia học tập.
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-white p-4.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-amber-200">
            <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200 text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white text-xs font-black shadow-xs">
                2
              </span>
              Cùng học &amp; Mở quà VIP
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Bạn bè học 3 ngày liên tục hoặc lưu 30 từ vựng — <span className="font-semibold text-indigo-600 dark:text-indigo-400">cả hai bạn</span> được tặng ngay 7 ngày Pro VIP!
            </p>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-white p-4.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 transition-all hover:border-emerald-200">
            <div className="flex items-center gap-2.5 font-bold text-slate-800 dark:text-slate-200 text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-black shadow-xs">
                3
              </span>
              Nhận hoa hồng tri ân
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Khi bạn bè đăng ký bất kỳ gói Pro nào, bạn nhận ngay <span className="font-semibold text-emerald-600 dark:text-emerald-400">15% – 20% hoa hồng</span> rút thẳng về tài khoản ngân hàng.
            </p>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {/* Card 1: Pro Days */}
          <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Pro VIP Đã Nhận
                </span>
                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                  <Gift className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                  ) : (
                    `+${data?.stats.totalProDays || 0}`
                  )}
                </span>
                <span className="text-xs font-semibold text-slate-500">ngày</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Cộng dồn trực tiếp vào hạn dùng tài khoản
            </p>
          </div>

          {/* Card 2: Available Cash */}
          <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-2xs dark:border-emerald-950/50 dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Tiền Thưởng Khả Dụng
                </span>
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <Coins className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                  ) : (
                    formatVND(data?.stats.availableCash || 0)
                  )}
                </span>
              </div>
            </div>
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!data || data.stats.availableCash < 100000}
                onClick={() => setIsPayoutOpen(true)}
                className="w-full text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 h-8"
              >
                Rút về tài khoản ngân hàng
              </Button>
              {data && data.stats.availableCash < 100000 ? (
                <p className="mt-1 text-center text-[10px] text-slate-400">
                  (Cần tối thiểu 100.000đ để rút)
                </p>
              ) : (
                <p className="mt-1 text-center text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Rút tức thì 24/7 qua VietQR
                </p>
              )}
            </div>
          </div>

          {/* Card 3: Pending Cash */}
          <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-2xs dark:border-amber-950/50 dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Thưởng Chờ Mở Khóa
                </span>
                <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                  ) : (
                    formatVND(data?.stats.pendingCash || 0)
                  )}
                </span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Tự động mở khóa sau 7–14 ngày (khi đơn hàng hoàn tất)
            </p>
          </div>

          {/* Card 4: Total Friends */}
          <div className="rounded-xl border border-purple-100 bg-white p-4 shadow-2xs dark:border-purple-950/50 dark:bg-slate-900 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Bạn Học Đã Mời
                </span>
                <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  ) : (
                    data?.stats.totalInvited || 0
                  )}
                </span>
                <span className="text-xs font-semibold text-slate-500">bạn</span>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              {data?.stats.activatedCount || 0} bạn đã kích hoạt quà VIP
            </p>
          </div>
        </div>

        {/* Share Box Component */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="h-4 w-4 text-indigo-600" />
                Link mời độc quyền của bạn
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bạn bè chỉ cần nhấp vào liên kết này để đăng ký, quà tặng VIP sẽ tự động kích hoạt cho cả hai!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Lượt xem link:</span>
              <Badge variant="secondary" className="font-mono font-bold">
                {data?.clicksCount || 0}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Share URL input */}
            <div className="md:col-span-2 flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  readOnly
                  value={data?.shareUrl || 'Đang tạo liên kết mời...'}
                  className="pr-36 font-mono text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 h-10"
                />
                <Button
                  size="sm"
                  disabled={!data?.shareUrl}
                  onClick={handleCopyLink}
                  className="absolute right-1 top-1 h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs"
                >
                  {copiedLink ? (
                    <Check className="h-3.5 w-3.5 mr-1 text-emerald-300" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 mr-1" />
                  )}
                  {copiedLink ? 'Đã chép' : 'Sao chép link'}
                </Button>
              </div>
            </div>

            {/* Referral Code Box */}
            <div
              onClick={handleCopyCode}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleCopyCode();
              }}
              className="flex items-center justify-between rounded-lg border border-dashed border-indigo-200 bg-indigo-50/60 px-3.5 py-2 cursor-pointer transition-all hover:bg-indigo-100/60 hover:border-indigo-300 dark:border-indigo-900/60 dark:bg-indigo-950/20 dark:hover:bg-indigo-900/30"
            >
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Mã quà tặng
                </div>
                <div className="font-mono text-base font-extrabold text-indigo-700 dark:text-indigo-300">
                  {data?.referralCode || '...'}
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyCode();
                }}
                className="h-8 px-2 text-indigo-600 hover:bg-indigo-200/50 dark:hover:bg-indigo-900/40 text-xs font-semibold"
              >
                {copiedCode ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                    Đã chép
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Chép mã
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Tone Selector & Message Box */}
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mẫu tin nhắn rủ bạn bè:
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                <button
                  type="button"
                  onClick={() => setMsgTone('casual')}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    msgTone === 'casual'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  💬 Bạn thân
                </button>
                <button
                  type="button"
                  onClick={() => setMsgTone('study')}
                  className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-all ${
                    msgTone === 'study'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                  }`}
                >
                  📚 Nhóm / Lớp học
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed">
              &quot;{getInviteMessage()}&quot;
            </p>
          </div>

          {/* Social Share Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {canNativeShare && (
              <Button
                size="sm"
                onClick={handleNativeShare}
                className="text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 h-8"
              >
                <Share2 className="h-3.5 w-3.5 mr-1.5" />
                Chia sẻ nhanh
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={handleShareZalo}
              className="text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/50 h-8"
            >
              <SendHorizontal className="h-3.5 w-3.5 mr-1.5" />
              Gửi qua Zalo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleShareFacebook}
              className="text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900 dark:hover:bg-indigo-950/50 h-8"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              Chia sẻ Facebook
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyMessage}
              className="text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 h-8"
            >
              {copiedMsg ? (
                <Check className="h-3.5 w-3.5 mr-1.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 mr-1.5" />
              )}
              {copiedMsg ? 'Đã sao chép tin nhắn' : 'Sao chép tin nhắn mẫu'}
            </Button>
          </div>
        </div>

        {/* Milestone Ladder */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Hành Trình Thăng Hạng Của Bạn
              </h2>
            </div>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold">
              {data?.rank.currentRank || 'Học viên Khởi đầu'}
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Mục tiêu tiếp theo:{' '}
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                  {data?.rank.nextMilestone.reward}
                </span>
              </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {data?.rank.nextMilestone.current} / {data?.rank.nextMilestone.target} bạn kích hoạt
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((data?.rank.nextMilestone.current || 0) /
                        (data?.rank.nextMilestone.target || 1)) *
                        100,
                    ),
                  )}%`,
                }}
              />
            </div>

            {/* 3 Tier Cards with Active State */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div
                className={`rounded-xl border p-3.5 transition-all ${
                  isBronze
                    ? 'border-indigo-400 bg-indigo-50/50 dark:border-indigo-600 dark:bg-indigo-950/30 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    🥉 Khởi đầu (0 – 2 bạn)
                  </span>
                  {isBronze && (
                    <Badge variant="outline" className="text-[10px] font-bold border-indigo-300 text-indigo-700 dark:text-indigo-300">
                      Cấp hiện tại
                    </Badge>
                  )}
                  {!isBronze && (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Đã mở
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-[11px] mt-1.5 leading-relaxed">
                  15% hoa hồng + 7 ngày Pro VIP cho mỗi bạn học cùng.
                </div>
              </div>

              <div
                className={`rounded-xl border p-3.5 transition-all ${
                  isSilver
                    ? 'border-indigo-400 bg-indigo-50/60 dark:border-indigo-600 dark:bg-indigo-950/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    🥈 Bạn Đồng Hành (3 – 9 bạn)
                  </span>
                  {isSilver ? (
                    <Badge variant="outline" className="text-[10px] font-bold border-indigo-300 text-indigo-700 dark:text-indigo-300">
                      Cấp hiện tại
                    </Badge>
                  ) : isGold ? (
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                      <CheckCircle2 className="h-3 w-3" /> Đã mở
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400">
                      Cần {Math.max(0, 3 - activatedCount)} bạn
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-[11px] mt-1.5 leading-relaxed">
                  15% hoa hồng + Thưởng thêm 30 ngày Pro VIP khi đạt mốc.
                </div>
              </div>

              <div
                className={`rounded-xl border p-3.5 transition-all ${
                  isGold
                    ? 'border-amber-400 bg-amber-50/60 dark:border-amber-600 dark:bg-amber-950/40 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    🥇 Đại sứ LingoPro (10+ bạn)
                  </span>
                  {isGold ? (
                    <Badge className="bg-amber-500 text-white text-[10px] font-bold">
                      Đạt Đại Sứ ⭐
                    </Badge>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-400">
                      Cần {Math.max(0, 10 - activatedCount)} bạn
                    </span>
                  )}
                </div>
                <div className="text-slate-500 text-[11px] mt-1.5 leading-relaxed">
                  Nâng hoa hồng lên 20% + Thưởng 200.000đ tiền mặt vào ví.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Friends Progress Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              Bạn bè cùng học ({data?.referrals.length || 0})
            </h2>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-indigo-600" />
              <p className="mt-2 text-xs">Đang tải danh sách bạn bè...</p>
            </div>
          ) : !data?.referrals.length ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600">
                <Gift className="h-7 w-7" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
                Bạn chưa có bạn học đồng hành nào
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
                Học một mình dễ nản, rủ ngay bạn thân cùng học để vừa có bạn đua top, vừa cùng nhận trọn 7 ngày VIP!
              </p>
              <Button
                size="sm"
                onClick={handleCopyLink}
                className="mt-4 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
              >
                <Copy className="h-3.5 w-3.5 mr-1.5" />
                Sao chép link mời bạn ngay
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                    <th className="pb-2.5 font-medium">Bạn học</th>
                    <th className="pb-2.5 font-medium">Ngày tham gia</th>
                    <th className="pb-2.5 font-medium">Trạng thái học tập</th>
                    <th className="pb-2.5 font-medium text-right">Quà tặng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.referrals.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-[11px] font-bold text-indigo-700 dark:text-indigo-300">
                            {item.name.charAt(0).toUpperCase()}
                          </div>
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3">
                        {item.status === 'converted' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Đã lên Pro VIP 👑
                          </span>
                        ) : item.status === 'activated' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            <CheckCircle2 className="h-3 w-3" /> Đã kích hoạt VIP 🎁
                          </span>
                        ) : item.status === 'fraud_flagged' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                            <AlertCircle className="h-3 w-3" /> Chưa đủ điều kiện ⚠️
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Clock className="h-3 w-3" /> Mới đăng ký ⏳
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                        {item.status === 'converted' ? (
                          <span className="text-emerald-600">+7 ngày VIP &amp; Hoa hồng</span>
                        ) : item.status === 'activated' ? (
                          <span className="text-indigo-600">+7 ngày Pro VIP</span>
                        ) : item.status === 'fraud_flagged' ? (
                          <span className="text-slate-400">Chưa đủ điều kiện</span>
                        ) : (
                          <span className="text-slate-400">Chờ học 3 ngày hoặc 30 từ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Payout Requests History (when user has submitted payouts) */}
        {data?.payouts && data.payouts.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-600" />
                Lịch sử yêu cầu rút tiền ({data.payouts.length})
              </h2>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                    <th className="pb-2.5 font-medium">Thời gian</th>
                    <th className="pb-2.5 font-medium">Số tiền</th>
                    <th className="pb-2.5 font-medium">Ngân hàng thụ hưởng</th>
                    <th className="pb-2.5 font-medium">Trạng thái</th>
                    <th className="pb-2.5 font-medium text-right">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 text-slate-500 font-mono text-[11px]">
                        {new Date(p.createdAt).toLocaleDateString('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 font-bold text-emerald-600 dark:text-emerald-400">
                        {formatVND(p.amount)}
                      </td>
                      <td className="py-3 text-slate-700 dark:text-slate-300">
                        <div className="font-semibold">{p.bankName}</div>
                        <div className="font-mono text-[11px] text-slate-400">
                          {p.bankAccountNumber.slice(0, 3)}****{p.bankAccountNumber.slice(-4)} · {p.bankAccountHolder}
                        </div>
                      </td>
                      <td className="py-3">
                        {p.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Đã chuyển tiền ✅
                          </span>
                        ) : p.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            <Clock className="h-3 w-3" /> Đã duyệt · Đang chuyển 💸
                          </span>
                        ) : p.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            <AlertCircle className="h-3 w-3" /> Từ chối ❌
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                            <Clock className="h-3 w-3" /> Đang chờ duyệt ⏳
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right text-[11px] text-slate-400 max-w-xs truncate">
                        {p.adminNote || 'Chuyển khoản VietQR 24/7'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FAQs */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-indigo-600" />
            Những câu hỏi thường gặp
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Làm sao để cả hai cùng nhận 7 ngày Pro VIP?
              </span>
              <p className="mt-1.5 leading-relaxed">
                Bạn chỉ cần gửi link hoặc mã quà tặng. Khi bạn bè đăng ký và hoàn thành 3 ngày học liên tiếp hoặc lưu 30 từ vựng đầu tiên, hệ thống sẽ tự động kích hoạt 7 ngày Pro VIP cho cả bạn và bạn của bạn!
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Tiền thưởng hoa hồng được tính như thế nào?
              </span>
              <p className="mt-1.5 leading-relaxed">
                Khi người bạn do bạn giới thiệu nâng cấp bất kỳ gói học Pro nào (tháng, năm hay trọn đời), bạn sẽ nhận ngay 15% (hoặc 20% khi đạt cấp Đại sứ) giá trị gói học đó vào ví thưởng.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Tôi có thể rút tiền về tài khoản ngân hàng không?
              </span>
              <p className="mt-1.5 leading-relaxed">
                Hoàn toàn được! Khi số dư ví thưởng từ 100.000đ trở lên, bạn chỉ cần bấm nút &quot;Rút về tài khoản ngân hàng&quot; và điền thông tin tài khoản. LingoPro duyệt và chuyển khoản 24/7 qua VietQR hoàn toàn miễn phí.
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 p-4 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Thưởng chờ mở khóa là gì và bao lâu thì rút được tiền?
              </span>
              <p className="mt-1.5 leading-relaxed">
                Khi bạn bè nâng cấp gói học, tiền hoa hồng sẽ ở trạng thái chờ mở khóa trong 7–14 ngày (tùy gói tháng hoặc năm) nhằm đảm bảo đơn hàng hoàn tất ổn định. Sau thời gian này, tiền sẽ tự động chuyển sang số dư khả dụng để bạn rút về tài khoản ngân hàng bất cứ lúc nào.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Modal */}
      {isPayoutOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 dark:text-white">
                  Rút Tiền Thưởng Về Ngân Hàng
                </h3>
              </div>
              <button
                onClick={() => setIsPayoutOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-base font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayout} className="mt-4 space-y-4 text-xs">
              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-semibold">
                  Số tiền muốn rút (VNĐ)
                </Label>
                <Input
                  type="number"
                  min={100000}
                  max={Math.min(2000000, data?.stats.availableCash || 0)}
                  step={10000}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="mt-1 font-mono font-bold text-sm h-10"
                  required
                />
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Khả dụng:{' '}
                    <span className="font-bold text-emerald-600">
                      {formatVND(data?.stats.availableCash || 0)}
                    </span>
                  </span>
                  <span className="text-slate-400">Tối thiểu: 100.000đ</span>
                </div>

                {/* Quick preset chips */}
                {data && data.stats.availableCash >= 100000 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[100000, 200000, 500000]
                      .filter((preset) => preset <= data.stats.availableCash)
                      .map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleSetPresetAmount(preset)}
                          className={`rounded-md border px-2 py-1 text-[11px] font-semibold transition-all ${
                            payoutAmount === String(preset)
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {preset.toLocaleString('vi-VN')}đ
                        </button>
                      ))}
                    <button
                      type="button"
                      onClick={() => handleSetPresetAmount(data.stats.availableCash)}
                      className={`rounded-md border px-2 py-1 text-[11px] font-bold transition-all ${
                        payoutAmount === String(Math.min(2000000, data.stats.availableCash))
                          ? 'border-emerald-500 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300'
                      }`}
                    >
                      Toàn bộ số dư ({formatVND(data.stats.availableCash)})
                    </button>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-semibold">
                  Ngân hàng thụ hưởng
                </Label>
                <select
                  value={payoutBank}
                  onChange={(e) => setPayoutBank(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white h-10"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                {payoutBank === 'Ngân hàng khác (Tự nhập tên)' && (
                  <div className="mt-2.5">
                    <Label className="text-slate-700 dark:text-slate-300 font-semibold">
                      Nhập tên ngân hàng của bạn
                    </Label>
                    <Input
                      type="text"
                      placeholder="Ví dụ: Shinhan Bank, KienlongBank, Standard Chartered..."
                      value={customBank}
                      onChange={(e) => setCustomBank(e.target.value)}
                      className="mt-1 h-10"
                      required
                    />
                  </div>
                )}
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-semibold">
                  Số tài khoản ngân hàng
                </Label>
                <Input
                  type="text"
                  placeholder="Ví dụ: 1029384756"
                  value={payoutAccNumber}
                  onChange={(e) => setPayoutAccNumber(e.target.value.replace(/\s+/g, ''))}
                  className="mt-1 font-mono font-bold h-10"
                  required
                />
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300 font-semibold">
                  Tên chủ tài khoản (Viết hoa không dấu)
                </Label>
                <Input
                  type="text"
                  placeholder="NGUYEN VAN A"
                  value={payoutAccHolder}
                  onChange={(e) => setPayoutAccHolder(e.target.value.toUpperCase())}
                  className="mt-1 font-bold uppercase h-10"
                  required
                />
                <p className="mt-1 text-[10px] text-slate-400">
                  Vui lòng nhập chính xác tên trên thẻ hoặc tài khoản ngân hàng
                </p>
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-500 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                🔒 Chuyển khoản 24/7 qua VietQR. LingoPro không thu bất kỳ khoản phí rút tiền nào.
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPayoutOpen(false)}
                  className="flex-1"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingPayout}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isSubmittingPayout ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : null}
                  Xác nhận rút tiền
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StudentShell>
  );
}
