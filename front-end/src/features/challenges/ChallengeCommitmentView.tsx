import React, { useState } from 'react';
import {
  App,
  Button,
  Card,
  Col,
  Progress,
  Radio,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import {
  FireFilled,
  SafetyCertificateOutlined,
  SyncOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api/ApiResponse';
import { ChallengeRewardChoice } from '@/types/enums/ChallengeRewardChoice';
import { ChallengeStatus } from '@/types/enums/ChallengeStatus';

/**
 * Challenge DTO returned by GET /api/v1/challenges.
 */
interface ServerChallengeDto {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  dailyTargetWords: number;
  maxParticipants: number;
  currentParticipants: number;
  depositAmount: number;
  status: ChallengeStatus | string;
}

/**
 * Join challenge response DTO returned by POST /api/v1/challenges/{id}/join.
 */
interface ServerJoinChallengeResponseDto {
  participantId: string;
  challengeId: string;
  status: string;
  orderId: string | null;
  transferCode: string | null;
}

/**
 * Streak Commitment Challenge module fetching active campaigns from GET /api/v1/challenges
 * and enrolling via POST /api/v1/challenges/{challengeId}/join.
 */
export const ChallengeCommitmentView: React.FC = () => {
  const { message } = App.useApp();
  const [rewardChoice, setRewardChoice] = useState<ChallengeRewardChoice>(
    ChallengeRewardChoice.Refund
  );

  const challengesQuery = useQuery({
    queryKey: ['challenges-list'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerChallengeDto[]>>('/challenges');
      return response.data.data ?? [];
    },
  });

  const joinChallengeMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const response = await apiClient.post<ApiResponse<ServerJoinChallengeResponseDto>>(
        `/challenges/${challengeId}/join`
      );
      return response.data.data;
    },
    onSuccess: (res) => {
      void message.success(
        `Đã đăng ký tham gia Thử thách trên Server (Mã giao dịch: ${res?.transferCode ?? 'ACTIVE'})!`
      );
    },
  });

  const challenges = challengesQuery.data ?? [];

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 13 • 30-DAY STREAK COMMITMENT CHALLENGE (DYNAMIC API)"
        title="Thử Thách Cam Kết Kỷ Luật 30 Ngày"
        subtitle="Danh sách chiến dịch cam kết được tải trực tiếp từ GET /api/v1/challenges và đăng ký qua POST /api/v1/challenges/{id}/join."
        extra={
          <Button
            icon={<SyncOutlined spin={challengesQuery.isFetching} />}
            onClick={() => void challengesQuery.refetch()}
          >
            Làm mới từ Server
          </Button>
        }
      />

      {challengesQuery.isLoading ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={15}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {challenges.map((chl) => {
                const percent = Math.round(
                  (chl.currentParticipants / Math.max(1, chl.maxParticipants)) * 100
                );
                return (
                  <Card
                    key={chl.id}
                    title={
                      <Space>
                        <FireFilled style={{ color: '#ef4444' }} />
                        <span>{chl.title}</span>
                      </Space>
                    }
                    extra={<Tag color="success">{String(chl.status).toUpperCase()}</Tag>}
                  >
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      <Typography.Paragraph style={{ marginBottom: 0 }}>
                        {chl.description}
                      </Typography.Paragraph>

                      <Row gutter={16}>
                        <Col span={8}>
                          <Statistic
                            title="Mục tiêu mỗi ngày"
                            value={chl.dailyTargetWords}
                            suffix="từ FSRS"
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="Học viên tham gia"
                            value={chl.currentParticipants}
                            suffix={`/ ${chl.maxParticipants}`}
                          />
                        </Col>
                        <Col span={8}>
                          <Statistic
                            title="Quỹ cam kết"
                            value={chl.depositAmount.toLocaleString('vi-VN')}
                            suffix="₫"
                            valueStyle={{ color: '#10b981', fontWeight: 700 }}
                          />
                        </Col>
                      </Row>

                      <Progress percent={percent} status="active" strokeColor="#10b981" />

                      <div>
                        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                          Tùy chọn nhận thưởng khi hoàn thành 100% mục tiêu:
                        </Typography.Text>
                        <Radio.Group
                          value={rewardChoice}
                          onChange={(e) => setRewardChoice(e.target.value)}
                        >
                          <Space direction="vertical">
                            <Radio value={ChallengeRewardChoice.Refund}>
                              Hoàn tiền 100% ({chl.depositAmount.toLocaleString('vi-VN')} ₫) về tài
                              khoản ngân hàng
                            </Radio>
                            <Radio value={ChallengeRewardChoice.ExtendSubscription}>
                              Quy đổi thành +45 ngày sử dụng Gói LingoPro VIP
                            </Radio>
                            <Radio value={ChallengeRewardChoice.Donate}>
                              Đóng góp vào Quỹ Học bổng VSTEP Sinh viên vượt khó
                            </Radio>
                          </Space>
                        </Radio.Group>
                      </div>

                      <Button
                        type="primary"
                        icon={<SafetyCertificateOutlined />}
                        loading={joinChallengeMutation.isPending}
                        onClick={() => joinChallengeMutation.mutate(chl.id)}
                      >
                        Tham gia Thử thách trên Server
                      </Button>
                    </Space>
                  </Card>
                );
              })}
            </Space>
          </Col>

          <Col xs={24} lg={9}>
            <Card
              title={
                <Space>
                  <TrophyOutlined style={{ color: '#f59e0b' }} />
                  <span>Quy Tắc Bảo Vệ Streak</span>
                </Space>
              }
            >
              <Typography.Paragraph>
                1. Hệ thống ghi nhận tự động khi bạn hoàn thành ít nhất 15 thẻ FSRS v5 hoặc 1 bài
                luyện Nghe/Đọc mỗi ngày trước 23:59.
              </Typography.Paragraph>
              <Typography.Paragraph>
                2. Mỗi học viên có 01 thẻ <strong>Streak Freeze</strong> miễn phí trong suốt chiến
                dịch để bảo toàn chuỗi nếu có việc đột xuất.
              </Typography.Paragraph>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};
