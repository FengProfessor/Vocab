import React from 'react';
import { Button, Card, Space, Tag, Typography, theme } from 'antd';
import { EyeOutlined, SoundOutlined } from '@ant-design/icons';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { SrsCardState } from '@/types/enums/SrsCardState';
import { VocabWordDto } from '@/types/vocab/VocabWordDto';

interface FlashcardCardProps {
  /** The current active vocabulary word item. */
  word: VocabWordDto;
  /** Whether the card is currently flipped to reveal the definition. */
  isFlipped: boolean;
  /** Callback to flip or unflip the flashcard. */
  onToggleFlip: () => void;
}

/**
 * Spaced repetition flashcard component displaying headword, pronunciation audio,
 * grammatical tags on the front, and contextual translations on the reverse side.
 */
export const FlashcardCard: React.FC<FlashcardCardProps> = ({
  word,
  isFlipped,
  onToggleFlip,
}) => {
  const { token } = theme.useToken();

  const handlePlayAudio = (e: React.MouseEvent): void => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = 'en-US';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stateColorMap: Record<SrsCardState, string> = {
    [SrsCardState.New]: 'blue',
    [SrsCardState.Learning]: 'orange',
    [SrsCardState.Review]: 'green',
    [SrsCardState.Relearning]: 'red',
  };

  return (
    <Card
      style={{
        minHeight: 340,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
        transition: 'all 0.3s ease',
      }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <CertLevelTag level={word.certLevel} />
            <Tag color="cyan">{String(word.partOfSpeech).toUpperCase()}</Tag>
            <Tag color={stateColorMap[word.cardState] ?? 'default'}>
              Trạng thái: {word.cardState}
            </Tag>
          </Space>
          <Button
            shape="circle"
            icon={<SoundOutlined />}
            size="middle"
            onClick={handlePlayAudio}
            title="Nghe phát âm chuẩn (US)"
          />
        </div>

        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <Typography.Title
            level={1}
            style={{ margin: 0, color: token.colorPrimary, fontSize: 36, letterSpacing: -0.5 }}
          >
            {word.word}
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 18, marginTop: 4, display: 'block' }}>
            {word.phonetic}
          </Typography.Text>
        </div>

        {!isFlipped ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <Button
              type="primary"
              size="large"
              icon={<EyeOutlined />}
              onClick={onToggleFlip}
              style={{ minWidth: 260 }}
            >
              Lật thẻ xem nghĩa (Phím cách)
            </Button>
          </div>
        ) : (
          <div
            style={{
              padding: 16,
              background: token.colorFillAlter,
              borderRadius: 12,
              border: `1px solid ${token.colorBorderSecondary}`,
            }}
          >
            <Space direction="vertical" size={10} style={{ width: '100%' }}>
              <Typography.Title level={4} style={{ margin: 0, color: token.colorSuccess }}>
                {word.meaningVi}
              </Typography.Title>
              {word.definitionEn && (
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  {word.definitionEn}
                </Typography.Text>
              )}
              {word.exampleEn && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: token.colorPrimaryBg,
                    borderRadius: 8,
                    borderLeft: `4px solid ${token.colorPrimary}`,
                  }}
                >
                  <Typography.Text strong style={{ display: 'block', fontSize: 14 }}>
                    &ldquo;{word.exampleEn}&rdquo;
                  </Typography.Text>
                  {word.exampleVi && (
                    <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 2, display: 'block' }}>
                      {word.exampleVi}
                    </Typography.Text>
                  )}
                </div>
              )}
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
};
