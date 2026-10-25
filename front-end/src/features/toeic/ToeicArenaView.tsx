import React, { useState } from 'react';
import { Alert, Button, Card, Progress, Skeleton, Statistic } from '@/components/ui/Primitives';
import { CheckCircleOutlined } from '@/components/ui/Icons';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { ToeicDictationPlayer } from '@/features/toeic/components/ToeicDictationPlayer';
import { ToeicQuestionSheet } from '@/features/toeic/components/ToeicQuestionSheet';
import { ToeicScoreModal } from '@/features/toeic/components/ToeicScoreModal';
import { useSubmitToeicExam } from '@/hooks/toeic/useSubmitToeicExam';
import { useExamStore } from '@/stores/useExamStore';

/**
 * TOEIC arena: listening dictation trainer and the full-test answer sheet scored by the server.
 * TODO: [Backend API Required] GET /api/v1/toeic/tests and /api/v1/toeic/tests/{id} (legacy /api/toeic/test) so a
 * test can be loaded into the store with `loadToeicTest`; until then the answer sheet stays empty.
 */
export const ToeicArenaView: React.FC = () => {
  const questions = useExamStore((state) => state.toeicQuestions);
  const selectedAnswers = useExamStore((state) => state.selectedAnswers);
  const flaggedQuestions = useExamStore((state) => state.flaggedQuestions);
  const toeicResult = useExamStore((state) => state.toeicResult);
  const selectAnswer = useExamStore((state) => state.selectAnswer);
  const toggleFlagQuestion = useExamStore((state) => state.toggleFlagQuestion);
  const resetToeic = useExamStore((state) => state.resetToeic);

  const submitExam = useSubmitToeicExam();
  const [scoreModalOpen, setScoreModalOpen] = useState<boolean>(false);

  const hasTest = questions.length > 0;
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = hasTest ? Math.round((answeredCount / questions.length) * 100) : 0;

  const handleSubmit = (): void => {
    submitExam.mutate(undefined, { onSuccess: () => setScoreModalOpen(true) });
  };

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 07 • TOEIC ARENA"
        title="Luyện Thi TOEIC & Nghe Chép Chính Tả"
        subtitle="Luyện nghe chép chính tả và làm đề thi; điểm quy đổi thang 10-990 do máy chủ chấm."
        extra={
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            disabled={!hasTest || answeredCount === 0 || Boolean(toeicResult)}
            loading={submitExam.isPending}
            onClick={handleSubmit}
          >
            Nộp bài & Chấm điểm
          </Button>
        }
      />

      <ToeicDictationPlayer />

      {hasTest ? (
        <>
          <Card className="lp-mb-20">
            <Statistic
              title="Câu hỏi đã trả lời"
              value={answeredCount}
              suffix={`/ ${questions.length} câu`}
            />
            <Progress percent={progressPercent} />
            {toeicResult && (
              <Button className="lp-mb-16" onClick={resetToeic}>
                Làm lại bài thi
              </Button>
            )}
          </Card>
          {submitExam.isPending ? (
            <Card>
              <Skeleton active paragraph={{ rows: 5 }} />
            </Card>
          ) : (
            <ToeicQuestionSheet
              questions={questions}
              selectedAnswers={selectedAnswers}
              flaggedQuestions={flaggedQuestions}
              onSelectAnswer={selectAnswer}
              onToggleFlag={toggleFlagQuestion}
            />
          )}
        </>
      ) : (
        <Alert
          type="info"
          showIcon
          message="Chưa có đề thi TOEIC"
          description="Danh sách đề thi sẽ xuất hiện khi backend cung cấp API đề thi (đang chờ triển khai)."
        />
      )}

      <ToeicScoreModal
        open={scoreModalOpen}
        result={toeicResult}
        onClose={() => setScoreModalOpen(false)}
      />
    </div>
  );
};
