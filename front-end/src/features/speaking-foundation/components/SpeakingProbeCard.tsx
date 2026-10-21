import React from 'react';
import { Button, Card, Space, Tag, Typography } from 'antd';
import { SoundOutlined } from '@ant-design/icons';
import { AudioRecorder } from '@/components/audio/AudioRecorder';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import styles from '@/features/speaking-foundation/components/SpeakingProbeCard.module.css';
import { SpeakingProbeCardProps } from '@/features/speaking-foundation/types/SpeakingProbeCardProps';
import { SpeechService } from '@/lib/speechService';

/**
 * One pronunciation concept: headword, IPA, meaning, model audio and the recorder with self-rating.
 */
export const SpeakingProbeCard: React.FC<SpeakingProbeCardProps> = ({ probe, onRated }) => {
  return (
    <Card
      title={
        <Space>
          <Typography.Text strong className={styles.headword}>
            {probe.headword}
          </Typography.Text>
          <CertLevelTag level={probe.certLevel} />
          <Tag color="geekblue">{probe.conceptCode}</Tag>
        </Space>
      }
      extra={<Tag color="purple">Band tần suất: {probe.frequencyBand}</Tag>}
    >
      <Space direction="vertical" size={12} className="lp-full-width">
        <Space>
          <Typography.Text type="secondary" className={styles.detail}>
            <strong>{probe.ipa}</strong> — {probe.meaningVi}
          </Typography.Text>
          <Button
            size="small"
            shape="circle"
            icon={<SoundOutlined />}
            title="Nghe phát âm mẫu"
            onClick={() => SpeechService.speak(probe.headword, 0.85)}
          />
        </Space>
        <AudioRecorder
          promptText={`Please pronounce "${probe.headword}" in a short sentence.`}
          onRecordingComplete={(clarity) => onRated(probe, clarity)}
        />
      </Space>
    </Card>
  );
};
