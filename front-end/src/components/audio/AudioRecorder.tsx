import React from 'react';
import { Alert, Button, Card, Space, Tag, Typography } from '@/components/ui/Primitives';
import { AudioMutedOutlined, AudioOutlined } from '@/components/ui/Icons';
import styles from '@/components/audio/AudioRecorder.module.css';
import { AudioRecorderProps } from '@/components/types/AudioRecorderProps';
import { CLARITY_RATING_OPTIONS } from '@/config/clarityRatingOptions';
import { useMediaRecorder } from '@/hooks/useMediaRecorder';

/**
 * Microphone recorder for speaking drills. It really records and plays back the learner's voice, then lets the
 * learner rate their own clarity (V1-V3).
 * TODO: [Backend API Required] send the recording to POST /api/v1/ai-coaching/speaking/upload-audio for automatic
 * speech-to-text and pronunciation scoring instead of self rating.
 */
export const AudioRecorder: React.FC<AudioRecorderProps> = ({ promptText, onRecordingComplete }) => {
  const recorder = useMediaRecorder();

  return (
    <Card size="small" className={styles.card}>
      <Space direction="vertical" size={12} className="lp-full-width">
        <div className={styles.controls}>
          <Button
            type={recorder.isRecording ? 'primary' : 'default'}
            danger={recorder.isRecording}
            shape="round"
            icon={recorder.isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
            onClick={() => (recorder.isRecording ? recorder.stop() : void recorder.start())}
          >
            {recorder.isRecording ? `Dừng thu âm (${recorder.elapsedSeconds}s)` : 'Bắt đầu thu âm'}
          </Button>
          {recorder.isRecording && <Tag color="red">Đang ghi âm...</Tag>}
        </div>

        {recorder.errorMessage && <Alert type="error" showIcon message={recorder.errorMessage} />}

        {recorder.audioUrl && (
          <>
            <audio className={styles.player} controls src={recorder.audioUrl} />
            <div>
              <Typography.Text strong className={styles.ratingLabel}>
                Nghe lại và tự đánh giá độ rõ của phát âm:
              </Typography.Text>
              <Space wrap>
                {CLARITY_RATING_OPTIONS.map((option) => (
                  <Button key={option.rating} onClick={() => onRecordingComplete?.(option.rating)}>
                    {option.label}
                  </Button>
                ))}
              </Space>
            </div>
          </>
        )}

        <Typography.Text type="secondary" className={styles.prompt}>
          Mẫu câu luyện đọc: &ldquo;{promptText}&rdquo;
        </Typography.Text>
      </Space>
    </Card>
  );
};
