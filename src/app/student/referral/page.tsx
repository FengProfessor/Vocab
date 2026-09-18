'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Coins,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  Building2,
  SendHorizontal,
  Flame,
  Award,
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
  'MoMo',
];

export default function ReferralHubPage() {
  const [data, setData] = useState<HubData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Payout modal state
  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('100000');
  const [payoutBank, setPayoutBank] = useState('Vietcombank');
  const [payoutAccNumber, setPayoutAccNumber] = useState('');
  const [payoutAccHolder, setPayoutAccHolder] = useState('');
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);

  const fetchHubData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/referral/hub', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) throw new Error('Không thể tải thông tin giới thiệu');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Lỗi tải dữ liệu giới thiệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchHubData();
  }, []);

  const handleCopyLink = () => {
    if (!data?.shareUrl) return;
    navigator.clipboard.writeText(data.shareUrl);
    setCopied(true);
    toast.success('Đã sao chép liên kết giới thiệu!');
    setTimeout(() => setCopied(false), 2500);

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch {
      // ignore
    }
  };

  const handleCopyCode = () => {
    if (!data?.referralCode) return;
    navigator.clipboard.writeText(data.referralCode);
    toast.success(`Đã sao chép mã ${data.referralCode}!`);
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

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(payoutAmount);
    if (!amountNum || amountNum < 100000) {
      toast.error('Số tiền rút tối thiểu là 100.000đ');
      return;
    }

    if (!data || amountNum > data.stats.availableCash) {
      toast.error('Số dư khả dụng không đủ để thực hiện yêu cầu');
      return;
    }

    if (!payoutAccNumber.trim() || !payoutAccHolder.trim()) {
      toast.error('Vui lòng điền số tài khoản và tên người nhận');
      return;
    }

    setIsSubmittingPayout(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/referral/payout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          amount: amountNum,
          bankName: payoutBank,
          bankAccountNumber: payoutAccNumber,
          bankAccountHolder: payoutAccHolder,
        }),
      });

      const resJson = await res.json();
      if (!res.ok || resJson.error) {
        throw new Error(resJson.error || 'Yêu cầu rút tiền thất bại');
      }

      toast.success('Yêu cầu rút tiền đã được gửi! LingoPro sẽ đối soát và giải ngân qua VietQR 24/7.');
      setIsPayoutOpen(false);
      void fetchHubData();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi gửi yêu cầu rút tiền');
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  return (
    <StudentShell title="Mời bạn nhận thưởng">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-700 via-indigo-600 to-purple-800 p-6 sm:p-8 text-white shadow-xl">
          <div className="absolute -right-8 -top-8 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-indigo-100 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              Chương trình Đối Tác LingoPro 2026
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Lan tỏa LingoPro — Thưởng Kép Pro VIP & Tiền Mặt
            </h1>
            <p className="text-sm sm:text-base text-indigo-100/90 leading-relaxed">
              Tặng bạn bè <span className="font-bold text-amber-300">7 ngày Pro VIP</span> không giới hạn. Nhận ngay <span className="font-bold text-emerald-300">15% - 20% hoa hồng tiền mặt</span> khi bạn nâng cấp gói học kèm quà tặng ngày học Pro VIP!
            </p>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {/* Card 1: Pro Days */}
          <div className="rounded-xl border border-indigo-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pro VIP Đã Tích Lũy</span>
              <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
                <Gift className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `+${data?.stats.totalProDays || 0}`}
              </span>
              <span className="ml-1 text-xs text-slate-500">ngày</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Tự động cộng dồn vào hạn dùng</p>
          </div>

          {/* Card 2: Available Cash */}
          <div className="rounded-xl border border-emerald-100 bg-white p-4 shadow-sm dark:border-emerald-950/50 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Hoa Hồng Khả Dụng</span>
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Coins className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatVND(data?.stats.availableCash || 0)}
              </span>
            </div>
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!data || data.stats.availableCash < 100000}
                onClick={() => setIsPayoutOpen(true)}
                className="w-full text-xs font-bold border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 h-7"
              >
                Rút về VietQR
              </Button>
            </div>
          </div>

          {/* Card 3: Pending Cash */}
          <div className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm dark:border-amber-950/50 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đang Giữ (Holding)</span>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <Clock className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatVND(data?.stats.pendingCash || 0)}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Chờ duyệt 7–14 ngày chống hủy</p>
          </div>

          {/* Card 4: Total Friends */}
          <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Bạn Bè Đã Mời</span>
              <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : data?.stats.totalInvited || 0}
              </span>
              <span className="ml-1 text-xs text-slate-500">người</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">{data?.stats.activatedCount || 0} bạn đã kích hoạt Pro</p>
          </div>
        </div>

        {/* Share Box Component */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 className="h-4 w-4 text-indigo-600" />
                Liên kết & Mã Giới Thiệu Của Bạn
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Chia sẻ link cho bạn bè, hệ thống tự động gán mã và lưu cookie 30 ngày.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Lượt nhấp link:</span>
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
                  value={data?.shareUrl || 'Đang tạo liên kết...'}
                  className="pr-20 font-mono text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                />
                <Button
                  size="sm"
                  onClick={handleCopyLink}
                  className="absolute right-1 top-1 h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copied ? 'Đã chép' : 'Sao chép'}
                </Button>
              </div>
            </div>

            {/* Referral Code Box */}
            <div className="flex items-center justify-between rounded-lg border border-dashed border-indigo-200 bg-indigo-50/50 px-3 py-2 dark:border-indigo-900/60 dark:bg-indigo-950/20">
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">Mã giới thiệu</div>
                <div className="font-mono text-base font-extrabold text-indigo-700 dark:text-indigo-300">
                  {data?.referralCode || '...'}
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={handleCopyCode} className="h-8 px-2 text-indigo-600">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleShareZalo}
              className="text-xs font-semibold text-blue-600 border-blue-200 hover:bg-blue-50 dark:border-blue-900 dark:hover:bg-blue-950/50"
            >
              <SendHorizontal className="h-3.5 w-3.5 mr-1.5" />
              Gửi qua Zalo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleShareFacebook}
              className="text-xs font-semibold text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900 dark:hover:bg-indigo-950/50"
            >
              <Share2 className="h-3.5 w-3.5 mr-1.5" />
              Chia sẻ Facebook
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (!data?.shareUrl) return;
                const sampleText = `Học từ vựng tiếng Anh thông minh với AI và FSRS trên LingoPro! Nhận ngay 7 ngày học Pro VIP miễn phí tại đây: ${data.shareUrl}`;
                navigator.clipboard.writeText(sampleText);
                toast.success('Đã chép tin nhắn mời mẫu!');
              }}
              className="text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300"
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Chép tin nhắn mẫu
            </Button>
          </div>
        </div>

        {/* Milestone Ladder / Ranks */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Cột Mốc Thành Tích & Danh Hiệu
              </h2>
            </div>
            <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
              Hạng hiện tại: {data?.rank.currentRank || 'Bronze'}
            </Badge>
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Mục tiêu tiếp theo: {data?.rank.nextMilestone.reward}
              </span>
              <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {data?.rank.nextMilestone.current} / {data?.rank.nextMilestone.target} bạn kích hoạt
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      ((data?.rank.nextMilestone.current || 0) / (data?.rank.nextMilestone.target || 1)) * 100,
                    ),
                  )}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="rounded-lg border border-slate-200 p-2.5 dark:border-slate-800">
                <div className="font-bold text-slate-800 dark:text-slate-200">🥉 Bronze (Khởi đầu)</div>
                <div className="text-slate-500 text-[11px] mt-0.5">15% hoa hồng + 7 ngày Pro/bạn</div>
              </div>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/30 p-2.5 dark:border-indigo-900/40">
                <div className="font-bold text-indigo-700 dark:text-indigo-300">🥈 Silver (3 bạn kích hoạt)</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Thưởng nóng +30 ngày Pro VIP</div>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-2.5 dark:border-amber-900/40">
                <div className="font-bold text-amber-700 dark:text-amber-300">🥇 Gold Ambassador (10 bạn)</div>
                <div className="text-slate-500 text-[11px] mt-0.5">20% hoa hồng + 200.000đ tiền mặt</div>
              </div>
            </div>
          </div>
        </div>

        {/* Invited Friends List */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              Tiến Độ Bạn Bè Đã Giới Thiệu ({data?.referrals.length || 0})
            </h2>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400">
              <Loader2 className="mx-auto h-6 w-6 animate-spin" />
              <p className="mt-2 text-xs">Đang tải danh sách bạn bè...</p>
            </div>
          ) : !data?.referrals.length ? (
            <div className="py-12 text-center">
              <Gift className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
              <h3 className="mt-2 text-sm font-bold text-slate-700 dark:text-slate-300">Chưa có bạn bè nào tham gia</h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                Chia sẻ liên kết của bạn lên Zalo hoặc Facebook để bạn bè cùng học và nhận thưởng ngay hôm nay!
              </p>
              <Button size="sm" onClick={handleCopyLink} className="mt-4 text-xs font-semibold bg-indigo-600 text-white">
                <Copy className="h-3.5 w-3.5 mr-1" />
                Sao chép liên kết mời ngay
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                    <th className="pb-2 font-medium">Học viên</th>
                    <th className="pb-2 font-medium">Ngày tham gia</th>
                    <th className="pb-2 font-medium">Trạng thái</th>
                    <th className="pb-2 font-medium text-right">Phần thưởng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.referrals.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {item.name}
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3">
                        {item.status === 'converted' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Đã mua gói (Có hoa hồng)
                          </span>
                        ) : item.status === 'activated' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                            <CheckCircle2 className="h-3 w-3" /> Đã học thử (+7d Pro)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <Clock className="h-3 w-3" /> Đã đăng ký (Chờ kích hoạt)
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-right font-bold text-slate-900 dark:text-white">
                        {item.status === 'converted' ? (
                          <span className="text-emerald-600">+7d Pro & Hoa hồng %</span>
                        ) : item.status === 'activated' ? (
                          <span className="text-indigo-600">+7 Ngày Pro</span>
                        ) : (
                          <span className="text-slate-400">Đang chờ</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FAQ & Policy Notes */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-slate-500" />
            Quy Định & Cơ Chế Hoạt Động
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/40">
              <span className="font-bold text-slate-800 dark:text-slate-200">Điều kiện kích hoạt Tầng 1:</span>
              <p className="mt-1">
                Khi bạn bè đăng ký và duy trì streak học tập từ 3 ngày HOẶC tích lũy từ 30 từ vựng trở lên, cả hai bạn sẽ tự động được cộng thêm 7 ngày Pro VIP vào tài khoản.
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/40">
              <span className="font-bold text-slate-800 dark:text-slate-200">Quy chế rút tiền Tầng 2:</span>
              <p className="mt-1">
                Hoa hồng tiền mặt (15% - 20%) sẽ ở trạng thái chờ duyệt trong 7-14 ngày để chống giao dịch hoàn tiền. Số dư khả dụng từ 100.000đ trở lên có thể rút trực tiếp về ngân hàng qua VietQR 24/7.
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
                <h3 className="font-bold text-slate-900 dark:text-white">Rút Tiền Hoa Hồng</h3>
              </div>
              <button
                onClick={() => setIsPayoutOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayout} className="mt-4 space-y-4 text-xs">
              <div>
                <Label className="text-slate-700 dark:text-slate-300">Số tiền muốn rút (VNĐ)</Label>
                <Input
                  type="number"
                  min={100000}
                  max={Math.min(2000000, data?.stats.availableCash || 0)}
                  step={10000}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="mt-1 font-mono font-bold text-sm"
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Khả dụng: <span className="font-bold text-emerald-600">{formatVND(data?.stats.availableCash || 0)}</span> (Tối thiểu: 100.000đ)
                </p>
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300">Ngân hàng thụ hưởng</Label>
                <select
                  value={payoutBank}
                  onChange={(e) => setPayoutBank(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {POPULAR_BANKS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300">Số tài khoản ngân hàng</Label>
                <Input
                  type="text"
                  placeholder="Ví dụ: 1029384756"
                  value={payoutAccNumber}
                  onChange={(e) => setPayoutAccNumber(e.target.value)}
                  className="mt-1 font-mono font-bold"
                  required
                />
              </div>

              <div>
                <Label className="text-slate-700 dark:text-slate-300">Tên chủ tài khoản (Viết hoa không dấu)</Label>
                <Input
                  type="text"
                  placeholder="NGUYEN VAN A"
                  value={payoutAccHolder}
                  onChange={(e) => setPayoutAccHolder(e.target.value.toUpperCase())}
                  className="mt-1 font-bold uppercase"
                  required
                />
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
                  {isSubmittingPayout ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Xác nhận rút
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </StudentShell>
  );
}
