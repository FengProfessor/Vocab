import React, { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Input,
  Progress,
  Radio,
  Row,
  Slider,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { CheckCircleOutlined, FlagOutlined, SoundOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { WaveformPlayer } from '@/components/audio/WaveformPlayer';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { apiClient } from '@/lib/apiClient';
import { ListeningUtils } from '@/lib/listeningUtils';
import { useExamStore } from '@/stores/useExamStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { TranscriptCueDto } from '@/types/exam/TranscriptCueDto';

/**
 * Server response DTO returned by POST /api/v1/exams/toeic/submit.
 */
interface ServerToeicSubmissionResponseDto {
  resultId: string;
  testId: string;
  listeningCorrect: number;
  readingCorrect: number;
  listeningScaledScore: number;
  readingScaledScore: number;
  totalScaledScore: number;
  certLevel: string;
  proficiencyBand: string;
  xpAwarded: number;
}

/**
 * Sample TOEIC Part 3 business conversation cues synchronized with O(log N) binary search.
 */
const TOEIC_LISTENING_CUES: readonly TranscriptCueDto[] = [
  {
    index: 0,
    startTime: 0,
    endTime: 4.5,
    speaker: 'Man',
    text: 'Good morning, Ms. Jenkins. Have the quarterly sales figures from the Tokyo branch arrived yet?',
    translation: 'Chào buổi sáng cô Jenkins. Số liệu doanh thu quý từ chi nhánh Tokyo đã gửi về chưa?',
  },
  {
    index: 1,
    startTime: 4.5,
    endTime: 9.5,
    speaker: 'Woman',
    text: 'Yes, they just came in an hour ago. Overall revenue increased by fifteen percent compared to last quarter.',
    translation: 'Rồi ạ, vừa gửi tới cách đây một giờ. Tổng doanh thu tăng 15% so với quý trước.',
  },
  {
    index: 2,
    startTime: 9.5,
    endTime: 15.0,
    speaker: 'Man',
    text: 'That is wonderful news. Please include those charts in the board presentation before two o’clock.',
    translation: 'Tin tuyệt vời đấy. Vui lòng đưa các biểu đồ đó vào bài thuyết trình hội đồng quản trị trước 2 giờ chiều nhé.',
  },
];

/**
 * TOEIC 990 Listening & Reading Arena posting submissions dynamically to POST /api/v1/exams/toeic/submit.
 */
export const ToeicArenaView: React.FC = () => {
  const { message } = App.useApp();
  const {
    toeicQuestions,
    selectedAnswers,
    flaggedQuestions,
    isToeicSubmitted,
    simulatedListeningCorrect,
    simulatedReadingCorrect,
    toeicScoreReport,
    selectAnswer,
    toggleFlagQuestion,
    setToeicSubmitted,
    updateToeicRawCounts,
  } = useExamStore();

  const [dictationInput, setDictationInput] = useState<string>(
    'Overall revenue increased by fifteen percent compared to last quarter.'
  );

  const submitToeicMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<ApiResponse<ServerToeicSubmissionResponseDto>>(
        '/exams/toeic/submit',
        {
          testId: 'toeic-ets-2026-test-01',
          listeningCorrectCount: simulatedListeningCorrect,
          readingCorrectCount: simulatedReadingCorrect,
          durationSeconds: 3600,
          userAnswers: selectedAnswers,
        }
      );
      return response.data.data;
    },
    onSuccess: (serverResult) => {
      setToeicSubmitted(true);
      if (serverResult) {
        void message.success(
          `Máy chủ .NET 10 đã chấm bài TOEIC: ${serverResult.totalScaledScore}/990 (${serverResult.proficiencyBand}) • +${serverResult.xpAwarded} XP!`
        );
      }
    },
  });

  const referenceSentence = TOEIC_LISTENING_CUES[1].text;
  const dictationAccuracy = ListeningUtils.calculateDictationAccuracy(
    referenceSentence,
    dictationInput
  );

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 07 • TOEIC 990 LISTENING & READING ARENA (DYNAMIC API)"
        title="Sát thủ TOEIC Listening & Reading (Chuẩn ETS 990 Barem)"
        subtitle="Chấm điểm trực tiếp trên máy chủ .NET 10 (POST /api/v1/exams/toeic/submit) kết hợp bắt cue nhị phân O(log N)."
      />

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card
            title={
              <Space>
                <SoundOutlined style={{ color: '#4f46e5' }} />
                <span>Luyện Nghe Bắt Cue O(log N) & Chép Chính Tả (TOEIC Part 3)</span>
              </Space>
            }
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <WaveformPlayer
                title="TOEIC Part 3 • Conversation 41-43 (Tokyo Sales Report)"
                durationSeconds={15}
                cues={TOEIC_LISTENING_CUES}
              />

              <Card size="small" title="Thử thách Nghe Chép Chính Tả (Levenshtein Edit Distance)">
                <Space direction="vertical" size={10} style={{ width: '100%' }}>
                  <Typography.Text type="secondary">
                    Câu mẫu cần chép: &ldquo;{referenceSentence}&rdquo;
                  </Typography.Text>
                  <Input.TextArea
                    rows={2}
                    value={dictationInput}
                    onChange={(e) => setDictationInput(e.target.value)}
                    placeholder="Gõ lại câu bạn nghe được..."
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography.Text strong>
                      Độ chính xác ký tự Levenshtein: {dictationAccuracy}%
                    </Typography.Text>
                    <Tag color={dictationAccuracy >= 85 ? 'success' : 'warning'}>
                      Khoảng cách chỉnh sửa:{' '}
                      {ListeningUtils.levenshteinDistance(
                        referenceSentence.toLowerCase(),
                        dictationInput.toLowerCase()
                      )}{' '}
                      ký tự
                    </Tag>
                  </div>
                  <Progress percent={dictationAccuracy} status="active" />
                </Space>
              </Card>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="Bảng Quy Đổi Điểm Chuẩn ETS TOEIC 990 Barem">
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div>
                <Typography.Text strong>
                  Số câu đúng Listening: {simulatedListeningCorrect} / 100 câu →{' '}
                  <Tag color="geekblue">{toeicScoreReport.listeningScaled} / 495</Tag>
                </Typography.Text>
                <Slider
                  min={0}
                  max={100}
                  value={simulatedListeningCorrect}
                  onChange={(val) => updateToeicRawCounts(val, simulatedReadingCorrect)}
                />
              </div>

              <div>
                <Typography.Text strong>
                  Số câu đúng Reading: {simulatedReadingCorrect} / 100 câu →{' '}
                  <Tag color="cyan">{toeicScoreReport.readingScaled} / 495</Tag>
                </Typography.Text>
                <Slider
                  min={0}
                  max={100}
                  value={simulatedReadingCorrect}
                  onChange={(val) => updateToeicRawCounts(simulatedListeningCorrect, val)}
                />
              </div>

              <Row gutter={12}>
                <Col span={12}>
                  <Card size="small" style={{ background: '#eef2ff', textAlign: 'center' }}>
                    <Statistic
                      title="Tổng điểm TOEIC"
                      value={toeicScoreReport.totalScaled}
                      suffix="/ 990"
                      valueStyle={{ color: '#4f46e5', fontWeight: 800 }}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ background: '#ecfdf5', textAlign: 'center' }}>
                    <Statistic
                      title="Quy đổi CEFR"
                      value={toeicScoreReport.cefrBand}
                      valueStyle={{ color: '#059669', fontSize: 16, fontWeight: 700 }}
                    />
                  </Card>
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title="Phòng Luyện Đề TOEIC Reading Part 5 & Part 7"
        extra={
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={submitToeicMutation.isPending}
            onClick={() => {
              if (isToeicSubmitted) {
                setToeicSubmitted(false);
              } else {
                submitToeicMutation.mutate();
              }
            }}
          >
            {isToeicSubmitted ? 'Làm lại bài' : 'Nộp bài lên Server & Xem giải thích'}
          </Button>
        }
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {toeicQuestions.map((question) => {
            const userSelected = selectedAnswers[question.id];
            const isCorrect = userSelected === question.correctOption;

            return (
              <Card
                key={question.id}
                size="small"
                title={
                  <Space>
                    <Tag color="indigo">PART {question.part}</Tag>
                    <Typography.Text strong>Câu {question.questionNumber}</Typography.Text>
                  </Space>
                }
                extra={
                  <Button
                    size="small"
                    type={flaggedQuestions[question.id] ? 'primary' : 'default'}
                    danger={flaggedQuestions[question.id]}
                    icon={<FlagOutlined />}
                    onClick={() => toggleFlagQuestion(question.id)}
                  >
                    {flaggedQuestions[question.id] ? 'Đã gắn cờ' : 'Gắn cờ'}
                  </Button>
                }
              >
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {question.passageText && (
                    <div
                      style={{
                        padding: 12,
                        background: '#f8fafc',
                        borderRadius: 8,
                        borderLeft: '3px solid #6366f1',
                      }}
                    >
                      <Typography.Text>{question.passageText}</Typography.Text>
                    </div>
                  )}

                  <Typography.Text strong>{question.prompt}</Typography.Text>

                  <Radio.Group
                    value={userSelected}
                    onChange={(e) => selectAnswer(question.id, e.target.value)}
                  >
                    <Space direction="vertical">
                      {(['A', 'B', 'C', 'D'] as const).map((optKey) => (
                        <Radio key={optKey} value={optKey}>
                          <strong>{optKey}.</strong> {question.options[optKey]}
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>

                  {isToeicSubmitted && (
                    <Alert
                      type={isCorrect ? 'success' : 'error'}
                      showIcon
                      message={`Đáp án đúng: ${question.correctOption}`}
                      description={question.explanationVi}
                    />
                  )}
                </Space>
              </Card>
            );
          })}
        </Space>
      </Card>
    </div>
  );
};
