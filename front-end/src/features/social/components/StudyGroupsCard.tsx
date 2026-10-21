import React, { useState } from 'react';
import { Card, Empty, Input, Space, Tag, Typography } from 'antd';
import styles from '@/features/social/components/StudyGroupsCard.module.css';
import { StudyGroupsCardProps } from '@/features/social/types/StudyGroupsCardProps';

/**
 * Study groups the learner belongs to, plus a field to join another group with an invite code.
 */
export const StudyGroupsCard: React.FC<StudyGroupsCardProps> = ({ groups, isJoining, onJoin }) => {
  const [inviteCode, setInviteCode] = useState<string>('');

  return (
    <Card title="Nhóm học của tôi">
      <Space direction="vertical" size={12} className="lp-full-width">
        <Input.Search
          value={inviteCode}
          enterButton="Tham gia"
          loading={isJoining}
          placeholder="Nhập mã mời nhóm học..."
          onChange={(event) => setInviteCode(event.target.value)}
          onSearch={(value) => {
            if (value.trim()) {
              onJoin(value.trim());
              setInviteCode('');
            }
          }}
        />

        {groups.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bạn chưa tham gia nhóm học nào." />
        ) : (
          groups.map((group) => (
            <Card key={group.id} size="small" className={styles.group}>
              <Space className={styles.groupRow} align="center">
                <div>
                  <Typography.Text strong>{group.name}</Typography.Text>
                  <Typography.Text type="secondary" className={styles.groupMeta}>
                    Mã nhóm: {group.inviteCode} • Tối đa {group.seatLimit} thành viên
                  </Typography.Text>
                </div>
                <Tag>{String(group.status)}</Tag>
              </Space>
            </Card>
          ))
        )}
      </Space>
    </Card>
  );
};
