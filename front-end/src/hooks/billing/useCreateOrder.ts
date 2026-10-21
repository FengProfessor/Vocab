import { App } from 'antd';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ServerOrderDto } from '@/types/billing/ServerOrderDto';
import { OrderKind } from '@/types/enums/OrderKind';
import { CreateOrderParams } from '@/hooks/types/CreateOrderParams';

/**
 * Creates an individual subscription order via POST /api/v1/billing/orders; the duration comes from the tier definition.
 */
export function useCreateOrder() {
  const { message } = App.useApp();

  return useMutation({
    mutationFn: async ({ tier, couponCode }: CreateOrderParams) => {
      const response = await apiClient.post<ApiResponse<ServerOrderDto>>('/billing/orders', {
        planId: tier.planType,
        orderKind: OrderKind.Individual,
        durationMonths: tier.durationMonths,
        seatLimit: 1,
        couponCode,
        targetChallengeId: null,
      });
      return response.data.data;
    },
    onSuccess: (order) => {
      if (order) {
        void message.success(`Đã tạo đơn hàng (Nội dung chuyển khoản: ${order.transferCode})`);
      }
    },
  });
}
