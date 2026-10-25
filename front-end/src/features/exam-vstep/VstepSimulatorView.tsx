import React, { useState } from 'react';
import { Button } from '@/components/ui/Primitives';
import { CheckCircleOutlined } from '@/components/ui/Icons';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { VstepScoreSliders } from '@/features/exam-vstep/components/VstepScoreSliders';
import { VstepWritingGrader } from '@/features/exam-vstep/components/VstepWritingGrader';
import { useEvaluateWritingEssay } from '@/hooks/exam/useEvaluateWritingEssay';
import { useSubmitVstepScores } from '@/hooks/exam/useSubmitVstepScores';
import { useExamStore } from '@/stores/useExamStore';

/**
 * VSTEP workspace: four-skill score calculator (saved to the API) and AI grading of Writing Task 2 essays.
 */
export const VstepSimulatorView: React.FC = () => {
  const vstepRawScores = useExamStore((state) => state.vstepRawScores);
  const vstepResult = useExamStore((state) => state.vstepResult);
  const updateVstepRawScores = useExamStore((state) => state.updateVstepRawScores);

  const submitScores = useSubmitVstepScores();
  const evaluateEssay = useEvaluateWritingEssay();

  const [promptText, setPromptText] = useState<string>('');
  const [essayText, setEssayText] = useState<string>('');

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 08 • VSTEP 4-SKILLS"
        title="Phòng Thi VSTEP B1-C1 & Chấm Bài Viết AI"
        subtitle="Tính điểm 4 kỹ năng theo barem quy tròn 0.5 của Bộ GD&ĐT và chấm bài luận Task 2 bằng AI."
        extra={
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={submitScores.isPending}
            onClick={() => submitScores.mutate(vstepRawScores)}
          >
            Lưu bảng điểm lên Server
          </Button>
        }
      />

      <VstepScoreSliders
        scores={vstepRawScores}
        result={vstepResult}
        onChangeScore={(skill, value) => updateVstepRawScores({ [skill]: value })}
      />

      <VstepWritingGrader
        promptText={promptText}
        essayText={essayText}
        isEvaluating={evaluateEssay.isPending}
        evaluation={evaluateEssay.data ?? null}
        onChangePrompt={setPromptText}
        onChangeEssay={setEssayText}
        onEvaluate={() => evaluateEssay.mutate({ promptText, essayText })}
      />
    </div>
  );
};
