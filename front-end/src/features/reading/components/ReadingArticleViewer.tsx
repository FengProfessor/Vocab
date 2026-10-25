import React, { useState } from 'react';
import { Button, Card, Empty, Space, Tag, Typography } from '@/components/ui/Primitives';
import { PlusCircleOutlined } from '@/components/ui/Icons';
import { CertLevelTag } from '@/components/common/CertLevelTag';
import styles from '@/features/reading/components/ReadingArticleViewer.module.css';
import { ReadingArticleViewerProps } from '@/features/reading/types/ReadingArticleViewerProps';

/** A selection counts as a word when it is a single alphabetic token. */
const SINGLE_WORD_PATTERN = /^[A-Za-z'-]{2,}$/;

/**
 * Reader for a published article. Selecting a word (or tapping a highlighted keyword) adds it to the FSRS deck
 * after a dictionary lookup for its real meaning.
 * TODO: [Backend API Required] sentence-level Vietnamese translation for the bilingual mode, and the
 * `questionsJson` schema for article comprehension questions.
 */
export const ReadingArticleViewer: React.FC<ReadingArticleViewerProps> = ({
  article,
  keywords,
  savingWord,
  onSaveWord,
}) => {
  const [selectedWord, setSelectedWord] = useState<string>('');

  /** Captures a single selected English word so it can be added to the deck. */
  const handlePassageMouseUp = (): void => {
    const selection = window.getSelection()?.toString().trim() ?? '';
    setSelectedWord(SINGLE_WORD_PATTERN.test(selection) ? selection.toLowerCase() : '');
  };

  if (!article) {
    return (
      <Card>
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn một bài đọc từ danh sách." />
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space size={12}>
          <CertLevelTag level={article.certLevel} />
          <Typography.Text strong>{article.title}</Typography.Text>
          <Tag color="cyan">{article.topic}</Tag>
        </Space>
      }
    >
      <Space direction="vertical" size={16} className="lp-full-width">
        {keywords.length > 0 && (
          <div className={styles.keywords}>
            <Typography.Text type="secondary" className={styles.hint}>
              Từ vựng trọng tâm (bấm để thêm vào FSRS):
            </Typography.Text>
            {keywords.map((keyword) => (
              <Button
                key={keyword}
                size="small"
                icon={<PlusCircleOutlined />}
                loading={savingWord === keyword}
                onClick={() => onSaveWord(keyword)}
              >
                {keyword}
              </Button>
            ))}
          </div>
        )}

        {selectedWord && (
          <Button
            type="primary"
            size="small"
            icon={<PlusCircleOutlined />}
            loading={savingWord === selectedWord}
            onClick={() => onSaveWord(selectedWord)}
          >
            Thêm &ldquo;{selectedWord}&rdquo; vào FSRS
          </Button>
        )}

        <div className={styles.passage} onMouseUp={handlePassageMouseUp}>
          <Typography.Paragraph className={styles.paragraph}>{article.contentText}</Typography.Paragraph>
        </div>
      </Space>
    </Card>
  );
};
