import React, { useEffect, useState } from 'react';
import { Button, Card, Slider, Space, Tag, Typography } from 'antd';
import {
  PauseCircleFilled,
  PlayCircleFilled,
  ReloadOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { ListeningUtils } from '@/lib/listeningUtils';
import { TranscriptCueDto } from '@/types/exam/TranscriptCueDto';

/**
 * Props for the WaveformPlayer synchronized audio and transcript player component.
 */
interface WaveformPlayerProps {
  /** Audio track title. */
  title: string;

  /** Total audio duration in seconds. */
  durationSeconds: number;

  /** Ordered array of sentence transcript cues synchronized via O(log N) binary search. */
  cues: readonly TranscriptCueDto[];

  /** Optional callback notified whenever the active cue index changes. */
  onActiveCueChange?: (activeIndex: number) => void;
}

/**
 * Interactive audio waveform player with playback speed controls and O(log N) binary-search cue synchronization.
 */
export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  title,
  durationSeconds,
  cues,
  onActiveCueChange,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);

  const activeCueIndex = ListeningUtils.findActiveCueIndex(cues, currentTime);

  useEffect(() => {
    if (onActiveCueChange) {
      onActiveCueChange(activeCueIndex);
    }
  }, [activeCueIndex, onActiveCueChange]);

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 0.25 * playbackRate;
        if (next >= durationSeconds) {
          setIsPlaying(false);
          return 0;
        }
        return Number(next.toFixed(2));
      });
    }, 250);

    return () => window.clearInterval(timer);
  }, [isPlaying, playbackRate, durationSeconds]);

  const activeCue = activeCueIndex >= 0 ? cues[activeCueIndex] : null;

  return (
    <Card size="small" style={{ background: '#0f172a', color: '#f8fafc', borderRadius: 14 }}>
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <SoundOutlined style={{ color: '#818cf8', fontSize: 18 }} />
            <Typography.Text strong style={{ color: '#f8fafc' }}>
              {title}
            </Typography.Text>
          </Space>
          <Space>
            {[0.75, 1.0, 1.25].map((rate) => (
              <Tag
                key={rate}
                color={playbackRate === rate ? 'geekblue' : 'default'}
                style={{ cursor: 'pointer', margin: 0 }}
                onClick={() => setPlaybackRate(rate)}
              >
                {rate}x
              </Tag>
            ))}
          </Space>
        </div>

        <Slider
          min={0}
          max={durationSeconds}
          step={0.5}
          value={currentTime}
          onChange={(val) => setCurrentTime(val)}
          tooltip={{ formatter: (val) => ListeningUtils.formatTimeMmSs(val ?? 0) }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <Button
              type="primary"
              shape="round"
              icon={isPlaying ? <PauseCircleFilled /> : <PlayCircleFilled />}
              onClick={() => setIsPlaying((prev) => !prev)}
            >
              {isPlaying ? 'Tạm dừng' : 'Phát Audio'}
            </Button>
            <Button
              shape="round"
              icon={<ReloadOutlined />}
              onClick={() => {
                setIsPlaying(false);
                setCurrentTime(0);
              }}
            >
              Đầu bài
            </Button>
          </Space>

          <Typography.Text style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
            {ListeningUtils.formatTimeMmSs(currentTime)} /{' '}
            {ListeningUtils.formatTimeMmSs(durationSeconds)}
          </Typography.Text>
        </div>

        {activeCue && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(79, 70, 229, 0.22)',
              borderLeft: '4px solid #818cf8',
              borderRadius: 8,
            }}
          >
            <Typography.Text style={{ color: '#e0e7ff', display: 'block', fontWeight: 600 }}>
              {activeCue.speaker ? `[${activeCue.speaker}] ` : ''}
              {activeCue.text}
            </Typography.Text>
            {activeCue.translation && (
              <Typography.Text style={{ color: '#cbd5e1', fontSize: 13 }}>
                {activeCue.translation}
              </Typography.Text>
            )}
          </div>
        )}
      </Space>
    </Card>
  );
};
