import React, { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Row, Space, Tag, Typography } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  FireFilled,
  RightOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import styles from '@/features/vocab/components/VocabQuizCard.module.css';
import { VocabQuizCardProps } from '@/features/vocab/types/VocabQuizCardProps';
import { CollectionUtils } from '@/lib/collectionUtils';
import { QUIZ_OPTION_COUNT, VocabQuizBuilder } from '@/lib/vocabQuizBuilder';

/** Base points per correct answer; each consecutive correct answer adds the streak bonus. */
const BASE_POINTS = 10;
const STREAK_BONUS = 2;

/**
 * 4-choice vocabulary quiz generated from the learner's own deck with instant feedback and streak scoring.
 * TODO: [Backend API Required] POST /api/v1/quiz/results to persist quiz results and award XP (legacy /api/quiz/save).
 */
export const VocabQuizCard: React.FC<VocabQuizCardProps> = ({ words, onScoreChange }) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  // Re-shuffle only when the deck size changes, not on every FSRS update.
  const questionOrder = useMemo(() => CollectionUtils.shuffle(words), [words.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const activeWord = questionOrder[currentIndex % Math.max(1, questionOrder.length)];

  const { options, correctIndex } = useMemo(
    () =>
      activeWord
        ? VocabQuizBuilder.buildOptions(activeWord, words)
        : { options: [] as string[], correctIndex: -1 },
    [activeWord, words]
  );

  if (!VocabQuizBuilder.canBuild(words) || !activeWord) {
    return (
      <Alert
        type="info"
        showIcon
        message={`Cần ít nhất ${QUIZ_OPTION_COUNT} từ có nghĩa khác nhau trong kho để tạo bài trắc nghiệm.`}
      />
    );
  }

  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === correctIndex;

  const handleSelect = (index: number): void => {
    if (isAnswered) {
      return;
    }
    setSelectedOption(index);
    if (index === correctIndex) {
      const nextStreak = streak + 1;
      const nextScore = score + BASE_POINTS + nextStreak * STREAK_BONUS;
      setStreak(nextStreak);
      setScore(nextScore);
      onScoreChange?.(nextScore);
    } else {
      setStreak(0);
    }
  };

  const handleNext = (): void => {
    setSelectedOption(null);
    setCurrentIndex((previous) => previous + 1);
  };

  const optionClassName = (index: number): string => {
    if (!isAnswered) {
      return styles.option;
    }
    if (index === correctIndex) {
      return `${styles.option} ${styles.optionCorrect}`;
    }
    return index === selectedOption ? `${styles.option} ${styles.optionWrong}` : styles.option;
  };

  return (
    <Card className={styles.card}>
      <div className={`lp-row-between ${styles.header}`}>
        <Space size={12}>
          <CertLevelTag level={activeWord.certLevel} />
          <Tag color="blue">Câu hỏi {currentIndex + 1}</Tag>
          {streak > 1 && (
            <Tag color="volcano" icon={<FireFilled />}>
              Streak x{streak}
            </Tag>
          )}
        </Space>
        <Typography.Text strong className={styles.score}>
          <ThunderboltFilled /> {score} Điểm
        </Typography.Text>
      </div>

      <div className={styles.prompt}>
        <Typography.Text type="secondary" className={styles.promptHint}>
          Chọn nghĩa tiếng Việt chính xác nhất
        </Typography.Text>
        <Typography.Title level={2} className={styles.headword}>
          {activeWord.word}
        </Typography.Title>
        {activeWord.phonetic && (
          <Typography.Text type="secondary">
            {activeWord.phonetic} ({activeWord.partOfSpeech})
          </Typography.Text>
        )}
      </div>

      <Row gutter={[12, 12]}>
        {options.map((option, index) => (
          <Col xs={24} sm={12} key={option}>
            <Button
              className={optionClassName(index)}
              disabled={isAnswered && index !== correctIndex && index !== selectedOption}
              onClick={() => handleSelect(index)}
            >
              <span>{option}</span>
              {isAnswered && index === correctIndex && <CheckCircleFilled />}
              {isAnswered && index === selectedOption && index !== correctIndex && (
                <CloseCircleFilled />
              )}
            </Button>
          </Col>
        ))}
      </Row>

      {isAnswered && (
        <div
          className={`${styles.feedback} ${isCorrect ? styles.feedbackCorrect : styles.feedbackWrong}`}
        >
          <Space direction="vertical" size={8} className="lp-full-width">
            <Typography.Text strong type={isCorrect ? 'success' : 'danger'}>
              {isCorrect ? 'Chính xác!' : `Chưa đúng. Đáp án: ${activeWord.meaningVi}`}
            </Typography.Text>
            {activeWord.exampleEn && (
              <Typography.Text>
                Ví dụ: <em>&ldquo;{activeWord.exampleEn}&rdquo;</em>
              </Typography.Text>
            )}
            <div className={styles.feedbackFooter}>
              <Button type="primary" icon={<RightOutlined />} onClick={handleNext}>
                Câu tiếp theo
              </Button>
            </div>
          </Space>
        </div>
      )}
    </Card>
  );
};
