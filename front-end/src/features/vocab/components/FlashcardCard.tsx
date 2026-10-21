import React from 'react';
import { Button, Card, Space, Tag, Typography } from 'antd';
import { EyeOutlined, SoundOutlined } from '@ant-design/icons';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { SRS_CARD_STATE_TAG_COLOR } from '@/config/srsCardStateTagColor';
import styles from '@/features/vocab/components/FlashcardCard.module.css';
import { FlashcardCardProps } from '@/features/vocab/types/FlashcardCardProps';
import { SpeechService } from '@/lib/speechService';

/**
 * Spaced repetition flashcard showing headword, pronunciation audio and grammatical tags on the front,
 * and meaning, definition and contextual example on the back.
 */
export const FlashcardCard: React.FC<FlashcardCardProps> = ({ word, isFlipped, onToggleFlip }) => {
  return (
    <Card className={styles.card}>
      <Space direction="vertical" size={16} className="lp-full-width">
        <div className={styles.header}>
          <Space>
            <CertLevelTag level={word.certLevel} />
            <Tag color="cyan">{word.partOfSpeech.toUpperCase()}</Tag>
            <Tag color={SRS_CARD_STATE_TAG_COLOR[word.cardState]}>Trạng thái: {word.cardState}</Tag>
          </Space>
          <Button
            shape="circle"
            icon={<SoundOutlined />}
            title="Nghe phát âm chuẩn (US)"
            onClick={() => SpeechService.speak(word.word, 0.9)}
          />
        </div>

        <div className="lp-center">
          <Typography.Title level={1} className={styles.headword}>
            {word.word}
          </Typography.Title>
          {word.phonetic && (
            <Typography.Text type="secondary" className={styles.phonetic}>
              {word.phonetic}
            </Typography.Text>
          )}
        </div>

        {!isFlipped ? (
          <div className={styles.flipArea}>
            <Button
              type="primary"
              size="large"
              icon={<EyeOutlined />}
              className={styles.flipButton}
              onClick={onToggleFlip}
            >
              Lật thẻ xem nghĩa (Phím cách)
            </Button>
          </div>
        ) : (
          <div className="lp-panel">
            <Space direction="vertical" size={10} className="lp-full-width">
              <Typography.Title level={4} className={styles.meaning}>
                {word.meaningVi}
              </Typography.Title>
              {word.definitionEn && (
                <Typography.Text type="secondary" className={styles.definition}>
                  {word.definitionEn}
                </Typography.Text>
              )}
              {word.exampleEn && (
                <div className="lp-quote">
                  <Typography.Text strong>&ldquo;{word.exampleEn}&rdquo;</Typography.Text>
                  {word.exampleVi && (
                    <Typography.Text type="secondary" className={styles.exampleVi}>
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
