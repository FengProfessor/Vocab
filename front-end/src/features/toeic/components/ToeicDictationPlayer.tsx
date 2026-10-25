import React, { useState } from 'react';
import { Button, Card, Input, Radio, Space, Tag, Typography } from '@/components/ui/Primitives';
import { SoundOutlined, StopOutlined } from '@/components/ui/Icons';
import { DEFAULT_DICTATION_RATE, DICTATION_PLAYBACK_RATES } from '@/config/dictationPlayback';
import styles from '@/features/toeic/components/ToeicDictationPlayer.module.css';
import { ListeningUtils } from '@/lib/listeningUtils';
import { SpeechService } from '@/lib/speechService';

/** Accuracy (%) from which a dictation attempt is considered successful. */
const SUCCESS_ACCURACY_PERCENT = 90;

/**
 * Listening dictation trainer (legacy "Sát thủ TOEIC Listening"): paste a transcript, play it at 0.5x/0.8x/1x,
 * type what you hear and get a client-side accuracy score. Runs fully in the browser.
 * TODO: [Backend API Required] GET /api/v1/toeic/listening/clips to serve audio clips with timed transcript cues.
 */
export const ToeicDictationPlayer: React.FC = () => {
  const [transcript, setTranscript] = useState<string>('');
  const [attempt, setAttempt] = useState<string>('');
  const [rate, setRate] = useState<number>(DEFAULT_DICTATION_RATE);
  const [isChecked, setIsChecked] = useState<boolean>(false);

  const accuracy = ListeningUtils.calculateDictationAccuracy(transcript, attempt);

  return (
    <Card
      className={styles.card}
      title={
        <Space>
          <SoundOutlined />
          <span>Luyện nghe chép chính tả</span>
        </Space>
      }
      extra={
        <Radio.Group size="small" value={rate} onChange={(event) => setRate(event.target.value)}>
          {DICTATION_PLAYBACK_RATES.map((value) => (
            <Radio.Button key={value} value={value}>
              {value}x
            </Radio.Button>
          ))}
        </Radio.Group>
      }
    >
      <Space direction="vertical" size={16} className="lp-full-width">
        <div>
          <Typography.Text strong className={styles.sectionLabel}>
            Đoạn văn bản chuẩn (transcript) cần luyện:
          </Typography.Text>
          <Input.TextArea
            rows={3}
            value={transcript}
            placeholder="Dán đoạn hội thoại tiếng Anh vào đây..."
            onChange={(event) => {
              setTranscript(event.target.value);
              setIsChecked(false);
            }}
          />
        </div>

        <Space>
          <Button
            type="primary"
            icon={<SoundOutlined />}
            disabled={!transcript.trim()}
            onClick={() => SpeechService.speak(transcript, rate)}
          >
            Nghe ({rate}x)
          </Button>
          <Button icon={<StopOutlined />} onClick={SpeechService.stop}>
            Dừng
          </Button>
        </Space>

        <div>
          <Typography.Text strong className={styles.sectionLabel}>
            Nhập những gì bạn nghe được:
          </Typography.Text>
          <Input.TextArea
            rows={3}
            value={attempt}
            placeholder="Type exactly what you hear..."
            onChange={(event) => {
              setAttempt(event.target.value);
              setIsChecked(false);
            }}
          />
        </div>

        <div className={styles.accuracyRow}>
          <Button disabled={!transcript.trim() || !attempt.trim()} onClick={() => setIsChecked(true)}>
            Kiểm tra đáp án
          </Button>
          {isChecked && (
            <Tag
              className={styles.accuracyTag}
              color={accuracy >= SUCCESS_ACCURACY_PERCENT ? 'success' : 'warning'}
            >
              Độ chính xác: {accuracy}%
            </Tag>
          )}
        </div>
      </Space>
    </Card>
  );
};
