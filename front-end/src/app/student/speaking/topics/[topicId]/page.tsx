
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from '@/shared/router/navigation';
import { useParams, useRouter } from '@/shared/router/navigation';
import { ChevronLeft, ArrowRight, RotateCcw, AlertTriangle, BookOpen, Volume2, Sparkles, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentShell } from '@/components/student/StudentShell';
import { SpeakingStepLayout } from '@/components/speaking/SpeakingStepLayout';
import {
  SplitPaneLayout,
  SpeakingStimulusPane,
  SpeakingInteractionPane,
  type SpeakingStimulusData,
  type SpeakingEvaluationFeedback,
} from '@/components/speaking/split-pane';
import { getTopicById, allTopicLibraryItems } from '@/data/speaking/topic-library';
import { createSTTService, type ISTTService, type STTRecognitionResult } from '@/lib/speaking/stt';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { speak, silenceSpeech } from '@/lib/study';

export default function SpeakingTopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topicId = params?.topicId as string;

  const topic = useMemo(() => {
    if (!topicId) return undefined;
    return getTopicById(topicId);
  }, [topicId]);

  // STT & Recorder state
  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [evaluation, setEvaluation] = useState<SpeakingEvaluationFeedback | null>(null);

  const sttServiceRef = useRef<ISTTService | null>(null);
  const {
    startRecording: startMediaRecording,
    stopRecording: stopMediaRecording,
    audioUrl: recordedAudioUrl,
    audioLevel,
    reset: resetAudioRecorder,
  } = useAudioRecorder({ maxDurationSeconds: 120 });

  // Init STT engine
  useEffect(() => {
    const service = createSTTService('auto', {
      lang: 'en-US',
      continuous: true,
      interimResults: true,
    });
    sttServiceRef.current = service;

    return () => {
      service.abort();
      silenceSpeech();
    };
  }, []);

  // Evaluation calculation when student completes recording
  const evaluateSpeech = useCallback(
    (transcriptText: string) => {
      if (!topic || !transcriptText.trim()) return;

      const lower = transcriptText.toLowerCase();
      const allTargetWords = (topic.keyVocabulary || []).map((v) => v.term.toLowerCase());

      const matched: string[] = [];
      const missed: string[] = [];

      allTargetWords.forEach((term) => {
        if (lower.includes(term)) {
          matched.push(term);
        } else {
          missed.push(term);
        }
      });

      const total = allTargetWords.length;
      const score = total > 0 ? Math.round((matched.length / total) * 100) : 85;

      setEvaluation({
        score,
        passed: score >= 60,
        matchedKeywords: matched,
        missedKeywords: missed,
        feedbackVi:
          score >= 80
            ? 'Phát âm và áp dụng từ vựng ngữ cảnh rất xuất sắc! Độ trôi chảy đạt yêu cầu.'
            : score >= 60
            ? 'Khá tốt! Bạn đã sử dụng được một số từ vựng cốt lõi. Hãy thử lắp ghép thêm các cụm hành động gợi ý.'
            : 'Cần cố gắng thêm. Hãy lắng nghe lại audio mẫu và sử dụng các câu mở đầu (Sentence Starters) ở bên dưới.',
      });
    },
    [topic]
  );

  const handleStartRecording = async () => {
    setEvaluation(null);
    setInterimTranscript('');
    setFinalTranscript('');

    try {
      await startMediaRecording();
      setIsRecording(true);

      const stt = sttServiceRef.current;
      if (stt) {
        stt.onResult((res: STTRecognitionResult) => {
          if (res.isFinal) {
            setFinalTranscript((prev) => (prev ? `${prev} ${res.transcript}` : res.transcript));
            setInterimTranscript('');
          } else {
            setInterimTranscript(res.transcript);
          }
        });

        stt.onError((err) => {
          console.warn('[STT Error]', err);
        });

        await stt.start();
      }
    } catch (err) {
      console.error('[Start Recording Failed]', err);
      setIsRecording(false);
    }
  };

  const handleStopRecording = async () => {
    setIsRecording(false);

    try {
      await stopMediaRecording();
      const stt = sttServiceRef.current;
      if (stt) {
        await stt.stop();
      }

      // Delay briefly to capture any lagging transcripts
      setTimeout(() => {
        const fullTranscript = `${finalTranscript} ${interimTranscript}`.trim();
        evaluateSpeech(fullTranscript);
      }, 300);
    } catch (err) {
      console.error('[Stop Recording Failed]', err);
    }
  };

  const handleReset = () => {
    resetAudioRecorder();
    setInterimTranscript('');
    setFinalTranscript('');
    setEvaluation(null);
    setIsRecording(false);
  };

  // Find next topic in library
  const nextTopic = useMemo(() => {
    if (!topic) return null;
    const currentIndex = allTopicLibraryItems.findIndex((t) => t.id === topic.id);
    if (currentIndex >= 0 && currentIndex < allTopicLibraryItems.length - 1) {
      return allTopicLibraryItems[currentIndex + 1];
    }
    return allTopicLibraryItems[0];
  }, [topic]);

  if (!topic) {
    return (
      <StudentShell title="Không tìm thấy bài học">
        <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
          <div className="inline-flex p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/30">
            <AlertTriangle className="size-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Chủ đề không tồn tại hoặc đã được chuyển dời
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-mono">
            ID: {topicId || 'unknown'}
          </p>
          <div className="pt-4">
            <Link href="/student/speaking/topics">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium">
                <ChevronLeft className="size-4 mr-1.5" /> Quay lại thư viện chủ đề
              </Button>
            </Link>
          </div>
        </div>
      </StudentShell>
    );
  }

  // Visual cues
  const stimulusData: SpeakingStimulusData = {
    titleEn: topic.titleEn,
    titleVi: topic.titleVi,
    category: topic.subcategory || topic.category,
    level: topic.level,
    imageUrl:
      topic.imageUrl ||
      topic.keyVocabulary?.find((v) => Boolean(v.imageUrl))?.imageUrl ||
      'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
    imageAlt: topic.titleEn,
    situationVi: topic.situationVi,
    promptQuestionEn: topic.titleEn,
    cueCardBullets: topic.sampleDialogue?.map(
      (turn) => `${turn.speaker}: ${turn.text} (${turn.textVi || ''})`
    ) || [
      'Gợi ý: Trả lời rõ ràng, phát âm đủ âm đuôi.',
      'Sử dụng các cấu trúc mẫu được gợi ý bên phải.',
    ],
    keyVocabulary: topic.keyVocabulary?.map((v) => ({
      term: v.term,
      ipa: v.ipa,
      meaningVi: v.meaningVi,
      audioUrl: v.exampleEn,
    })),
  };

  // Compile starters from useful phrases and associated actions
  const actionPhrases = (topic.keyVocabulary || []).flatMap(
    (v) => v.associatedActions?.map((a) => a.en) || []
  );

  const rawPhrases = (topic.usefulPhrases || []).map((p) =>
    typeof p === 'string' ? p : p.phrase || p.text || ''
  ).filter(Boolean);

  const starters = [...rawPhrases, ...actionPhrases].slice(0, 6);

  const rawHints = (topic.usefulPhrases || []).map((p) =>
    typeof p === 'string' ? p : p.meaningVi || p.phrase || p.text || ''
  ).filter(Boolean);

  const actionHints = (topic.keyVocabulary || []).flatMap(
    (v) => v.associatedActions?.map((a) => `${v.term}: ${a.vi}`) || []
  );

  const hintsVi = [...rawHints, ...actionHints].slice(0, 5);
  const targetKeywords = (topic.keyVocabulary || []).map((v) => v.term);

  return (
    <SpeakingStepLayout
      currentStage="topics"
      shellTitle={`Luyện nói: ${topic.titleEn}`}
      headerTitle={`Chủ đề: ${topic.titleEn} (${topic.titleVi})`}
      headerIcon={<Compass className="h-4 w-4 text-amber-400" />}
      showOrientationBanner={false}
      headerActions={
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 hidden sm:inline-block">
            CEFR {topic.level}
          </span>
          <Link href="/student/speaking/topics">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white h-8 px-2.5"
            >
              <ChevronLeft className="size-3.5 mr-1" />
              <span>Thư viện</span>
            </Button>
          </Link>
          {nextTopic && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/student/speaking/topics/${nextTopic.id}`)}
              className="border-indigo-300 dark:border-indigo-500/40 bg-indigo-50 dark:bg-indigo-950/50 text-xs text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 h-8 px-2.5"
            >
              <span>Tiếp theo</span>
              <ArrowRight className="size-3.5 ml-1" />
            </Button>
          )}
        </div>
      }
      contentClassName="flex flex-col overflow-hidden"
    >
      {/* Core Split-Pane Layout */}
      <div className="flex-1 overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 rounded-2xl shadow-sm dark:shadow-none">
        <SplitPaneLayout
          ratio="50/50"
          leftPane={
            <div className="p-3 sm:p-5 h-full overflow-y-auto">
              <SpeakingStimulusPane stimulus={stimulusData} isRecording={isRecording} />
            </div>
          }
          rightPane={
            <div className="p-3 sm:p-5 h-full flex flex-col justify-center items-center overflow-y-auto">
              <div className="w-full max-w-xl">
                <SpeakingInteractionPane
                  taskPrompt={`Thực hành nói theo ngữ cảnh: "${topic.titleEn}"`}
                  contextVietnamese={topic.situationVi}
                  targetKeywords={targetKeywords}
                  suggestedStarters={starters}
                  hintsVi={hintsVi}
                  isRecording={isRecording}
                  audioLevel={audioLevel}
                  onStartRecording={handleStartRecording}
                  onStopRecording={handleStopRecording}
                  interimTranscript={interimTranscript}
                  finalTranscript={finalTranscript}
                  recordedAudioUrl={recordedAudioUrl}
                  evaluation={evaluation}
                  onReset={handleReset}
                  onRetry={handleReset}
                  onNextTask={() => {
                    if (nextTopic) {
                      router.push(`/student/speaking/topics/${nextTopic.id}`);
                    }
                  }}
                />
              </div>
            </div>
          }
        />
      </div>
    </SpeakingStepLayout>
  );
}
