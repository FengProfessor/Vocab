import React, { useCallback, useEffect, useState } from 'react';
import { Button, Space, Tabs, Tag } from 'antd';
import { CloudUploadOutlined, ReloadOutlined, SyncOutlined } from '@ant-design/icons';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { FlashcardSessionPanel } from '@/features/vocab/components/FlashcardSessionPanel';
import { FlashcardSessionSummaryModal } from '@/features/vocab/components/FlashcardSessionSummaryModal';
import { VocabLibraryTable } from '@/features/vocab/components/VocabLibraryTable';
import { VocabQuizCard } from '@/features/vocab/components/VocabQuizCard';
import { VocabSpellingCard } from '@/features/vocab/components/VocabSpellingCard';
import { WordImportDrawer } from '@/features/vocab/components/WordImportDrawer';
import { useGamificationStats } from '@/hooks/useGamificationStats';
import { useDueWordsQuery } from '@/hooks/vocab/useDueWordsQuery';
import { useSubmitWordReview } from '@/hooks/vocab/useSubmitWordReview';
import { useAuthStore } from '@/stores/useAuthStore';
import { useStudyStore } from '@/stores/useStudyStore';
import { CertLevel } from '@/types/enums/CertLevel';
import { SrsReviewQuality } from '@/types/enums/SrsReviewQuality';
import { VocabImportItemDto } from '@/types/vocab/VocabImportItemDto';

/**
 * Vocabulary hub: FSRS v5 flashcards, quiz, spelling recall and the long-term library.
 * Orchestrates data hooks and the study store; every panel is a separate component.
 */
export const VocabStudyView: React.FC = () => {
  const { streakDays } = useGamificationStats();
  const targetLevel = useAuthStore((state) => state.user?.targetCertLevel ?? CertLevel.B1);

  const words = useStudyStore((state) => state.words);
  const sessionQueue = useStudyStore((state) => state.sessionQueue);
  const isCardFlipped = useStudyStore((state) => state.isCardFlipped);
  const completedInSession = useStudyStore((state) => state.completedInSession);
  const sessionXpEarned = useStudyStore((state) => state.sessionXpEarned);
  const toggleFlip = useStudyStore((state) => state.toggleFlip);
  const gradeCard = useStudyStore((state) => state.gradeCard);
  const addWordToDeck = useStudyStore((state) => state.addWordToDeck);
  const restartSession = useStudyStore((state) => state.restartSession);

  const dueWordsQuery = useDueWordsQuery();
  const submitReview = useSubmitWordReview();

  const [importOpen, setImportOpen] = useState<boolean>(false);
  const [summaryOpen, setSummaryOpen] = useState<boolean>(false);

  const activeWord = words.find((word) => word.id === sessionQueue[0]);

  // Show the summary once the learner has reviewed cards and the queue is empty.
  useEffect(() => {
    if (completedInSession > 0 && sessionQueue.length === 0) {
      setSummaryOpen(true);
    }
  }, [completedInSession, sessionQueue.length]);

  const handleGrade = useCallback(
    (quality: SrsReviewQuality): void => {
      if (!activeWord) {
        return;
      }
      gradeCard(activeWord.id, quality);
      submitReview.mutate({ wordId: activeWord.id, quality });
    },
    [activeWord, gradeCard, submitReview]
  );

  const handleImport = (items: VocabImportItemDto[]): void => {
    items.forEach((item) =>
      addWordToDeck({
        word: item.word,
        phonetic: item.phonetic,
        partOfSpeech: item.partOfSpeech,
        meaningVi: item.meaningVi,
        definitionEn: '',
        exampleEn: item.exampleEn ?? '',
        exampleVi: item.exampleVi ?? '',
        certLevel: item.certLevel,
        audioUrl: null,
      })
    );
  };

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 03 • VOCABULARY & FSRS v5 ENGINE"
        title="Ôn tập Từ vựng Lặp lại Ngắt quãng (FSRS v5)"
        subtitle="Hàng đợi thẻ đến hạn được đồng bộ từ máy chủ; thẻ quên sẽ xuất hiện lại trong cùng phiên."
        extra={
          <Space wrap>
            <Tag color="geekblue">Đã chấm: {completedInSession} lượt</Tag>
            <Button icon={<CloudUploadOutlined />} onClick={() => setImportOpen(true)}>
              Nhập từ vựng
            </Button>
            <Button
              icon={<SyncOutlined spin={dueWordsQuery.isFetching} />}
              loading={dueWordsQuery.isFetching}
              onClick={() => void dueWordsQuery.refetch()}
            >
              Tải từ đến hạn
            </Button>
            <Button icon={<ReloadOutlined />} onClick={restartSession}>
              Ôn lại toàn bộ
            </Button>
          </Space>
        }
      />

      <Tabs
        defaultActiveKey="flashcard"
        items={[
          {
            key: 'flashcard',
            label: 'Thẻ Ghi nhớ FSRS v5',
            children: (
              <FlashcardSessionPanel
                word={activeWord}
                remainingCount={sessionQueue.length}
                isLoading={dueWordsQuery.isLoading}
                isGrading={submitReview.isPending}
                isFlipped={isCardFlipped}
                onToggleFlip={toggleFlip}
                onGrade={handleGrade}
                onOpenImport={() => setImportOpen(true)}
                onRestart={restartSession}
              />
            ),
          },
          {
            key: 'quiz',
            label: 'Trắc nghiệm (Quiz)',
            children: <VocabQuizCard words={words} />,
          },
          {
            key: 'spelling',
            label: 'Gõ chính tả (Recall)',
            children: (
              <VocabSpellingCard
                words={words}
                onGradeWord={(wordId, quality) => {
                  gradeCard(wordId, quality);
                  submitReview.mutate({ wordId, quality });
                }}
              />
            ),
          },
          {
            key: 'library',
            label: `Kho Từ Vựng (${words.length})`,
            children: <VocabLibraryTable words={words} isLoading={dueWordsQuery.isLoading} />,
          },
        ]}
      />

      <WordImportDrawer
        open={importOpen}
        defaultCertLevel={targetLevel}
        onClose={() => setImportOpen(false)}
        onImportWords={handleImport}
      />

      <FlashcardSessionSummaryModal
        open={summaryOpen}
        cardsReviewedCount={completedInSession}
        xpEarned={sessionXpEarned}
        streakDays={streakDays}
        onRestart={() => {
          restartSession();
          setSummaryOpen(false);
        }}
        onClose={() => setSummaryOpen(false)}
      />
    </div>
  );
};
