import React, { useState } from 'react';
import { Col, Row } from '@/components/ui/Primitives';
import { PageHeaderCard } from '@/components/common/PageHeaderCard';
import { CoachChatPanel } from '@/features/ai-coach/components/CoachChatPanel';
import { SentenceAnalysisCard } from '@/features/ai-coach/components/SentenceAnalysisCard';
import { useAnalyzeSentence } from '@/hooks/aicoach/useAnalyzeSentence';
import { useSpeakingDialogue } from '@/hooks/aicoach/useSpeakingDialogue';
import { useAuthStore } from '@/stores/useAuthStore';
import { CoachMessageItem } from '@/types/aicoach/CoachMessageItem';
import { CoachMessageSender } from '@/types/enums/CoachMessageSender';
import { SubscriptionPlanType } from '@/types/enums/SubscriptionPlanType';

/**
 * Socratic AI tutor (POST /ai-coaching/speaking/dialogue) and Pro-only sentence analyzer
 * (POST /ai-coaching/sentence/analyze).
 */
export const AiCoachView: React.FC = () => {
  const plan = useAuthStore((state) => state.user?.subscriptionPlan ?? SubscriptionPlanType.Free);
  const canAnalyze = plan !== SubscriptionPlanType.Free;

  const [messages, setMessages] = useState<CoachMessageItem[]>([]);
  const dialogue = useSpeakingDialogue();
  const analyzeSentence = useAnalyzeSentence();

  const handleSend = (text: string): void => {
    const history = messages.map((m) => `${m.sender}: ${m.text}`);
    const studentMessage: CoachMessageItem = {
      id: crypto.randomUUID(),
      sender: CoachMessageSender.Student,
      text,
    };
    setMessages((previous) => [...previous, studentMessage]);

    dialogue.mutate(
      { lastTranscript: text, history },
      {
        onSuccess: (reply) => {
          if (!reply) {
            return;
          }
          const parts = [reply.response, reply.feedback && `Nhận xét: ${reply.feedback}`, reply.suggestedResponse && `Gợi ý diễn đạt: "${reply.suggestedResponse}"`];
          setMessages((previous) => [
            ...previous,
            { id: crypto.randomUUID(), sender: CoachMessageSender.Tutor, text: parts.filter(Boolean).join('\n') },
          ]);
        },
      }
    );

    if (canAnalyze) {
      analyzeSentence.mutate(text);
    }
  };

  return (
    <div>
      <PageHeaderCard
        badgeText="MODULE 09 • SOCRATIC AI TUTOR"
        title="Trợ Lý AI Socratic & Phân Tích Cú Pháp"
        subtitle="Gửi câu tiếng Anh để được góp ý và gợi ý nâng cấp lên band B2/C1."
      />

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <CoachChatPanel messages={messages} isSending={dialogue.isPending} onSend={handleSend} />
        </Col>
        <Col xs={24} lg={10}>
          <SentenceAnalysisCard
            analysis={analyzeSentence.data ?? null}
            isAvailable={canAnalyze}
            isLoading={analyzeSentence.isPending}
          />
        </Col>
      </Row>
    </div>
  );
};
