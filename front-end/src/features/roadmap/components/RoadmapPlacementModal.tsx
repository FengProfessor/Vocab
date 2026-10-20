import React, { useState } from 'react';
import { App, Modal, Radio, Space, Typography, theme } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/useAuthStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { CertLevel } from '@/types/enums/CertLevel';
import { RoadmapLevelId } from '@/types/enums/RoadmapLevelId';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';

interface RoadmapPlacementModalProps {
  /** Whether the modal is open. */
  open: boolean;
  /** Currently selected track. */
  track: RoadmapTrackType;
  /** Callback to close the modal. */
  onClose: () => void;
}

interface PlacementResponseDto {
  track: string;
  assignedLevel: string;
  startingUnitId: string;
}

/**
 * Diagnostic placement modal enabling learners to calibrate their starting roadmap station.
 */
export const RoadmapPlacementModal: React.FC<RoadmapPlacementModalProps> = ({
  open,
  track,
  onClose,
}) => {
  const { message } = App.useApp();
  const { token } = theme.useToken();
  const queryClient = useQueryClient();
  const { setTargetCertLevel } = useAuthStore();
  const [selectedBand, setSelectedBand] = useState<RoadmapLevelId>(RoadmapLevelId.B1);

  const placementMutation = useMutation({
    mutationFn: async (targetLevel: RoadmapLevelId) => {
      const response = await apiClient.post<ApiResponse<PlacementResponseDto>>(
        '/roadmap/placement',
        {
          track,
          levelId: targetLevel,
          score: 80,
        }
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      void message.success(
        `Đã phân loại trình độ xuất phát: ${data?.assignedLevel ?? selectedBand}`
      );
      if (selectedBand === RoadmapLevelId.B1) setTargetCertLevel(CertLevel.B1);
      else if (selectedBand === RoadmapLevelId.B2) setTargetCertLevel(CertLevel.B2);
      else if (selectedBand === RoadmapLevelId.A2) setTargetCertLevel(CertLevel.A2);

      void queryClient.invalidateQueries({ queryKey: ['roadmap', track] });
      onClose();
    },
  });

  const handleConfirmPlacement = (): void => {
    placementMutation.mutate(selectedBand);
  };

  return (
    <Modal
      title="Thiết lập Trình độ Xuất phát (Placement Diagnostic)"
      open={open}
      onCancel={onClose}
      onOk={handleConfirmPlacement}
      confirmLoading={placementMutation.isPending}
      okText="Xác nhận cấp độ"
      cancelText="Hủy"
      width={520}
    >
      <Space direction="vertical" size={16} style={{ width: '100%', marginTop: 8 }}>
        <Typography.Paragraph type="secondary">
          Chọn trình độ hiện tại của bạn để hệ thống tự động cá nhân hóa lộ trình học, bỏ qua các
          bài học cơ bản không cần thiết.
        </Typography.Paragraph>

        <div
          style={{
            padding: 16,
            background: token.colorFillAlter,
            borderRadius: 12,
            border: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Radio.Group
            value={selectedBand}
            onChange={(e) => setSelectedBand(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Radio value={RoadmapLevelId.A1}>
                <strong>Căn bản A1</strong>: Bắt đầu làm quen với phát âm & từ vựng thông dụng
              </Radio>
              <Radio value={RoadmapLevelId.A2}>
                <strong>Sơ cấp A2</strong>: Đã có nền tảng ngữ pháp cơ bản, bắt đầu luyện câu ghép
              </Radio>
              <Radio value={RoadmapLevelId.B1}>
                <strong>Trung cấp B1 (Mục tiêu VSTEP B1 / TOEIC 550)</strong>: Tự tin giao tiếp và đọc hiểu văn bản
              </Radio>
              <Radio value={RoadmapLevelId.B2}>
                <strong>Trung cao cấp B2 (Mục tiêu VSTEP B2 / TOEIC 750)</strong>: Nắm chắc từ vựng học thuật
              </Radio>
            </Space>
          </Radio.Group>
        </div>
      </Space>
    </Modal>
  );
};
