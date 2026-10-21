import { SubscriptionTierDto } from '@/types/billing/SubscriptionTierDto';
import { CurrencyType } from '@/types/enums/CurrencyType';
import { SubscriptionPlanType } from '@/types/enums/SubscriptionPlanType';

/**
 * Subscription plans offered on the pricing page.
 * TODO: [Backend API Required] GET /api/v1/billing/plans so prices and durations are served by the backend.
 */
export const PRICING_TIERS: readonly SubscriptionTierDto[] = [
  {
    planType: SubscriptionPlanType.Free,
    name: 'Gói Cơ Bản (Free)',
    priceAmount: 0,
    currency: CurrencyType.Vnd,
    billingPeriodLabel: 'Mãi mãi',
    durationMonths: 0,
    features: [
      'Ôn tập 20 thẻ từ vựng FSRS v5 mỗi ngày',
      'Tra cứu Từ điển Học thuật cơ bản',
      'Làm thử 1 đề VSTEP / TOEIC rút gọn',
    ],
  },
  {
    planType: SubscriptionPlanType.Pro,
    name: 'Gói Chinh Phục 90 Ngày (Pro)',
    priceAmount: 297000,
    currency: CurrencyType.Vnd,
    billingPeriodLabel: '3 tháng',
    durationMonths: 3,
    badgeText: 'Phổ biến nhất',
    features: [
      'Không giới hạn kho thẻ từ vựng FSRS v5 B1-C1',
      'Mở khóa 100% Phòng thi VSTEP 4 Kỹ năng & TOEIC 990',
      'Chấm bài Viết & Nói không giới hạn với Trợ lý Socratic AI',
      'Tham gia Thử thách Cam kết 30 ngày hoàn học phí',
    ],
  },
  {
    planType: SubscriptionPlanType.Premium,
    name: 'Gói Toàn Diện 12 Tháng (VIP)',
    priceAmount: 1190000,
    currency: CurrencyType.Vnd,
    billingPeriodLabel: '12 tháng',
    durationMonths: 12,
    badgeText: 'Tiết kiệm 45%',
    features: [
      'Toàn bộ quyền lợi Gói Pro 90 Ngày',
      'Lộ trình cá nhân hóa 1-kèm-1 từ A2 lên C1',
      'Ưu tiên chấm bài Writing/Speaking chuyên sâu',
      'Bảo lưu tài khoản miễn phí trong 60 ngày',
    ],
  },
];
