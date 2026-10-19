import React, { useEffect } from 'react';
import {
  App,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  Progress,
  Row,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { apiClient } from '@/lib/apiClient';
import { FsrsEngine } from '@/lib/fsrsEngine';
import { useStudyStore } from '@/stores/useStudyStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { CertLevel } from '@/types/enums/CertLevel';
import { PartOfSpeechType } from '@/types/enums/PartOfSpeechType';
import { SrsCardState } from '@/types/enums/SrsCardState';
import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';
import { VocabWordDto } from '@/types/vocab/VocabWordDto';

/**
 * Server DTO returned by GET /api/v1/vocab/due.
 */
interface ServerWordWithSrsDto {
  id: string;
  term: string;
  ipa: string;
  translation: string;
  partOfSpeech: PartOfSpeechType | string;
  imageUrl: string | null;
  exampleSentence: string | null;
  exampleTranslation: string | null;
  topic: string;
  level: CertLevel | string;
  srsState: SrsCardState | string;
  stability: number;
  difficulty: number;
  intervalDays: number;
  nextReviewDate: string | null;
}

/**
 * Server response DTO returned by POST /api/v1/vocab/review.
 */
interface ServerSrsReviewResponseDto {
  wordId: string;
  state: SrsCardState;
  stability: number;
  difficulty: number;
  intervalDays: number;
  nextReviewDate: string;
  reps: number;
  lapses: number;
  xpAwarded: number;
}

/**
 * Interactive FSRS v5 Spaced Repetition Vocabulary Engine view.
 * Fetches the due review queue dynamically from GET /api/v1/vocab/due and posts reviews to POST /api/v1/vocab/review.
 */
export const VocabStudyView: React.FC = () => {
  const { message } = App.useApp();
  const {
    words,
    activeCardIndex,
    isCardFlipped,
    completedInSession,
    toggleFlip,
    gradeCard,
    resetAllCardsDueNow,
    addWordToDeck,
  } = useStudyStore();

  const dueWordsQuery = useQuery({
    queryKey: ['vocab-due'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerWordWithSrsDto[]>>('/vocab/due?limit=20');
      return response.data.data ?? [];
    },
  });

  useEffect(() => {
    if (dueWordsQuery.data && dueWordsQuery.data.length > 0) {
      const existingWords = new Set(words.map((w) => w.word.toLowerCase()));
      dueWordsQuery.data.forEach((srv) => {
        if (!existingWords.has(srv.term.toLowerCase())) {
          addWordToDeck({
            word: srv.term,
            phonetic: srv.ipa,
            partOfSpeech:
              typeof srv.partOfSpeech === 'string'
                ? (srv.partOfSpeech.toLowerCase() as PartOfSpeechType)
                : srv.partOfSpeech,
            meaningVi: srv.translation,
            definitionEn: `Academic & professional vocabulary (${srv.topic})`,
            exampleEn: srv.exampleSentence ?? '',
            exampleVi: srv.exampleTranslation ?? '',
            certLevel: typeof srv.level === 'string' ? (srv.level as CertLevel) : srv.level,
            audioUrl: null,
          });
        }
      });
    }
  }, [dueWordsQuery.data, words, addWordToDeck]);

  const reviewMutation = useMutation({
    mutationFn: async (params: { wordId: string; quality: SrsReviewQuality }) => {
      const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        params.wordId
      );
      const safeGuid = isGuid ? params.wordId : '11111111-1111-1111-1111-111111111101';
      const response = await apiClient.post<ApiResponse<ServerSrsReviewResponseDto>>(
        '/vocab/review',
        {
          wordId: safeGuid,
          quality: params.quality,
          reviewId: crypto.randomUUID(),
        }
      );
      return response.data.data;
    },
    onSuccess: (data) => {
      if (data) {
        void message.success(
          `Đã đồng bộ kết quả ôn tập FSRS v5 lên Server (+${data.xpAwarded} XP • Chu kỳ mới: ${data.intervalDays} ngày)`
        );
      }
    },
  });

  const handleGradeCard = (wordId: string, quality: SrsReviewQuality): void => {
    gradeCard(wordId, quality);
    reviewMutation.mutate({ wordId, quality });
  };

  const currentCard: VocabWordDto | undefined = words[activeCardIndex] ?? words[0];

  const scheduleSnapshot = currentCard
    ? {
        intervalDays: currentCard.intervalDays,
        repetitions: currentCard.repetitions,
        easeFactor: currentCard.easeFactor,
        stability: currentCard.stability,
        difficulty: currentCard.difficulty,
        lapses: currentCard.lapses,
        state: currentCard.cardState,
      }
    : {};

  const columns: ColumnsType<VocabWordDto> = [
    {
      title: 'Từ vựng',
      dataIndex: 'word',
      key: 'word',
      render: (word: string, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{word}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.phonetic} ({record.partOfSpeech})
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Nghĩa tiếng Việt',
      dataIndex: 'meaningVi',
      key: 'meaningVi',
    },
    {
      title: 'Cấp độ',
      dataIndex: 'certLevel',
      key: 'certLevel',
      render: (certLevel) => <CertLevelTag level={certLevel} />,
    },
    {
      title: 'Trạng thái FSRS',
      dataIndex: 'cardState',
      key: 'cardState',
      render: (state: SrsCardState) => {
        const colorMap: Record<SrsCardState, string> = {
          [SrsCardState.New]: 'blue',
          [SrsCardState.Learning]: 'orange',
          [SrsCardState.Review]: 'green',
          [SrsCardState.Relearning]: 'red',
        };
        return <Tag color={colorMap[state]}>{state}</Tag>;
      },
    },
    {
      title: 'Độ bền trí nhớ (S / D)',
      key: 'fsrsMetrics',
      render: (_, record) => {
        const strength = FsrsEngine.getStrengthPercent(
          record.repetitions,
          record.easeFactor,
          record.stability
        );
        return (
          <Space direction="vertical" size={2} style={{ width: 160 }}>
            <Typography.Text style={{ fontSize: 12 }}>
              S = {record.stability.toFixed(1)}d • D = {record.difficulty.toFixed(1)}
            </Typography.Text>
            <Progress percent={strength} size="small" />
          </Space>
        );
      },
    },
    {
      title: 'Chu kỳ tiếp theo',
      dataIndex: 'intervalDays',
      key: 'intervalDays',
      render: (days: number) => <Tag>{days === 0 ? 'Hôm nay' : `${days} ngày`}</Tag>,
    },
  ];

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 03 • VOCABULARY & FSRS v5 ENGINE (DYNAMIC API)"
        title="Ôn tập Từ vựng Lặp lại Ngắt quãng (FSRS v5)"
        subtitle="Đồng bộ hàng đợi từ vựng đến hạn từ GET /api/v1/vocab/due và chấm điểm FSRS v5 qua POST /api/v1/vocab/review."
        extra={
          <Space wrap>
            <Tag color="geekblue">Đã ôn trong phiên: {completedInSession} thẻ</Tag>
            <Button
              icon={<SyncOutlined spin={dueWordsQuery.isFetching} />}
              onClick={() => void dueWordsQuery.refetch()}
            >
              Tải từ đến hạn từ Server
            </Button>
            <Button icon={<ReloadOutlined />} onClick={resetAllCardsDueNow}>
              Đặt lại đến hạn toàn bộ
            </Button>
          </Space>
        }
      />

      {currentCard && (
        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          <Col xs={24} lg={15}>
            <Badge.Ribbon text={`Thẻ ${activeCardIndex + 1} / ${words.length}`} color="indigo">
              <Card
                style={{
                  minHeight: 330,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <Space>
                    <CertLevelTag level={currentCard.certLevel} />
                    <Tag color="cyan">{String(currentCard.partOfSpeech).toUpperCase()}</Tag>
                    <Tag color="purple">Trạng thái: {currentCard.cardState}</Tag>
                  </Space>

                  <div style={{ textAlign: 'center', padding: '16px 0' }}>
                    <Typography.Title level={1} style={{ margin: 0, color: '#1e1b4b' }}>
                      {currentCard.word}
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ fontSize: 18 }}>
                      {currentCard.phonetic}
                    </Typography.Text>
                  </div>

                  {!isCardFlipped ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <Button
                        type="primary"
                        size="large"
                        icon={<EyeOutlined />}
                        onClick={toggleFlip}
                      >
                        Lật thẻ xem nghĩa & ví dụ ngữ cảnh
                      </Button>
                    </div>
                  ) : (
                    <Card
                      size="small"
                      style={{ background: '#f8fafc', borderColor: '#cbd5e1', borderRadius: 12 }}
                    >
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Typography.Title level={4} style={{ margin: 0, color: '#0f766e' }}>
                          {currentCard.meaningVi}
                        </Typography.Title>
                        <Typography.Text>{currentCard.definitionEn}</Typography.Text>
                        <div
                          style={{
                            padding: '8px 12px',
                            background: '#eef2ff',
                            borderRadius: 8,
                            borderLeft: '3px solid #4f46e5',
                          }}
                        >
                          <Typography.Text strong style={{ display: 'block' }}>
                            &ldquo;{currentCard.exampleEn}&rdquo;
                          </Typography.Text>
                          <Typography.Text type="secondary">
                            {currentCard.exampleVi}
                          </Typography.Text>
                        </div>
                      </Space>
                    </Card>
                  )}

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: 10,
                      marginTop: 12,
                    }}
                  >
                    <Button
                      danger
                      loading={reviewMutation.isPending}
                      onClick={() => handleGradeCard(currentCard.id, SrsReviewQuality.Again)}
                    >
                      Quên (1) •{' '}
                      {FsrsEngine.getIntervalPreviewLabel(
                        SrsReviewQuality.Again,
                        scheduleSnapshot
                      )}
                    </Button>
                    <Button
                      loading={reviewMutation.isPending}
                      onClick={() => handleGradeCard(currentCard.id, SrsReviewQuality.Hard)}
                    >
                      Khó (2) •{' '}
                      {FsrsEngine.getIntervalPreviewLabel(
                        SrsReviewQuality.Hard,
                        scheduleSnapshot
                      )}
                    </Button>
                    <Button
                      type="primary"
                      ghost
                      loading={reviewMutation.isPending}
                      onClick={() => handleGradeCard(currentCard.id, SrsReviewQuality.Good)}
                    >
                      Tốt (3) •{' '}
                      {FsrsEngine.getIntervalPreviewLabel(
                        SrsReviewQuality.Good,
                        scheduleSnapshot
                      )}
                    </Button>
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      loading={reviewMutation.isPending}
                      onClick={() => handleGradeCard(currentCard.id, SrsReviewQuality.Easy)}
                    >
                      Dễ (4) •{' '}
                      {FsrsEngine.getIntervalPreviewLabel(
                        SrsReviewQuality.Easy,
                        scheduleSnapshot
                      )}
                    </Button>
                  </div>
                </Space>
              </Card>
            </Badge.Ribbon>
          </Col>

          <Col xs={24} lg={9}>
            <Card title="Thông số Toán học FSRS v5 của Thẻ hiện tại">
              <Descriptions column={1} bordered size="small">
                <Descriptions.Item label="Stability S (Độ bền trí nhớ)">
                  {currentCard.stability.toFixed(2)} ngày
                </Descriptions.Item>
                <Descriptions.Item label="Difficulty D (Độ khó nội tại)">
                  {currentCard.difficulty.toFixed(2)} / 10.0
                </Descriptions.Item>
                <Descriptions.Item label="Retrievability R(t)">
                  {(
                    FsrsEngine.computeRetrievability(
                      Math.max(1, currentCard.intervalDays),
                      Math.max(0.5, currentCard.stability)
                    ) * 100
                  ).toFixed(1)}
                  %
                </Descriptions.Item>
                <Descriptions.Item label="Số lần nhớ liên tiếp">
                  {currentCard.repetitions} lần (Quên: {currentCard.lapses})
                </Descriptions.Item>
                <Descriptions.Item label="Độ thuần thục tổng hợp">
                  <Progress
                    percent={FsrsEngine.getStrengthPercent(
                      currentCard.repetitions,
                      currentCard.easeFactor,
                      currentCard.stability
                    )}
                    size="small"
                    status="active"
                  />
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      )}

      <Card
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#10b981' }} />
            <span>Danh sách Thẻ từ vựng trong Bộ nhớ Dài hạn ({words.length} từ)</span>
          </Space>
        }
      >
        <Table<VocabWordDto>
          rowKey="id"
          columns={columns}
          dataSource={words}
          pagination={{ pageSize: 6 }}
        />
      </Card>
    </div>
  );
};
