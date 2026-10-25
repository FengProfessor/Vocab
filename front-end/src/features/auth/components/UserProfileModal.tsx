import React, { useEffect } from 'react';
import { Avatar, Form, Input, InputNumber, Modal, Select, Space, Tag, Typography } from '@/components/ui/Primitives';
import { FireFilled, ThunderboltFilled, UserOutlined } from '@/components/ui/Icons';
import styles from '@/features/auth/components/UserProfileModal.module.css';
import { UserProfileFormValues } from '@/features/auth/types/UserProfileFormValues';
import { UserProfileModalProps } from '@/features/auth/types/UserProfileModalProps';
import { useGamificationStats } from '@/hooks/useGamificationStats';
import { useUpdateProfile } from '@/hooks/auth/useUpdateProfile';
import { useAuthStore } from '@/stores/useAuthStore';
import { CertLevel } from '@/types/enums/CertLevel';

/** Daily target bounds enforced by the API validator. */
const DAILY_TARGET_MIN = 5;
const DAILY_TARGET_MAX = 180;

/** Certificate targets offered to the learner (client-side preference). */
const TARGET_LEVEL_OPTIONS = [
  { value: CertLevel.B1, label: 'VSTEP B1 / TOEIC 450+' },
  { value: CertLevel.B2, label: 'VSTEP B2 / TOEIC 650+' },
  { value: CertLevel.C1, label: 'VSTEP C1 / TOEIC 850+' },
];

/**
 * Profile dialog: display name, learning goal and daily target are saved through PUT /auth/onboarding;
 * the certificate target is a local preference.
 */
export const UserProfileModal: React.FC<UserProfileModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm<UserProfileFormValues & { targetCertLevel: CertLevel }>();
  const user = useAuthStore((state) => state.user);
  const setTargetCertLevel = useAuthStore((state) => state.setTargetCertLevel);
  const { streakDays, totalXp } = useGamificationStats();
  const updateProfile = useUpdateProfile(onClose);

  useEffect(() => {
    if (open && user) {
      form.setFieldsValue({
        fullName: user.fullName,
        learningGoal: user.learningGoal ?? '',
        dailyTargetMins: user.dailyTargetMins,
        targetCertLevel: user.targetCertLevel,
      });
    }
  }, [open, user, form]);

  const handleOk = async (): Promise<void> => {
    const { targetCertLevel, ...profileValues } = await form.validateFields();
    setTargetCertLevel(targetCertLevel);
    updateProfile.mutate(profileValues);
  };

  if (!user) {
    return null;
  }

  return (
    <Modal
      title="Hồ sơ học viên & mục tiêu"
      open={open}
      onCancel={onClose}
      onOk={() => void handleOk()}
      confirmLoading={updateProfile.isPending}
      okText="Lưu thay đổi"
      cancelText="Hủy"
      width={520}
    >
      <Space direction="vertical" size={16} className="lp-full-width">
        <div className={styles.summary}>
          <Avatar size={56} className={styles.avatar} icon={<UserOutlined />} />
          <div>
            <Typography.Title level={4} className={styles.name}>
              {user.fullName}
            </Typography.Title>
            <Typography.Text type="secondary">{user.email}</Typography.Text>
            <div className={styles.tags}>
              <Tag color="geekblue">{user.role}</Tag>
              <Tag color="volcano" icon={<FireFilled />}>
                {streakDays} ngày Streak
              </Tag>
              <Tag color="gold" icon={<ThunderboltFilled />}>
                {totalXp.toLocaleString('vi-VN')} XP
              </Tag>
            </div>
          </div>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, whitespace: true, max: 100, message: 'Nhập họ tên (tối đa 100 ký tự)' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="learningGoal"
            label="Mục tiêu học tập"
            rules={[{ required: true, whitespace: true, message: 'Nhập mục tiêu học tập' }]}
          >
            <Input placeholder="Ví dụ: Đạt VSTEP B2 trong 6 tháng" />
          </Form.Item>
          <Form.Item
            name="dailyTargetMins"
            label="Thời gian học mỗi ngày (phút)"
            rules={[{ required: true, type: 'number', min: DAILY_TARGET_MIN, max: DAILY_TARGET_MAX }]}
          >
            <InputNumber min={DAILY_TARGET_MIN} max={DAILY_TARGET_MAX} className="lp-full-width" />
          </Form.Item>
          <Form.Item name="targetCertLevel" label="Mục tiêu chứng chỉ">
            <Select options={TARGET_LEVEL_OPTIONS} />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
};
