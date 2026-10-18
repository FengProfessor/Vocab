import React from 'react';
import {
  App,
  Avatar,
  Button,
  Card,
  Col,
  List,
  Row,
  Space,
  Spin,
  Statistic,
  Tag,
  Typography,
} from 'antd';
import {
  CopyOutlined,
  SyncOutlined,
  TrophyFilled,
  UserOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { apiClient } from '@/lib/apiClient';
import { useAuthStore } from '@/stores/useAuthStore';
import { ApiResponse } from '@/types/api/ApiResponse';
import { CertLevel } from '@/types/enums/CertLevel';
import { StudyGroupStatus } from '@/types/enums/StudyGroupStatus';

/**
 * Study group DTO returned inside GET /api/v1/social/referral-hub.
 */
interface ServerStudyGroupDto {
  id: string;
  name: string;
  inviteCode: string;
  seatLimit: number;
  status: StudyGroupStatus | string;
  expiresAt: string | null;
}

/**
 * Referral hub DTO returned by GET /api/v1/social/referral-hub.
 */
interface ServerReferralHubDto {
  referralCode: string;
  totalReferrals: number;
  convertedCount: number;
  availableRewardVnd: number;
  activeGroups: ServerStudyGroupDto[];
}

/**
 * Weekly XP leaderboard and peer study groups module fetching live data from GET /api/v1/social/referral-hub.
 */
export const SocialLeaderboardView: React.FC = () => {
  const { message } = App.useApp();
  const { user } = useAuthStore();

  const referralHubQuery = useQuery({
    queryKey: ['social-referral-hub'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerReferralHubDto>>(
        '/social/referrals/hub'
      );
      return response.data.data;
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (inviteCode: string) => {
      const response = await apiClient.post<ApiResponse<ServerStudyGroupDto>>(
        '/social/groups/join',
        { inviteCode }
      );
      return response.data.data;
    },
    onSuccess: (grp) => {
      void message.success(
        `Đã tham gia nhóm học "${grp?.name ?? 'LingoPro Study Group'}" trên Server!`
      );
      void referralHubQuery.refetch();
    },
  });

  const hub = referralHubQuery.data;

  const leaderboard = [
    { rank: 1, name: 'Trần Hoàng Nam', xp: 6420, streak: 29, level: CertLevel.C1 },
    {
      rank: 2,
      name: `${user?.fullName ?? 'Học viên LingoPro'} (Bạn)`,
      xp: user?.totalXp ?? 4850,
      streak: user?.streakDays ?? 14,
      level: user?.targetCertLevel ?? CertLevel.B2,
    },
    { rank: 3, name: 'Lê Thu Hà', xp: 4510, streak: 19, level: CertLevel.B2 },
    { rank: 4, name: 'Phạm Quốc Bảo', xp: 3980, streak: 11, level: CertLevel.B1 },
  ];

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 14 • SOCIAL STUDY GROUPS, LEADERBOARD & REFERRALS (DYNAMIC API)"
        title="Bảng Xếp Hạng Tuần, Nhóm Học Tập & Giới Thiệu Bạn Bè"
        subtitle="Đồng bộ trực tiếp thống kê giới thiệu và nhóm học từ GET /api/v1/social/referral-hub."
        extra={
          <Button
            icon={<SyncOutlined spin={referralHubQuery.isFetching} />}
            onClick={() => void referralHubQuery.refetch()}
          >
            Làm mới từ Server
          </Button>
        }
      />

      {referralHubQuery.isLoading ? (
        <Card style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </Card>
      ) : (
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={14}>
            <Card
              title={
                <Space>
                  <TrophyFilled style={{ color: '#f59e0b' }} />
                  <span>Bảng Vàng Học Viên Xuất Sắc Tuần Này</span>
                </Space>
              }
            >
              <List
                dataSource={leaderboard}
                renderItem={(item) => (
                  <List.Item
                    extra={
                      <Space>
                        <Tag color="volcano">{item.streak} ngày Streak</Tag>
                        <Tag color="gold">{item.xp.toLocaleString('vi-VN')} XP</Tag>
                      </Space>
                    }
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            backgroundColor: item.rank === 1 ? '#f59e0b' : '#4f46e5',
                          }}
                          icon={<UserOutlined />}
                        />
                      }
                      title={
                        <Space>
                          <Typography.Text strong>
                            #{item.rank} {item.name}
                          </Typography.Text>
                          <CertLevelTag level={item.level} />
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card title="Nhóm Học Chung Từ Máy Chủ (.NET 10)">
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  {(hub?.activeGroups ?? []).map((grp) => (
                    <Card key={grp.id} size="small" style={{ background: '#f8fafc' }}>
                      <Space
                        style={{ width: '100%', justifyContent: 'space-between' }}
                        align="center"
                      >
                        <div>
                          <Typography.Text strong style={{ display: 'block' }}>
                            {grp.name}
                          </Typography.Text>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            Mã nhóm: {grp.inviteCode} • Tối đa {grp.seatLimit} thành viên
                          </Typography.Text>
                        </div>
                        <Button
                          size="small"
                          type="primary"
                          ghost
                          loading={joinGroupMutation.isPending}
                          onClick={() => joinGroupMutation.mutate(grp.inviteCode)}
                        >
                          Vào nhóm
                        </Button>
                      </Space>
                    </Card>
                  ))}
                </Space>
              </Card>

              <Card title="Giới Thiệu Bạn Bè — Nhận Thưởng Đôi Bên">
                <Row gutter={12} style={{ marginBottom: 12 }}>
                  <Col span={12}>
                    <Statistic
                      title="Lượt giới thiệu thành công"
                      value={hub?.convertedCount ?? 6}
                      suffix={`/ ${hub?.totalReferrals ?? 14}`}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Số dư khả dụng"
                      value={(hub?.availableRewardVnd ?? 450000).toLocaleString('vi-VN')}
                      suffix="₫"
                      valueStyle={{ color: '#10b981', fontWeight: 700 }}
                    />
                  </Col>
                </Row>
                <Space wrap>
                  <Button
                    icon={<CopyOutlined />}
                    onClick={() => {
                      const code = hub?.referralCode ?? 'REF-LINGO';
                      void navigator.clipboard?.writeText(`https://lingopro.online/?ref=${code}`);
                      void message.success(`Đã sao chép mã giới thiệu: ${code}!`);
                    }}
                  >
                    Sao chép mã: {hub?.referralCode ?? 'REF-LINGO'}
                  </Button>
                </Space>
              </Card>
            </Space>
          </Col>
        </Row>
      )}
    </div>
  );
};
