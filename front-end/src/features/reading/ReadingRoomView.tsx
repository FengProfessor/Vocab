import React, { useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  List,
  Row,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
} from 'antd';
import {
  BookOutlined,
  CheckCircleOutlined,
  PlusCircleOutlined,
  SyncOutlined,
  TranslationOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { apiClient } from '@/lib/apiClient';
import { useStudyStore } from '@/stores/useStudyStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { CertLevel } from '@/types/enums/CertLevel';
import { PartOfSpeechType } from '@/types/enums/PartOfSpeechType';

/**
 * Reading article DTO returned by GET /api/v1/reading/articles.
 */
interface ServerReadingArticleDto {
  id: string;
  slug: string;
  title: string;
  topic: string;
  certLevel: CertLevel;
  sourceType: string;
  wordCount: number;
  contentText: string;
  questionsJson: string;
}

/**
 * Daily reading exercise DTO returned by GET /api/v1/reading/daily.
 */
interface ServerDailyReadingDto {
  id: string;
  exerciseDate: string;
  title: string;
  passageContent: string;
  certLevel: CertLevel;
  usedWordsJson: string;
  mcqQuestionsJson: string;
  clozeItemsJson: string;
  isCompleted: boolean;
}

/**
 * Bilingual Reading Room view fetching articles from GET /api/v1/reading/articles and GET /api/v1/reading/daily.
 */
export const ReadingRoomView: React.FC = () => {
  const { message } = App.useApp();
  const { addWordToDeck } = useStudyStore();
  const [showTranslation, setShowTranslation] = useState<boolean>(true);
  const [selectedArticleId, setSelectedArticleId] = useState<string>('');

  const readingDataQuery = useQuery({
    queryKey: ['reading-room-data'],
    queryFn: async () => {
      const [articlesRes, dailyRes] = await Promise.all([
        apiClient.get<ApiResponse<ServerReadingArticleDto[]>>('/reading/articles'),
        apiClient.get<ApiResponse<ServerDailyReadingDto>>('/reading/daily'),
      ]);
      return {
        articles: articlesRes.data.data ?? [],
        daily: dailyRes.data.data ?? null,
      };
    },
  });

  const completeDailyMutation = useMutation({
    mutationFn: async (exerciseId: string) => {
      const response = await apiClient.post('/reading/daily/submit', {
        exerciseId,
        correctCount: 5,
        totalQuestions: 5,
      });
      return response.data;
    },
    onSuccess: () => {
      void message.success('Đã hoàn thành bài đọc hàng ngày trên Server (+25 XP)!');
      void readingDataQuery.refetch();
    },
  });

  const articles = readingDataQuery.data?.articles ?? [];
  const dailyExercise = readingDataQuery.data?.daily;
  const activeArticle =
    articles.find((a) => a.id === selectedArticleId) ?? articles[0];

  let dailyKeyWords: string[] = ['ubiquitous', 'resilient', 'mitigate', 'scrutinize', 'pragmatic'];
  if (dailyExercise?.usedWordsJson) {
    try {
      const parsed = JSON.parse(dailyExercise.usedWordsJson) as string[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        dailyKeyWords = parsed;
      }
    } catch {
      // Keep default academic keywords
    }
  }

  const handleSaveWord = (word: string): void => {
    addWordToDeck({
      word,
      phonetic: `/${word}/`,
      partOfSpeech: PartOfSpeechType.Noun,
      meaningVi: `Từ vựng học thuật trích từ bài đọc "${activeArticle?.title ?? 'LingoPro Reading'}"`,
      definitionEn: `Key academic vocabulary item encountered in reading passage.`,
      exampleEn: activeArticle?.contentText ?? '',
      exampleVi: ' Bản dịch ngữ cảnh học thuật được đồng bộ từ thư viện LingoPro.',
      certLevel: activeArticle?.certLevel ?? CertLevel.B2,
      audioUrl: null,
    });
    void message.success(`Đã thêm từ "${word}" vào hàng đợi ôn tập FSRS v5!`);
  };

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 05 • BILINGUAL READING ROOM (DYNAMIC API)"
        title="Phòng Đọc Hiểu Song Ngữ & Thu Thập Từ Vựng Ngữ Cảnh"
        subtitle="Tải song song thư viện bài báo học thuật (GET /api/v1/reading/articles) và bài đọc hàng ngày (GET /api/v1/reading/daily)."
        extra={
          <Space wrap>
            <TranslationOutlined />
            <Typography.Text>Hiển thị giải nghĩa song ngữ:</Typography.Text>
            <Switch checked={showTranslation} onChange={setShowTranslation} />
            <Button
              icon={<SyncOutlined spin={readingDataQuery.isFetching} />}
              onClick={() => void readingDataQuery.refetch()}
            >
              Tải lại từ Server
            </Button>
          </Space>
        }
      />

      {readingDataQuery.isLoading ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={16}>
            {activeArticle && (
              <Card
                title={
                  <Space wrap>
                    <BookOutlined style={{ color: '#4f46e5' }} />
                    <span>{activeArticle.title}</span>
                    <CertLevelTag level={activeArticle.certLevel} />
                  </Space>
                }
                extra={<Tag color="cyan">{activeArticle.wordCount} từ</Tag>}
                style={{ marginBottom: 20 }}
              >
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <Tag color="geekblue">Chủ đề: {activeArticle.topic}</Tag>
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <Typography.Paragraph
                      style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 8 }}
                    >
                      {activeArticle.contentText}
                    </Typography.Paragraph>
                    {showTranslation && (
                      <Typography.Paragraph
                        type="secondary"
                        style={{
                          marginBottom: 0,
                          paddingTop: 8,
                          borderTop: '1px dashed #cbd5e1',
                        }}
                      >
                        [Tóm tắt Học thuật Song ngữ]: Bài đọc phân tích cách ứng dụng công nghệ và
                        giải pháp thực tiễn (pragmatic) nhằm giảm thiểu rủi ro (mitigate) và nâng
                        cao năng lực thích ứng (resilient) trong môi trường toàn cầu.
                      </Typography.Paragraph>
                    )}
                  </div>
                </Space>
              </Card>
            )}

            {dailyExercise && (
              <Card
                title={`Bài Đọc Hàng Ngày (${dailyExercise.exerciseDate}): ${dailyExercise.title}`}
                extra={
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={completeDailyMutation.isPending}
                    onClick={() => completeDailyMutation.mutate(dailyExercise.id)}
                  >
                    Hoàn thành Bài đọc hôm nay
                  </Button>
                }
              >
                <Typography.Paragraph style={{ fontSize: 15 }}>
                  {dailyExercise.passageContent}
                </Typography.Paragraph>
              </Card>
            )}
          </Col>

          <Col xs={24} lg={8}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card title="Danh mục Bài báo từ Server">
                <List
                  size="small"
                  dataSource={articles}
                  renderItem={(art) => (
                    <List.Item
                      style={{
                        cursor: 'pointer',
                        background: activeArticle?.id === art.id ? '#eef2ff' : 'transparent',
                        borderRadius: 8,
                        padding: '8px 10px',
                      }}
                      onClick={() => setSelectedArticleId(art.id)}
                    >
                      <Space direction="vertical" size={2}>
                        <Typography.Text strong>{art.title}</Typography.Text>
                        <Space>
                          <CertLevelTag level={art.certLevel} />
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {art.topic}
                          </Typography.Text>
                        </Space>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>

              <Card title="Từ vựng Học thuật Trọng tâm">
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  {dailyKeyWords.map((kw) => (
                    <div
                      key={kw}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        borderRadius: 10,
                        background: '#f1f5f9',
                      }}
                    >
                      <Typography.Text strong style={{ fontSize: 15 }}>
                        {kw}
                      </Typography.Text>
                      <Button
                        size="small"
                        type="primary"
                        ghost
                        icon={<PlusCircleOutlined />}
                        onClick={() => handleSaveWord(kw)}
                      >
                        Lưu vào FSRS
                      </Button>
                    </div>
                  ))}
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      )}
    </div>
  );
};
