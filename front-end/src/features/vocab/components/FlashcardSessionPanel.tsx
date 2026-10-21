import React from 'react';
import { Badge, Button, Card, Col, Empty, Row, Skeleton, Space } from 'antd';
import { FlashcardCard } from '@/features/vocab/components/FlashcardCard';
import { FlashcardRatingBar } from '@/features/vocab/components/FlashcardRatingBar';
import { FsrsMetricsCard } from '@/features/vocab/components/FsrsMetricsCard';
import { FlashcardSessionPanelProps } from '@/features/vocab/types/FlashcardSessionPanelProps';

/**
 * Flashcard review tab: skeleton while loading, empty state when nothing is due,
 * otherwise the active card, rating bar and FSRS metrics.
 */
export const FlashcardSessionPanel: React.FC<FlashcardSessionPanelProps> = ({
  word,
  remainingCount,
  isLoading,
  isGrading,
  isFlipped,
  onToggleFlip,
  onGrade,
  onOpenImport,
  onRestart,
}) => {
  if (isLoading) {
    return (
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={15}>
          <Card>
            <Skeleton active paragraph={{ rows: 6 }} />
          </Card>
        </Col>
        <Col xs={24} lg={9}>
          <Card>
            <Skeleton active paragraph={{ rows: 5 }} />
          </Card>
        </Col>
      </Row>
    );
  }

  if (!word) {
    return (
      <Card>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Hàng đợi hôm nay đã hoàn thành! Không có thẻ nào đến hạn ôn."
        >
          <Space>
            <Button type="primary" onClick={onOpenImport}>
              Nhập thêm từ mới
            </Button>
            <Button onClick={onRestart}>Ôn lại toàn bộ thẻ</Button>
          </Space>
        </Empty>
      </Card>
    );
  }

  return (
    <Row gutter={[20, 20]}>
      <Col xs={24} lg={15}>
        <Badge.Ribbon text={`Còn ${remainingCount} thẻ`} color="indigo">
          <FlashcardCard word={word} isFlipped={isFlipped} onToggleFlip={onToggleFlip} />
        </Badge.Ribbon>
        <FlashcardRatingBar
          word={word}
          isLoading={isGrading}
          isFlipped={isFlipped}
          onGrade={onGrade}
          onToggleFlip={onToggleFlip}
        />
      </Col>
      <Col xs={24} lg={9}>
        <FsrsMetricsCard word={word} />
      </Col>
    </Row>
  );
};
