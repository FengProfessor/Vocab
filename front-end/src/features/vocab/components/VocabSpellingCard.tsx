import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, Card, Input, Space, Tag, Typography } from 'antd';
import type { InputRef } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  RightOutlined,
  SoundOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import styles from '@/features/vocab/components/VocabSpellingCard.module.css';
import { VocabSpellingCardProps } from '@/features/vocab/types/VocabSpellingCardProps';
import { SpeechService } from '@/lib/speechService';
import { SpellingEvaluator } from '@/lib/spellingEvaluator';
import { SpellingVerdict } from '@/types/vocab/SpellingVerdict';

const VERDICT_CLASS: Readonly<Record<SpellingVerdict, string>> = {
  [SpellingVerdict.Correct]: styles.verdictCorrect,
  [SpellingVerdict.Close]: styles.verdictClose,
  [SpellingVerdict.Wrong]: styles.verdictWrong,
};

const VERDICT_MESSAGE: Readonly<Record<SpellingVerdict, string>> = {
  [SpellingVerdict.Correct]: 'Chính xác 100%!',
  [SpellingVerdict.Close]: 'Gần chính xác! Có lỗi chính tả nhỏ.',
  [SpellingVerdict.Wrong]: 'Chưa chính xác.',
};

/**
 * Active-recall spelling card (legacy src/app/writing): type the English word from its Vietnamese meaning.
 */
export const VocabSpellingCard: React.FC<VocabSpellingCardProps> = ({ words, onGradeWord }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userInput, setUserInput] = useState<string>('');
  const [verdict, setVerdict] = useState<SpellingVerdict | null>(null);
  const inputRef = useRef<InputRef>(null);

  const activeWord = words[currentIndex % Math.max(1, words.length)];

  useEffect(() => {
    setUserInput('');
    setVerdict(null);
    inputRef.current?.focus();
  }, [currentIndex]);

  if (!activeWord) {
    return <Alert type="info" showIcon message="Chưa có từ vựng nào để luyện viết." />;
  }

  const handleSubmit = (): void => {
    if (!userInput.trim() || verdict !== null) {
      return;
    }
    const result = SpellingEvaluator.evaluate(activeWord.word, userInput);
    setVerdict(result);
    onGradeWord?.(activeWord.id, SpellingEvaluator.toReviewQuality(result));
    if (result === SpellingVerdict.Correct) {
      SpeechService.speak(activeWord.word);
    }
  };

  const maskedExample = SpellingEvaluator.maskWord(activeWord.exampleEn, activeWord.word);

  return (
    <Card className={styles.card}>
      <div className={`lp-row-between ${styles.header}`}>
        <Space>
          <CertLevelTag level={activeWord.certLevel} />
          <Tag color="purple">
            Thẻ {(currentIndex % words.length) + 1} / {words.length}
          </Tag>
          <Tag color="cyan">{activeWord.partOfSpeech.toUpperCase()}</Tag>
        </Space>
        <Button
          shape="circle"
          icon={<SoundOutlined />}
          title="Nghe phát âm gợi ý"
          onClick={() => SpeechService.speak(activeWord.word)}
        />
      </div>

      <div className={styles.prompt}>
        <Typography.Text type="secondary" className={styles.promptHint}>
          Gõ chính tả từ tiếng Anh tương ứng
        </Typography.Text>
        <Typography.Title level={2} className={styles.meaning}>
          {activeWord.meaningVi}
        </Typography.Title>
        {activeWord.phonetic && (
          <Typography.Text type="secondary">Phiên âm gợi ý: {activeWord.phonetic}</Typography.Text>
        )}
        {maskedExample && (
          <div className={styles.cloze}>
            <em>&ldquo;{maskedExample}&rdquo;</em>
          </div>
        )}
      </div>

      <div className={styles.form}>
        <Space.Compact className="lp-full-width">
          <Input
            ref={inputRef}
            size="large"
            value={userInput}
            disabled={verdict !== null}
            placeholder="Nhập từ tiếng Anh tại đây..."
            onChange={(event) => setUserInput(event.target.value)}
            onPressEnter={verdict ? () => setCurrentIndex((i) => i + 1) : handleSubmit}
          />
          {verdict === null ? (
            <Button
              type="primary"
              size="large"
              icon={<ThunderboltFilled />}
              disabled={!userInput.trim()}
              onClick={handleSubmit}
            >
              Kiểm tra
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              icon={<RightOutlined />}
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              Tiếp tục
            </Button>
          )}
        </Space.Compact>

        {verdict && (
          <div className={`${styles.verdict} ${VERDICT_CLASS[verdict]}`}>
            {verdict === SpellingVerdict.Correct && (
              <CheckCircleFilled className={styles.verdictIcon} />
            )}
            {verdict === SpellingVerdict.Close && (
              <ExclamationCircleFilled className={styles.verdictIcon} />
            )}
            {verdict === SpellingVerdict.Wrong && (
              <CloseCircleFilled className={styles.verdictIcon} />
            )}
            <div>
              <div><Typography.Text strong>{VERDICT_MESSAGE[verdict]}</Typography.Text></div>
              <Typography.Text>
                Đáp án đúng: <strong>{activeWord.word}</strong>
              </Typography.Text>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
