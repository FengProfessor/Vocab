import React, { useState } from 'react';
import { Button, Card, Empty, Input, List, Space, Tag, Typography } from '@/components/ui/Primitives';
import { SendOutlined } from '@/components/ui/Icons';
import styles from '@/features/ai-coach/components/CoachChatPanel.module.css';
import { CoachChatPanelProps } from '@/features/ai-coach/types/CoachChatPanelProps';
import { CoachMessageSender } from '@/types/enums/CoachMessageSender';

/**
 * Conversation with the Socratic tutor: message history and the input box.
 */
export const CoachChatPanel: React.FC<CoachChatPanelProps> = ({ messages, isSending, onSend }) => {
  const [draft, setDraft] = useState<string>('');

  const handleSend = (): void => {
    const text = draft.trim();
    if (!text) {
      return;
    }
    onSend(text);
    setDraft('');
  };

  return (
    <Card title="Hội thoại huấn luyện Socratic 1-kèm-1">
      <Space direction="vertical" size={16} className="lp-full-width">
        {messages.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Gửi một câu tiếng Anh hoặc luận điểm VSTEP/TOEIC để bắt đầu."
          />
        ) : (
          <List
            dataSource={messages}
            renderItem={(item) => {
              const isTutor = item.sender === CoachMessageSender.Tutor;
              return (
                <List.Item className={`${styles.message} ${isTutor ? styles.messageTutor : ''}`}>
                  <Space align="start">
                    <Tag color={isTutor ? 'indigo' : 'green'}>{isTutor ? 'Socratic AI' : 'Bạn'}</Tag>
                    <Typography.Text className={styles.text}>{item.text}</Typography.Text>
                  </Space>
                </List.Item>
              );
            }}
          />
        )}

        <Input.TextArea
          rows={3}
          value={draft}
          placeholder="Nhập câu tiếng Anh bạn muốn nâng cấp lên band B2/C1..."
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={isSending}
          disabled={!draft.trim()}
          onClick={handleSend}
        >
          Gửi cho AI Socratic
        </Button>
      </Space>
    </Card>
  );
};
