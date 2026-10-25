import React, { useState } from 'react';
import { Button, Col, Row } from '@/components/ui/Primitives';
import { SyncOutlined } from '@/components/ui/Icons';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { GrammarStageViewer } from '@/features/grammar/components/GrammarStageViewer';
import { GrammarTopicList } from '@/features/grammar/components/GrammarTopicList';
import { useGrammarTopicsQuery } from '@/hooks/grammar/useGrammarTopicsQuery';
import { useSubmitGrammarProgress } from '@/hooks/grammar/useSubmitGrammarProgress';

/**
 * Grammar hub: canonical CEFR topics from GET /grammar/topics and mastery tracking via POST /grammar/progress.
 */
export const GrammarHubView: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const topicsQuery = useGrammarTopicsQuery();
  const progress = useSubmitGrammarProgress();

  const topics = topicsQuery.data ?? [];
  const activeTopic = topics.find((topic) => topic.id === selectedTopicId) ?? topics[0];

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 04 • GRAMMAR HUB"
        title="Ngữ pháp Chuyên sâu theo Chu trình 4 Bước"
        subtitle="Danh sách chuyên đề ngữ pháp chuẩn CEFR được tải từ máy chủ."
        extra={
          <Button
            icon={<SyncOutlined spin={topicsQuery.isFetching} />}
            loading={topicsQuery.isFetching}
            onClick={() => void topicsQuery.refetch()}
          >
            Làm mới từ Server
          </Button>
        }
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={10}>
          <GrammarTopicList
            topics={topics}
            selectedTopicId={activeTopic?.id ?? ''}
            isLoading={topicsQuery.isLoading}
            onSelectTopic={setSelectedTopicId}
          />
        </Col>
        <Col xs={24} lg={14}>
          {activeTopic && (
            <GrammarStageViewer
              topic={activeTopic}
              isSubmitting={progress.isPending}
              lastResult={progress.results[activeTopic.slug]}
              onSubmitAccuracy={(topicSlug, accuracyPercent) =>
                progress.mutate({ topicSlug, accuracyPercent })
              }
            />
          )}
        </Col>
      </Row>
    </div>
  );
};
