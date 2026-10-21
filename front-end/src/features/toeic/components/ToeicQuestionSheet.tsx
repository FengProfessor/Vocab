import React from 'react';
import { Button, Card, Radio, Space, Tag, Typography } from 'antd';
import { FlagFilled, FlagOutlined } from '@ant-design/icons';
import styles from '@/features/toeic/components/ToeicQuestionSheet.module.css';
import { ToeicQuestionSheetProps } from '@/features/toeic/types/ToeicQuestionSheetProps';
import { ToeicAnswerOption } from '@/types/enums/ToeicAnswerOption';

const OPTION_KEYS: readonly ToeicAnswerOption[] = Object.values(ToeicAnswerOption);

/**
 * Answer sheet of the loaded TOEIC test: question prompt (with passage when present), options and review flag.
 */
export const ToeicQuestionSheet: React.FC<ToeicQuestionSheetProps> = ({
  questions,
  selectedAnswers,
  flaggedQuestions,
  onSelectAnswer,
  onToggleFlag,
}) => {
  return (
    <Card title="Bộ đề trắc nghiệm" className={styles.card}>
      <Space direction="vertical" size={20} className="lp-full-width">
        {questions.map((question) => {
          const isFlagged = Boolean(flaggedQuestions[question.id]);
          return (
            <div key={question.id} className={styles.question}>
              <div className={styles.questionHeader}>
                <Space>
                  <Tag color="geekblue">Câu {question.questionNumber}</Tag>
                  <Tag>{question.part}</Tag>
                </Space>
                <Button
                  size="small"
                  type={isFlagged ? 'primary' : 'default'}
                  icon={isFlagged ? <FlagFilled /> : <FlagOutlined />}
                  onClick={() => onToggleFlag(question.id)}
                >
                  {isFlagged ? 'Đã đánh dấu' : 'Đánh dấu xem lại'}
                </Button>
              </div>

              {question.passageText && <div className={styles.passage}>{question.passageText}</div>}
              <Typography.Paragraph strong className={styles.prompt}>
                {question.prompt}
              </Typography.Paragraph>

              <Radio.Group
                value={selectedAnswers[question.id]}
                onChange={(event) => onSelectAnswer(question.id, event.target.value)}
              >
                <Space direction="vertical" size={8}>
                  {OPTION_KEYS.map((key) => (
                    <Radio key={key} value={key}>
                      <strong>({key})</strong> {question.options[key]}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </div>
          );
        })}
      </Space>
    </Card>
  );
};
