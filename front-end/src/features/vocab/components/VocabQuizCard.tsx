import React, { useState, useMemo } from 'react';
import { Button, Card, Col, Row, Space, Tag, Typography, theme } from 'antd';
import {
  CheckCircleFilled,
  CloseCircleFilled,
  FireFilled,
  RightOutlined,
  ThunderboltFilled,
} from '@ant-design/icons';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import { VocabWordDto } from '@/types/vocab/VocabWordDto';

interface VocabQuizCardProps {
  /** Complete list of vocabulary words available in the current deck. */
  words: VocabWordDto[];
  /** Callback when user finishes a question or scores points. */
  onScoreChange?: (score: number) => void;
}

/**
 * Interactive 4-choice vocabulary quiz component providing real-time feedback,
 * contextual sentence verification, and consecutive answer streak bonuses.
 */
export const VocabQuizCard: React.FC<VocabQuizCardProps> = ({ words, onScoreChange }) => {
  const { token } = theme.useToken();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [streak, setStreak] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  const activeWord: VocabWordDto | undefined = words[currentIndex % Math.max(1, words.length)];

  // Generate 4 multiple-choice answers: 1 correct + 3 distractor meanings
  const options = useMemo(() => {
    if (!activeWord || words.length === 0) {
      return [];
    }
    const distractors = words
      .filter((w) => w.id !== activeWord.id)
      .map((w) => w.meaningVi)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // Fallback if deck has fewer than 4 items
    while (distractors.length < 3) {
      distractors.push(`Ý nghĩa phụ trợ ${distractors.length + 1}`);
    }

    const allOptions = [activeWord.meaningVi, ...distractors];
    return allOptions.sort(() => Math.random() - 0.5);
  }, [activeWord, words]);

  const correctIndex = useMemo(() => {
    if (!activeWord) return -1;
    return options.indexOf(activeWord.meaningVi);
  }, [activeWord, options]);

  const handleSelectOption = (idx: number): void => {
    if (selectedOption !== null || !activeWord) return;
    setSelectedOption(idx);

    const isCorrect = idx === correctIndex;
    if (isCorrect) {
      const nextStreak = streak + 1;
      const points = 10 + nextStreak * 2;
      setStreak(nextStreak);
      setScore((prev) => {
        const nextScore = prev + points;
        onScoreChange?.(nextScore);
        return nextScore;
      });
    } else {
      setStreak(0);
    }
  };

  const handleNextQuestion = (): void => {
    setSelectedOption(null);
    setCurrentIndex((prev) => prev + 1);
  };

  if (!activeWord) {
    return (
      <Card>
        <Typography.Text type="secondary">Chưa có đủ từ vựng để tạo bài Quiz.</Typography.Text>
      </Card>
    );
  }

  const isAnswered = selectedOption !== null;
  const isCorrect = selectedOption === correctIndex;

  return (
    <Card
      style={{
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <Space size={12}>
          <CertLevelTag level={activeWord.certLevel} />
          <Tag color="blue">Câu hỏi {currentIndex + 1}</Tag>
          {streak > 1 && (
            <Tag color="volcano" icon={<FireFilled />}>
              Streak x{streak}
            </Tag>
          )}
        </Space>

        <Space size={14}>
          <Typography.Text strong style={{ color: '#ca8a04' }}>
            <ThunderboltFilled /> {score} Điểm
          </Typography.Text>
        </Space>
      </div>

      <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
        <Typography.Text type="secondary" style={{ fontSize: 13, textTransform: 'uppercase' }}>
          Chọn nghĩa tiếng Việt chính xác nhất
        </Typography.Text>
        <Typography.Title
          level={2}
          style={{ margin: '8px 0 4px', color: token.colorPrimary, fontSize: 32 }}
        >
          {activeWord.word}
        </Typography.Title>
        <Typography.Text type="secondary" style={{ fontSize: 16 }}>
          {activeWord.phonetic} ({String(activeWord.partOfSpeech)})
        </Typography.Text>
      </div>

      <Row gutter={[12, 12]}>
        {options.map((option, idx) => {
          let btnStyle: React.CSSProperties = {
            height: 'auto',
            minHeight: 52,
            padding: '12px 16px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 14,
            width: '100%',
            whiteSpace: 'normal',
          };

          let icon = null;

          if (isAnswered) {
            if (idx === correctIndex) {
              btnStyle = {
                ...btnStyle,
                background: token.colorSuccessBg,
                borderColor: token.colorSuccess,
                color: token.colorSuccess,
                fontWeight: 600,
              };
              icon = <CheckCircleFilled style={{ color: token.colorSuccess, fontSize: 18 }} />;
            } else if (idx === selectedOption) {
              btnStyle = {
                ...btnStyle,
                background: token.colorErrorBg,
                borderColor: token.colorError,
                color: token.colorError,
              };
              icon = <CloseCircleFilled style={{ color: token.colorError, fontSize: 18 }} />;
            }
          }

          return (
            <Col xs={24} sm={12} key={idx}>
              <Button
                style={btnStyle}
                disabled={isAnswered && idx !== correctIndex && idx !== selectedOption}
                onClick={() => handleSelectOption(idx)}
              >
                <span>{option}</span>
                {icon}
              </Button>
            </Col>
          );
        })}
      </Row>

      {isAnswered && (
        <div
          style={{
            marginTop: 20,
            padding: 16,
            background: isCorrect ? token.colorSuccessBg : token.colorErrorBg,
            borderRadius: 12,
            border: `1px solid ${isCorrect ? token.colorSuccessBorder : token.colorErrorBorder}`,
          }}
        >
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text strong style={{ color: isCorrect ? token.colorSuccess : token.colorError }}>
              {isCorrect ? 'Chính xác! +10 XP' : `Chưa đúng. Đáp án: ${activeWord.meaningVi}`}
            </Typography.Text>
            {activeWord.exampleEn && (
              <Typography.Text style={{ fontSize: 13 }}>
                Ví dụ: <em>&ldquo;{activeWord.exampleEn}&rdquo;</em>
              </Typography.Text>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <Button
                type="primary"
                icon={<RightOutlined />}
                onClick={handleNextQuestion}
              >
                Câu tiếp theo
              </Button>
            </div>
          </Space>
        </div>
      )}
    </Card>
  );
};
