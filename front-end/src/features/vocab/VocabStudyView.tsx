import React, { useState, useEffect } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Progress,
  Row,
  Skeleton,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  ReloadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { FlashcardCard } from '@/features/vocab/components/FlashcardCard';
import { FlashcardRatingBar } from '@/features/vocab/components/FlashcardRatingBar';
import { FlashcardSessionSummaryModal } from '@/features/vocab/components/FlashcardSessionSummaryModal';
import { VocabQuizCard } from '@/features/vocab/components/VocabQuizCard';
import { WordImportDrawer } from '@/features/vocab/components/WordImportDrawer';
import { apiClient } from '@/lib/apiClient';
import { FsrsEngine } from '@/lib/fsrsEngine';
import { useAuthStore } from '@/stores/useAuthStore';
import { useStudyStore } from '@/stores/useStudyStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { CertLevel } from '@/types/enums/CertLevel';
import { PartOfSpeechType } from '@/types/enums/PartOfSpeechType';
import { SrsCardState } from '@/types/enums/SrsCardState';
import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';
import { VocabImportItemDto } from '@/types/vocab/VocabImportItemDto';
import { VocabWordDto } from '@/types/vocab/VocabWordDto';

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
 * Enhanced Vocabulary Study Hub supporting FSRS v5 flashcards, interactive quiz practice,
 * mathematical memory model telemetry, and bulk word import with Skeleton reload feedback.
 */
export const VocabStudyView: React.FC = () => {
  const { message } = App.useApp();
  const { user } = useAuthStore();
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

  const [importDrawerOpen, setImportDrawerOpen] = useState<boolean>(false);
  const [summaryModalOpen, setSummaryModalOpen] = useState<boolean>(false);
  const [sessionXpEarned, setSessionXpEarned] = useState<number>(0);

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
        setSessionXpEarned((prev) => prev + data.xpAwarded);
        void message.success(
          `Đã ghi nhận FSRS (+${data.xpAwarded} XP • Chu kỳ mới: ${data.intervalDays} ngày)`
        );
      }
    },
  });

  const handleGradeCard = (quality: SrsReviewQuality): void => {
    if (!currentCard) return;
    gradeCard(currentCard.id, quality);
    reviewMutation.mutate({ wordId: currentCard.id, quality });

    // Check if finished session
    if (activeCardIndex + 1 >= words.length) {
      setSummaryModalOpen(true);
    }
  };

  const handleImportBatch = (items: VocabImportItemDto[]): void => {
    items.forEach((item) => {
      addWordToDeck({
        word: item.word,
        phonetic: item.phonetic || '/.../',
        partOfSpeech: item.partOfSpeech,
        meaningVi: item.meaningVi,
        definitionEn: 'Người dùng nhập thủ công',
        exampleEn: item.exampleEn ?? '',
        exampleVi: item.exampleVi ?? '',
        certLevel: item.certLevel,
        audioUrl: null,
      });
    });
  };

  const currentCard: VocabWordDto | undefined = words[activeCardIndex] ?? words[0];

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
        badgeText="MODULE 03 • VOCABULARY & FSRS v5 ENGINE"
        title="Ôn tập Từ vựng Lặp lại Ngắt quãng (FSRS v5)"
        subtitle="Hệ thống FSRS v5 tối ưu hóa đường cong quên của Ebbinghaus, đồng bộ hàng đợi từ vựng với backend .NET 10."
        extra={
          <Space wrap>
            <Tag color="geekblue">Đã ôn trong phiên: {completedInSession} thẻ</Tag>
            <Button
              icon={<CloudUploadOutlined />}
              onClick={() => setImportDrawerOpen(true)}
            >
              Nhập từ vựng
            </Button>
            <Button
              icon={<SyncOutlined spin={dueWordsQuery.isFetching} />}
              loading={dueWordsQuery.isFetching}
              onClick={() => void dueWordsQuery.refetch()}
            >
              Tải từ đến hạn
            </Button>
            <Button icon={<ReloadOutlined />} onClick={resetAllCardsDueNow}>
              Đặt lại hàng đợi
            </Button>
          </Space>
        }
      />

      <Tabs
        defaultActiveKey="flashcard"
        items={[
          {
            key: 'flashcard',
            label: 'Thẻ Ghi nhớ FSRS v5',
            children: (
              <>
                {dueWordsQuery.isLoading ? (
                  <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                    <Col xs={24} lg={15}>
                      <Card style={{ minHeight: 340 }}>
                        <Skeleton active paragraph={{ rows: 6 }} />
                      </Card>
                    </Col>
                    <Col xs={24} lg={9}>
                      <Card style={{ minHeight: 340 }}>
                        <Skeleton active paragraph={{ rows: 5 }} />
                      </Card>
                    </Col>
                  </Row>
                ) : currentCard ? (
                  <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
                    <Col xs={24} lg={15}>
                      <FlashcardCard
                        word={currentCard}
                        isFlipped={isCardFlipped}
                        onToggleFlip={toggleFlip}
                      />
                      <FlashcardRatingBar
                        word={currentCard}
                        isLoading={reviewMutation.isPending}
                        isFlipped={isCardFlipped}
                        onGrade={handleGradeCard}
                        onToggleFlip={toggleFlip}
                      />
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
                ) : (
                  <Card style={{ textAlign: 'center', padding: '32px 0' }}>
                    <Empty
                      description="Hàng đợi hôm nay đã hoàn thành! Không có thẻ từ vựng nào cần ôn."
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Space>
                        <Button type="primary" onClick={() => setImportDrawerOpen(true)}>
                          Nhập thêm từ mới
                        </Button>
                        <Button onClick={resetAllCardsDueNow}>
                          Ôn lại toàn bộ thẻ
                        </Button>
                      </Space>
                    </Empty>
                  </Card>
                )}
              </>
            ),
          },
          {
            key: 'quiz',
            label: 'Luyện tập Trắc nghiệm (Quiz)',
            children: (
              // TODO: [Backend API Required] GET /api/v1/vocab/quiz?count=10 - Provide server-side quiz question generator in .NET 10 WebApi.
              <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <VocabQuizCard words={words} />
              </div>
            ),
          },
          {
            key: 'library',
            label: `Kho Từ Vựng (${words.length})`,
            children: (
              <Card
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#10b981' }} />
                    <span>Danh sách Thẻ từ vựng trong Bộ nhớ Dài hạn</span>
                  </Space>
                }
              >
                <Table<VocabWordDto>
                  rowKey="id"
                  columns={columns}
                  dataSource={words}
                  pagination={{ pageSize: 6 }}
                  loading={dueWordsQuery.isLoading}
                />
              </Card>
            ),
          },
        ]}
      />

      <WordImportDrawer
        open={importDrawerOpen}
        onClose={() => setImportDrawerOpen(false)}
        onImportWords={handleImportBatch}
      />

      <FlashcardSessionSummaryModal
        open={summaryModalOpen}
        cardsReviewedCount={completedInSession}
        xpEarned={sessionXpEarned || completedInSession * 15}
        streakDays={user?.streakDays ?? 1}
        onRestart={() => {
          resetAllCardsDueNow();
          setSummaryModalOpen(false);
        }}
        onClose={() => setSummaryModalOpen(false)}
      />
    </div>
  );
};
