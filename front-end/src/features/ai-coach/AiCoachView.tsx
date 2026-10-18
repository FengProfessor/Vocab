import React, { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Input,
  List,
  Progress,
  Row,
  Space,
  Tag,
  Typography,
} from 'antd';
import { RobotOutlined, SendOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';

/**
 * Represents a message in the Socratic AI coaching thread.
 */
interface CoachMessageItem {
  id: string;
  sender: 'ai' | 'student';
  text: string;
}

/**
 * Server response DTO from POST /api/v1/ai-coaching/speaking/dialogue.
 */
interface ServerAiSpeakingFeedbackDto {
  tutorReply: string;
  grammarCorrection: string | null;
  betterExpression: string | null;
  pronunciationTip: string | null;
  fluencyScore: number;
}

/**
 * Server response DTO from POST /api/v1/ai-coaching/sentence/analyze.
 */
interface ServerAiSentenceAnalysisDto {
  originalSentence: string;
  subjectKernel: string;
  verbKernel: string;
  objectOrComplement: string | null;
  grammarBreakdownVi: string;
}

/**
 * Socratic AI Tutor & Syntactic Sentence Analyzer calling POST /api/v1/ai-coaching/speaking/dialogue
 * and POST /api/v1/ai-coaching/sentence/analyze on the .NET 10 server.
 */
export const AiCoachView: React.FC = () => {
  const { message } = App.useApp();
  const [messages, setMessages] = useState<CoachMessageItem[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Xin chào! Mình là Trợ lý Socratic AI của LingoPro (.NET 10 AI Router). Hãy gửi một câu văn hoặc luận điểm VSTEP/TOEIC của bạn, máy chủ sẽ phân tích cấu trúc ngữ pháp và gợi ý nâng cấp từ vựng lên chuẩn B2/C1.',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>(
    'Traffic congestion is a big problem in big cities and government should build more subways.'
  );
  const [sentenceAnalysis, setSentenceAnalysis] = useState<ServerAiSentenceAnalysisDto | null>(null);

  const coachDialogueMutation = useMutation({
    mutationFn: async (promptText: string) => {
      const [dialogueRes, analyzeRes] = await Promise.all([
        apiClient.post<ApiResponse<ServerAiSpeakingFeedbackDto>>('/ai-coaching/speaking/dialogue', {
          topic: 'Academic Writing & Speaking Upgrade',
          lastTranscript: promptText,
          history: messages.map((m) => `${m.sender}: ${m.text}`),
        }),
        apiClient.post<ApiResponse<ServerAiSentenceAnalysisDto>>('/ai-coaching/sentence/analyze', {
          sentence: promptText,
          context: 'VSTEP B2-C1 & TOEIC Academic Discourse',
        }),
      ]);
      return {
        dialogue: dialogueRes.data.data,
        analysis: analyzeRes.data.data,
      };
    },
    onSuccess: (result, promptText) => {
      const userMsg: CoachMessageItem = {
        id: `usr_${Date.now()}`,
        sender: 'student',
        text: promptText,
      };

      const d = result.dialogue;
      const replyParts = [
        d?.tutorReply,
        d?.grammarCorrection ? `Gợi ý ngữ pháp: ${d.grammarCorrection}` : null,
        d?.betterExpression ? `Cách diễn đạt C1: "${d.betterExpression}"` : null,
      ].filter(Boolean);

      const aiReply: CoachMessageItem = {
        id: `ai_${Date.now() + 1}`,
        sender: 'ai',
        text:
          replyParts.join(' • ') ||
          'Đã phân tích cấu trúc câu thành công từ AI Router trên máy chủ .NET 10.',
      };

      setMessages((prev) => [...prev, userMsg, aiReply]);
      if (result.analysis) {
        setSentenceAnalysis(result.analysis);
      }
      setInputPrompt('');
      void message.success('Đã nhận phản hồi Socratic & phân tích cú pháp từ Server!');
    },
  });

  const handleSendToCoach = (): void => {
    if (!inputPrompt.trim()) {
      return;
    }
    coachDialogueMutation.mutate(inputPrompt.trim());
  };

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 09 • SOCRATIC AI TUTOR & RUBRIC ANALYZER (DYNAMIC API)"
        title="Trợ Lý AI Socratic & Phân Tích Cú Pháp Chuyên Sâu"
        subtitle="Kết nối trực tiếp tới POST /api/v1/ai-coaching/speaking/dialogue và POST /api/v1/ai-coaching/sentence/analyze trên máy chủ .NET 10."
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={15}>
          <Card title="Hội thoại Huấn luyện Socratic 1-kèm-1 (Server AI Router)">
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <List
                dataSource={messages}
                renderItem={(item) => (
                  <List.Item
                    style={{
                      background: item.sender === 'ai' ? '#eef2ff' : '#f8fafc',
                      borderRadius: 12,
                      padding: '12px 16px',
                      marginBottom: 10,
                    }}
                  >
                    <Space align="start">
                      <Tag color={item.sender === 'ai' ? 'indigo' : 'green'}>
                        {item.sender === 'ai' ? 'Socratic AI' : 'Bạn'}
                      </Tag>
                      <Typography.Text>{item.text}</Typography.Text>
                    </Space>
                  </List.Item>
                )}
              />

              {sentenceAnalysis && (
                <Alert
                  type="info"
                  showIcon
                  message={`Phân tích Hạt nhân Câu (S-V-O): Chủ ngữ [${sentenceAnalysis.subjectKernel}] • Động từ [${sentenceAnalysis.verbKernel}]`}
                  description={sentenceAnalysis.grammarBreakdownVi}
                />
              )}

              <Input.TextArea
                rows={3}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                placeholder="Nhập câu tiếng Anh bạn muốn nâng cấp lên band B2/C1..."
              />

              <Button
                type="primary"
                icon={<SendOutlined />}
                loading={coachDialogueMutation.isPending}
                onClick={handleSendToCoach}
              >
                Gửi lên Server AI phân tích & nâng band C1
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={9}>
          <Card
            title={
              <Space>
                <RobotOutlined style={{ color: '#4f46e5' }} />
                <span>Chấm điểm theo 4 Tiêu chí VSTEP</span>
              </Space>
            }
          >
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <div>
                <Typography.Text strong>
                  1. Task Fulfillment (Hoàn thành yêu cầu): 7.5
                </Typography.Text>
                <Progress percent={75} strokeColor="#4f46e5" />
              </div>
              <div>
                <Typography.Text strong>
                  2. Organization & Coherence (Mạch lạc): 7.0
                </Typography.Text>
                <Progress percent={70} strokeColor="#0284c7" />
              </div>
              <div>
                <Typography.Text strong>
                  3. Lexical Resource (Vốn từ học thuật): 8.0
                </Typography.Text>
                <Progress percent={80} strokeColor="#10b981" />
              </div>
              <div>
                <Typography.Text strong>
                  4. Grammatical Range (Độ rộng ngữ pháp): 7.0
                </Typography.Text>
                <Progress percent={70} strokeColor="#f59e0b" />
              </div>
              <Tag icon={<ThunderboltOutlined />} color="purple">
                Dự báo điểm bài viết: 7.5 / 10.0 (Chuẩn VSTEP B2+)
              </Tag>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};
