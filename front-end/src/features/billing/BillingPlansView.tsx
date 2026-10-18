import React, { useState } from 'react';
import {
  Alert,
  App,
  Badge,
  Button,
  Card,
  Col,
  Input,
  List,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { CheckOutlined, CrownFilled, QrcodeOutlined, TagOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { SubscriptionTierDto } from '@/types/billing/SubscriptionTierDto';
import { CurrencyType } from '@/types/enums/CurrencyType';
import { OrderKind } from '@/types/enums/OrderKind';
import { SubscriptionPlanType } from '@/types/enums/SubscriptionPlanType';

/**
 * Coupon validation DTO returned by GET /api/v1/billing/coupons/validate.
 */
interface ServerCouponValidationDto {
  code: string;
  discountPercent: number;
  maxDiscountAmount: number | null;
  isValid: boolean;
}

/**
 * Order DTO returned by POST /api/v1/billing/orders.
 */
interface ServerOrderDto {
  id: string;
  userId: string;
  planId: SubscriptionPlanType;
  orderKind: OrderKind;
  durationMonths: number;
  seatLimit: number;
  amount: number;
  currency: string;
  status: string;
  transferCode: string;
  qrUrl: string;
  createdAt: string;
}

/**
 * Available LingoPro subscription plans.
 */
const PRICING_TIERS: SubscriptionTierDto[] = [
  {
    planType: SubscriptionPlanType.Free,
    name: 'Gói Cơ Bản (Free)',
    priceAmount: 0,
    currency: CurrencyType.Vnd,
    billingPeriodLabel: 'Mãi mãi',
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
    badgeText: 'Tiết kiệm 45%',
    features: [
      'Toàn bộ quyền lợi Gói Pro 90 Ngày',
      'Lộ trình cá nhân hóa 1-kèm-1 từ A2 lên C1',
      'Ưu tiên chấm bài Writing/Speaking chuyên sâu',
      'Bảo lưu tài khoản miễn phí trong 60 ngày',
    ],
  },
];

/**
 * Subscription Plans & Instant VietQR Checkout module calling GET /api/v1/billing/coupons/validate
 * and POST /api/v1/billing/orders dynamically on the .NET 10 server.
 */
export const BillingPlansView: React.FC = () => {
  const { message } = App.useApp();
  const [couponCode, setCouponCode] = useState<string>('LINGOPRO20');
  const [validatedCoupon, setValidatedCoupon] = useState<ServerCouponValidationDto | null>(null);
  const [createdOrder, setCreatedOrder] = useState<ServerOrderDto | null>(null);

  const validateCouponMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiClient.get<ApiResponse<ServerCouponValidationDto>>(
        `/billing/coupons/validate?code=${encodeURIComponent(code)}`
      );
      return response.data.data;
    },
    onSuccess: (res) => {
      if (res) {
        setValidatedCoupon(res);
        void message.success(`Mã giảm giá ${res.code} hợp lệ: Giảm ${res.discountPercent}%!`);
      }
    },
    onError: () => {
      void message.error('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (planType: SubscriptionPlanType) => {
      const response = await apiClient.post<ApiResponse<ServerOrderDto>>('/billing/orders', {
        planId: planType,
        orderKind: OrderKind.Individual,
        durationMonths: planType === SubscriptionPlanType.Premium ? 6 : 3,
        seatLimit: 1,
        couponCode: couponCode.trim() || null,
        targetChallengeId: null,
      });
      return response.data.data;
    },
    onSuccess: (order) => {
      if (order) {
        setCreatedOrder(order);
        void message.success(
          `Đã khởi tạo đơn hàng VietQR từ Server (Mã CK: ${order.transferCode})!`
        );
      }
    },
  });

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 12 • SUBSCRIPTION & VIETQR BILLING (DYNAMIC API)"
        title="Nâng Cấp Tài Khoản LingoPro Pro & Thanh Toán Tự Động"
        subtitle="Kiểm tra mã giảm giá qua GET /api/v1/billing/coupons/validate và khởi tạo mã QR chuyển khoản qua POST /api/v1/billing/orders."
      />

      <Card style={{ marginBottom: 20 }}>
        <Space wrap align="center">
          <TagOutlined style={{ color: '#4f46e5' }} />
          <Typography.Text strong>Mã ưu đãi (Thử: LINGOPRO20 hoặc VIP30):</Typography.Text>
          <Input
            style={{ width: 200 }}
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Nhập mã giảm giá..."
          />
          <Button
            loading={validateCouponMutation.isPending}
            onClick={() => validateCouponMutation.mutate(couponCode)}
          >
            Kiểm tra trên Server
          </Button>
          {validatedCoupon && (
            <Tag color="green">
              Đã áp dụng {validatedCoupon.code}: -{validatedCoupon.discountPercent}%
            </Tag>
          )}
        </Space>
      </Card>

      <Row gutter={[20, 20]}>
        {PRICING_TIERS.map((tier) => {
          const cardContent = (
            <Card
              key={tier.planType}
              title={
                <Space>
                  <CrownFilled style={{ color: '#f59e0b' }} />
                  <span>{tier.name}</span>
                </Space>
              }
              style={{ height: '100%' }}
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <div>
                  <Typography.Title level={2} style={{ margin: 0, color: '#4f46e5' }}>
                    {tier.priceAmount.toLocaleString('vi-VN')} ₫
                  </Typography.Title>
                  <Tag>{tier.billingPeriodLabel}</Tag>
                </div>

                <List
                  size="small"
                  dataSource={tier.features}
                  renderItem={(feat) => (
                    <List.Item style={{ padding: '6px 0', border: 0 }}>
                      <Space>
                        <CheckOutlined style={{ color: '#10b981' }} />
                        <Typography.Text>{feat}</Typography.Text>
                      </Space>
                    </List.Item>
                  )}
                />

                <Button
                  type={tier.planType === SubscriptionPlanType.Pro ? 'primary' : 'default'}
                  block
                  disabled={tier.priceAmount === 0}
                  loading={createOrderMutation.isPending}
                  icon={<QrcodeOutlined />}
                  onClick={() => createOrderMutation.mutate(tier.planType)}
                >
                  {tier.priceAmount === 0 ? 'Đang sử dụng' : 'Tạo đơn VietQR từ Server'}
                </Button>
              </Space>
            </Card>
          );

          return (
            <Col xs={24} lg={8} key={tier.planType}>
              {tier.badgeText ? (
                <Badge.Ribbon text={tier.badgeText} color="indigo">
                  {cardContent}
                </Badge.Ribbon>
              ) : (
                cardContent
              )}
            </Col>
          );
        })}
      </Row>

      <Modal
        open={Boolean(createdOrder)}
        onCancel={() => setCreatedOrder(null)}
        footer={[
          <Button key="close" type="primary" onClick={() => setCreatedOrder(null)}>
            Hoàn tất
          </Button>,
        ]}
        title="Biên Lai Đơn Hàng & Mã Thanh Toán VietQR (Từ .NET 10 Server)"
      >
        {createdOrder && (
          <Space direction="vertical" size={12} style={{ width: '100%', textAlign: 'center' }}>
            <Alert
              type="success"
              showIcon
              message={`Nội dung chuyển khoản: ${createdOrder.transferCode}`}
              description={`Số tiền sau ưu đãi: ${createdOrder.amount.toLocaleString('vi-VN')} ${createdOrder.currency}`}
            />
            <img
              src={createdOrder.qrUrl}
              alt="VietQR Payment"
              style={{ maxWidth: 260, margin: '0 auto', borderRadius: 12 }}
            />
          </Space>
        )}
      </Modal>
    </div>
  );
};
