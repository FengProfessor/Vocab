import React from 'react';
import { Card, Progress, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined } from '@ant-design/icons';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { SRS_CARD_STATE_TAG_COLOR } from '@/config/srsCardStateTagColor';
import { VocabLibraryTableProps } from '@/features/vocab/types/VocabLibraryTableProps';
import { FsrsEngine } from '@/lib/fsrsEngine';
import { VocabWordDto } from '@/types/vocab/VocabWordDto';

const COLUMNS: ColumnsType<VocabWordDto> = [
  {
    title: 'Từ vựng',
    dataIndex: 'word',
    render: (word: string, record) => (
      <Space direction="vertical" size={0}>
        <Typography.Text strong>{word}</Typography.Text>
        <Typography.Text type="secondary">
          {record.phonetic} ({record.partOfSpeech})
        </Typography.Text>
      </Space>
    ),
  },
  { title: 'Nghĩa tiếng Việt', dataIndex: 'meaningVi' },
  {
    title: 'Cấp độ',
    dataIndex: 'certLevel',
    render: (level) => <CertLevelTag level={level} />,
  },
  {
    title: 'Trạng thái FSRS',
    dataIndex: 'cardState',
    render: (state: VocabWordDto['cardState']) => (
      <Tag color={SRS_CARD_STATE_TAG_COLOR[state]}>{state}</Tag>
    ),
  },
  {
    title: 'Độ bền trí nhớ (S / D)',
    key: 'fsrsMetrics',
    render: (_, record) => (
      <Space direction="vertical" size={2}>
        <Typography.Text type="secondary">
          S = {record.stability.toFixed(1)}d • D = {record.difficulty.toFixed(1)}
        </Typography.Text>
        <Progress
          percent={FsrsEngine.getStrengthPercent(record.repetitions, record.easeFactor, record.stability)}
          size="small"
        />
      </Space>
    ),
  },
  {
    title: 'Chu kỳ tiếp theo',
    dataIndex: 'intervalDays',
    render: (days: number) => <Tag>{days === 0 ? 'Hôm nay' : `${days} ngày`}</Tag>,
  },
];

/**
 * Long-term memory library: every card with its FSRS state and next interval.
 */
export const VocabLibraryTable: React.FC<VocabLibraryTableProps> = ({ words, isLoading }) => {
  return (
    <Card
      title={
        <Space>
          <CheckCircleOutlined />
          <span>Danh sách Thẻ từ vựng trong Bộ nhớ Dài hạn</span>
        </Space>
      }
    >
      <Table<VocabWordDto>
        rowKey="id"
        columns={COLUMNS}
        dataSource={words}
        loading={isLoading}
        pagination={{ pageSize: 6 }}
      />
    </Card>
  );
};
