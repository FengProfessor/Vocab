import React, { useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Input,
  Row,
  Slider,
  Space,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import { CheckCircleOutlined, RobotOutlined } from '@ant-design/icons';
import { useMutation } from '@tanstack/react-query';
import { AudioRecorder } from '@/components/audio/AudioRecorder';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { apiClient } from '@/lib/apiClient';
import { useExamStore } from '@/stores/useExamStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ExamType } from '@/types/enums/ExamType';

/**
 * Server VSTEP grading response from POST /api/v1/exams/vstep/submit.
 */
interface ServerVstepScoreResult {
  rawAverage: number;
  roundedScore: number;
  certLevel: string | null;
  statusLabel: string;
}

/**
 * Server AI writing evaluation response from POST /api/v1/exams/writing/evaluate.
 */
interface ServerWritingEvaluationDto {
  overallScore: number;
  taskAchievement: number;
  coherenceAndCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  overallFeedbackVi: string;
}

/**
 * VSTEP 4-Skill Exam Simulator posting 4-skill grading to POST /api/v1/exams/vstep/submit
 * and AI essay evaluation to POST /api/v1/exams/writing/evaluate.
 */
export const VstepSimulatorView: React.FC = () => {
  const { message } = App.useApp();
  const { vstepRawScores, vstepResult, updateVstepRawScores } = useExamStore();
  const [essayDraft, setEssayDraft] = useState<string>(
    'In recent years, working remotely has become increasingly prevalent across global industries. While telecommuting offers unprecedented flexibility for employees, organizations must establish clear communication protocols to maintain team cohesion.'
  );
  const [writingEval, setWritingEval] = useState<ServerWritingEvaluationDto | null>(null);

  const submitVstepMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<ApiResponse<ServerVstepScoreResult>>(
        '/exams/vstep/submit',
        {
          listeningScore: vstepRawScores.listening,
          readingScore: vstepRawScores.reading,
          writingScore: vstepRawScores.writing,
          speakingScore: vstepRawScores.speaking,
        }
      );
      return response.data.data;
    },
    onSuccess: (res) => {
      if (res) {
        void message.success(
          `Máy chủ .NET 10 đã chấm VSTEP: ${res.roundedScore.toFixed(1)}/10.0 (${res.statusLabel})!`
        );
      }
    },
  });

  const evaluateEssayMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post<ApiResponse<ServerWritingEvaluationDto>>(
        '/exams/writing/evaluate',
        {
          examType: ExamType.Vstep,
          promptText:
            'Discuss the advantages and disadvantages of remote work for modern companies.',
          essayText: essayDraft,
        }
      );
      return response.data.data;
    },
    onSuccess: (res) => {
      if (res) {
        setWritingEval(res);
        updateVstepRawScores({ writing: res.overallScore });
        void message.success(
          `AI Router trên Server đã chấm bài viết: ${res.overallScore.toFixed(1)}/10.0!`
        );
      }
    },
  });

  const wordCount = essayDraft
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 08 • VSTEP.3-5 (B1 / B2 / C1) 4-SKILL EXAM SIMULATOR (DYNAMIC API)"
        title="Phòng Thi Giả Lập VSTEP 4 Kỹ Năng & Bộ Quy Đổi Điểm Chuẩn Bộ GD&ĐT"
        subtitle="Đồng bộ trực tiếp với bộ máy chấm điểm VSTEP (POST /api/v1/exams/vstep/submit) và AI chấm Writing 4 tiêu chí (POST /api/v1/exams/writing/evaluate)."
        extra={
          <Space>
            <CertLevelTag level={vstepResult.achievedLevel} />
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              loading={submitVstepMutation.isPending}
              onClick={() => submitVstepMutation.mutate()}
            >
              Chấm điểm trên Server
            </Button>
          </Space>
        }
      />

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Mô phỏng Chấm Điểm VSTEP 4 Kỹ Năng (Thang 10.0)">
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <div>
                <Typography.Text strong>
                  1. Kỹ năng Nghe (Listening): {vstepRawScores.listening.toFixed(1)} / 10.0
                </Typography.Text>
                <Slider
                  min={0}
                  max={10}
                  step={0.5}
                  value={vstepRawScores.listening}
                  onChange={(val) => updateVstepRawScores({ listening: val })}
                />
              </div>

              <div>
                <Typography.Text strong>
                  2. Kỹ năng Đọc (Reading): {vstepRawScores.reading.toFixed(1)} / 10.0
                </Typography.Text>
                <Slider
                  min={0}
                  max={10}
                  step={0.5}
                  value={vstepRawScores.reading}
                  onChange={(val) => updateVstepRawScores({ reading: val })}
                />
              </div>

              <div>
                <Typography.Text strong>
                  3. Kỹ năng Viết (Writing): {vstepRawScores.writing.toFixed(1)} / 10.0
                </Typography.Text>
                <Slider
                  min={0}
                  max={10}
                  step={0.5}
                  value={vstepRawScores.writing}
                  onChange={(val) => updateVstepRawScores({ writing: val })}
                />
              </div>

              <div>
                <Typography.Text strong>
                  4. Kỹ năng Nói (Speaking): {vstepRawScores.speaking.toFixed(1)} / 10.0
                </Typography.Text>
                <Slider
                  min={0}
                  max={10}
                  step={0.5}
                  value={vstepRawScores.speaking}
                  onChange={(val) => updateVstepRawScores({ speaking: val })}
                />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Kết Quả Quy Đổi Chứng Chỉ VSTEP Chính Thức">
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Row gutter={12}>
                <Col span={12}>
                  <Card size="small" style={{ background: '#f8fafc', textAlign: 'center' }}>
                    <Statistic
                      title="Trung bình gốc (Chưa làm tròn)"
                      value={vstepResult.rawAverage.toFixed(2)}
                      suffix="/ 10.0"
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" style={{ background: '#eef2ff', textAlign: 'center' }}>
                    <Statistic
                      title="Điểm VSTEP Chính thức (Làm tròn 0.5)"
                      value={vstepResult.overallScore.toFixed(1)}
                      suffix="/ 10.0"
                      valueStyle={{ color: '#4f46e5', fontWeight: 800 }}
                    />
                  </Card>
                </Col>
              </Row>

              <Descriptions bordered size="small" column={1}>
                <Descriptions.Item label="Bậc năng lực đạt được">
                  <CertLevelTag level={vstepResult.achievedLevel} />
                </Descriptions.Item>
                <Descriptions.Item label="Ngưỡng chuẩn Bộ GD&ĐT">
                  4.0 - 5.5: B1 • 6.0 - 8.0: B2 • 8.5 - 10.0: C1
                </Descriptions.Item>
              </Descriptions>

              <Alert
                type={vstepResult.achievedLevel === 'BELOW_B1' ? 'warning' : 'success'}
                showIcon
                message="Nhận xét tổng hợp"
                description={vstepResult.summaryVi}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={12}>
          <Card
            title="Phòng Thi VSTEP Writing Task 2 (Essay ≥ 250 từ)"
            extra={
              <Space>
                <Tag color="geekblue">Số từ: {wordCount} từ</Tag>
                <Button
                  type="primary"
                  size="small"
                  icon={<RobotOutlined />}
                  loading={evaluateEssayMutation.isPending}
                  onClick={() => evaluateEssayMutation.mutate()}
                >
                  Chấm AI trên Server
                </Button>
              </Space>
            }
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Typography.Text strong>
                Đề bài: Discuss the advantages and disadvantages of remote work for modern companies.
              </Typography.Text>
              <Input.TextArea
                rows={5}
                value={essayDraft}
                onChange={(e) => setEssayDraft(e.target.value)}
              />
              {writingEval && (
                <Alert
                  type="success"
                  showIcon
                  message={`Kết quả AI Server: ${writingEval.overallScore.toFixed(1)}/10.0 (Lexical: ${writingEval.lexicalResource} • Grammar: ${writingEval.grammaticalRange})`}
                  description={writingEval.overallFeedbackVi}
                />
              )}
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Phòng Thi VSTEP Speaking Part 1 — Social Interaction">
            <AudioRecorder promptText="Could you tell me about your favorite means of public transportation in your city?" />
          </Card>
        </Col>
      </Row>
    </div>
  );
};
