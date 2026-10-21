import React, { useState } from 'react';
import { Button, Card, Col, Row, Skeleton } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { DailyReadingCard } from '@/features/reading/components/DailyReadingCard';
import { ReadingArticleList } from '@/features/reading/components/ReadingArticleList';
import { ReadingArticleViewer } from '@/features/reading/components/ReadingArticleViewer';
import { useSaveTermToDeck } from '@/hooks/dictionary/useSaveTermToDeck';
import { useReadingRoomQuery } from '@/hooks/reading/useReadingRoomQuery';
import { JsonUtils } from '@/lib/jsonUtils';

/**
 * Reading room: published article library plus the personalized daily reading.
 * Words tapped in a passage are looked up in the dictionary and added to the FSRS deck.
 */
export const ReadingRoomView: React.FC = () => {
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');
  const readingQuery = useReadingRoomQuery();
  const saveTerm = useSaveTermToDeck();

  const articles = readingQuery.data?.articles ?? [];
  const daily = readingQuery.data?.daily ?? null;
  const activeArticle = articles.find((a) => a.id === selectedArticleId) ?? articles[0];
  const dailyKeywords = JsonUtils.parseArray<string>(daily?.usedWordsJson);
  const savingWord = saveTerm.isPending ? saveTerm.variables : null;

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 05 • READING ROOM"
        title="Phòng Đọc Hiểu & Thu Thập Từ Vựng Ngữ Cảnh"
        subtitle="Thư viện bài đọc đã xuất bản và bài đọc hàng ngày cá nhân hóa theo sổ từ của bạn."
        extra={
          <Button
            icon={<SyncOutlined spin={readingQuery.isFetching} />}
            loading={readingQuery.isFetching}
            onClick={() => void readingQuery.refetch()}
          >
            Tải lại từ Server
          </Button>
        }
      />

      <DailyReadingCard
        daily={daily}
        keywords={dailyKeywords}
        savingWord={savingWord}
        onSaveWord={(word) => saveTerm.mutate(word)}
      />

      {readingQuery.isLoading ? (
        <Row gutter={[20, 20]}>
          <Col xs={24} md={8}>
            <Card>
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
          </Col>
          <Col xs={24} md={16}>
            <Card>
              <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
          </Col>
        </Row>
      ) : (
        <Row gutter={[20, 20]}>
          <Col xs={24} md={8}>
            <ReadingArticleList
              articles={articles}
              selectedArticleId={activeArticle?.id ?? ''}
              onSelectArticle={setSelectedArticleId}
            />
          </Col>
          <Col xs={24} md={16}>
            <ReadingArticleViewer
              article={activeArticle}
              keywords={[]}
              savingWord={savingWord}
              onSaveWord={(word) => saveTerm.mutate(word)}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};
