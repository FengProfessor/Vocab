import React from 'react';
import { Card, Segmented, Space, Typography, theme } from 'antd';
import {
  CompassOutlined,
  CustomerServiceOutlined,
  FileProtectOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { RoadmapTrackType } from '@/types/enums/RoadmapTrackType';

interface RoadmapTrackSelectorProps {
  /** Currently selected roadmap track. */
  activeTrack: RoadmapTrackType;
  /** Callback fired when user selects a different track. */
  onChangeTrack: (track: RoadmapTrackType) => void;
}

/**
 * Segmented track switcher allowing students to toggle between VSTEP, TOEIC, CEFR, and THPT curriculums.
 */
export const RoadmapTrackSelector: React.FC<RoadmapTrackSelectorProps> = ({
  activeTrack,
  onChangeTrack,
}) => {
  const { token } = theme.useToken();

  const options = [
    {
      value: RoadmapTrackType.Vstep,
      label: (
        <Space size={6}>
          <FileProtectOutlined />
          <span>VSTEP B1-C1</span>
        </Space>
      ),
    },
    {
      value: RoadmapTrackType.Toeic,
      label: (
        <Space size={6}>
          <CustomerServiceOutlined />
          <span>TOEIC 450-800+</span>
        </Space>
      ),
    },
    {
      value: RoadmapTrackType.Cefr,
      label: (
        <Space size={6}>
          <CompassOutlined />
          <span>Khung CEFR (A0-B2)</span>
        </Space>
      ),
    },
    {
      value: RoadmapTrackType.Thpt,
      label: (
        <Space size={6}>
          <ReadOutlined />
          <span>Ôn thi THPT Quốc Gia</span>
        </Space>
      ),
    },
  ];

  return (
    <Card
      size="small"
      style={{
        marginBottom: 20,
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Typography.Text strong style={{ fontSize: 14 }}>
          Lựa chọn lộ trình học mục tiêu:
        </Typography.Text>
        <Segmented<RoadmapTrackType>
          options={options}
          value={activeTrack}
          onChange={onChangeTrack}
          size="middle"
        />
      </div>
    </Card>
  );
};
