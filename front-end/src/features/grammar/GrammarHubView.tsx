import React, { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Progress,
  Radio,
  Row,
  Space,
  Spin,
  Steps,
  Tag,
  Typography,
} from 'antd';
import {
  CheckCircleFilled,
  ExperimentOutlined,
  ReadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { CertLevel } from '@/types/enums/CertLevel';
import { GrammarLevel } from '@/types/enums/GrammarLevel';
import { GrammarMicroStage } from '@/types/enums/GrammarMicroStage';

/**
 * Canonical grammar topic DTO returned by GET /api/v1/grammar/topics.
 */
interface ServerGrammarTopicDto {
  id: string;
  slug: string;
  title: string;
  titleVi: string | null;
  level: GrammarLevel | string;
  certLevel: CertLevel | string;
  category: string;
  sortOrder: number;
}

/**
 * 4-Stage Micro-Learning Grammar Hub fetching canonical topics from GET /api/v1/grammar/topics
 * and recording mastery via POST /api/v1/grammar/progress.
 */
export const GrammarHubView: React.FC = () => {
  const { message } = App.useApp();
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [quizAnswer, setQuizAnswer] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);

  const topicsQuery = useQuery({
    queryKey: ['grammar-topics'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerGrammarTopicDto[]>>('/grammar/topics');
      return response.data.data ?? [];
    },
  });

  const submitProgressMutation = useMutation({
    mutationFn: async (topicId: string) => {
      const response = await apiClient.post('/grammar/progress', {
        topicId,
        stage: GrammarMicroStage.A1,
        scorePercent: 100,
      });
      return response.data;
    },
    onSuccess: () => {
      void message.success('Đã lưu tiến độ làm chủ chủ điểm ngữ pháp lên Server!');
    },
  });

  const topics = topicsQuery.data ?? [];
  const activeTopic =
    topics.find((t) => t.id === selectedTopicId) ?? topics[0];

  const handleCheckGrammarQuiz = (): void => {
    if (!quizAnswer) {
      void message.warning('Vui lòng chọn một đáp án trước khi kiểm tra.');
      return;
    }
    setIsVerified(true);
    if (quizAnswer === 'B') {
      void message.success('Chính xác! Đang đồng bộ điểm làm chủ lên máy chủ...');
      if (activeTopic) {
        submitProgressMutation.mutate(activeTopic.id);
      }
    } else {
      void message.error('Chưa chính xác. Hãy xem giải thích công thức bên dưới.');
    }
  };

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 04 • 4-STAGE MICRO-LEARNING GRAMMAR HUB (DYNAMIC API)"
        title="Ngữ pháp Chuyên sâu theo Chu trình 4 Bước"
        subtitle="Danh sách chuyên đề ngữ pháp chuẩn CEFR được tải động từ GET /api/v1/grammar/topics."
        extra={
          <Button
            icon={<SyncOutlined spin={topicsQuery.isFetching} />}
            onClick={() => void topicsQuery.refetch()}
          >
            Làm mới từ Server
          </Button>
        }
      />

      {topicsQuery.isLoading ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={10}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {topics.map((topic, idx) => {
                const isSelected = activeTopic?.id === topic.id;
                return (
                  <Card
                    key={topic.id}
                    hoverable
                    onClick={() => {
                      setSelectedTopicId(topic.id);
                      setIsVerified(false);
                    }}
                    style={{
                      borderColor: isSelected ? '#4f46e5' : '#e2e8f0',
                      borderWidth: isSelected ? 2 : 1,
                    }}
                  >
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      <Space>
                        <Tag color="indigo">{String(topic.certLevel).toUpperCase()}</Tag>
                        <Tag color="cyan">{topic.category}</Tag>
                      </Space>
                      <Typography.Text strong style={{ fontSize: 15 }}>
                        {topic.titleVi ?? topic.title}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {topic.title}
                      </Typography.Text>
                      <Progress percent={Math.min(95, 55 + idx * 8)} size="small" />
                    </Space>
                  </Card>
                );
              })}
            </Space>
          </Col>

          <Col xs={24} lg={14}>
            {activeTopic && (
              <Card
                title={
                  <Space>
                    <ReadOutlined style={{ color: '#4f46e5' }} />
                    <span>{activeTopic.titleVi ?? activeTopic.title}</span>
                  </Space>
                }
              >
                <Space direction="vertical" size={18} style={{ width: '100%' }}>
                  <Steps
                    size="small"
                    current={isVerified && quizAnswer === 'B' ? 3 : 1}
                    items={[
                      { title: '1. Khám phá' },
                      { title: '2. Luyện tập' },
                      { title: '3. Kiểm tra' },
                      { title: '4. Làm chủ' },
                    ]}
                  />

                  <Alert
                    type="info"
                    showIcon
                    message={`Chuyên đề: ${activeTopic.title} (${activeTopic.category})`}
                    description="Ứng dụng trực tiếp trong TOEIC Part 5/6 và nâng điểm tiêu chí Grammatical Range & Accuracy trong VSTEP Writing Task 2."
                  />

                  <Card
                    size="small"
                    title={
                      <Space>
                        <ExperimentOutlined />
                        <span>Bài tập Thực chiến (Mastery Check)</span>
                      </Space>
                    }
                    style={{ background: '#f8fafc' }}
                  >
                    <Space direction="vertical" size={12} style={{ width: '100%' }}>
                      <Typography.Text strong>
                        Câu hỏi: It is essential that every project manager ------- the updated
                        security guidelines before Friday.
                      </Typography.Text>

                      <Radio.Group
                        value={quizAnswer}
                        onChange={(e) => {
                          setQuizAnswer(e.target.value);
                          setIsVerified(false);
                        }}
                      >
                        <Space direction="vertical">
                          <Radio value="A">A. reviews</Radio>
                          <Radio value="B">B. review</Radio>
                          <Radio value="C">C. reviewed</Radio>
                          <Radio value="D">D. reviewing</Radio>
                        </Space>
                      </Radio.Group>

                      <Button
                        type="primary"
                        icon={<CheckCircleFilled />}
                        loading={submitProgressMutation.isPending}
                        onClick={handleCheckGrammarQuiz}
                      >
                        Kiểm tra đáp án & Lưu lên Server
                      </Button>

                      {isVerified && (
                        <Alert
                          type={quizAnswer === 'B' ? 'success' : 'warning'}
                          showIcon
                          message={
                            quizAnswer === 'B'
                              ? 'Đáp án đúng: B (review)'
                              : 'Đáp án đúng là B (review)'
                          }
                          description="Cấu trúc giả định 'It is essential that + S + V_bare': động từ giữ nguyên mẫu không thêm -s dù chủ ngữ 'every project manager' là ngôi thứ 3 số ít."
                        />
                      )}
                    </Space>
                  </Card>
                </Space>
              </Card>
            )}
          </Col>
        </Row>
      )}
    </div>
  );
};
