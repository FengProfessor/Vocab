import { App } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerCouponValidationDto } from '@/types/billing/ServerCouponValidationDto';

/**
 * Validates a coupon through GET /api/v1/billing/coupons/validate.
 */
export function useValidateCoupon() {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async (code: string) => {
      const response = await apiClient.get<ApiResponse<ServerCouponValidationDto>>(
        '/billing/coupons/validate',
        { params: { code } }
      );
      return response.data.data;
    },
    onSuccess: (coupon) => {
      if (coupon?.isValid) {
        void message.success(`Mã ${coupon.code} hợp lệ: giảm ${coupon.discountPercent}%`);
      } else {
        void message.warning('Mã giảm giá không hợp lệ hoặc đã hết hạn.');
      }
    },
    onError: () => {
      void message.error('Không kiểm tra được mã giảm giá.');
    },
  });
}
