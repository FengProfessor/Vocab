'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Volume2,
  Lightbulb,
  Award,
  Zap,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { playWordAudio } from '@/lib/audio';
import { WordPairMatchWidget, WordPairMatchWidgetProps } from './WordPairMatchWidget';
import { DialogueClozeWidget, DialogueClozeWidgetProps } from './DialogueClozeWidget';
import { ReadingPassageExplorer, ReadingPassageExplorerProps } from './ReadingPassageExplorer';
import { PhoneticArticulationWidget, PhoneticArticulationProps } from './PhoneticArticulationWidget';

export interface MicroLearningStepConfig {
  hook: {
    title: string;
    scenario: string;
    scenarioVi?: string;
    imageUrl?: string;
    audioText?: string;
    badge?: string;
  };
  concept: {
    title: string;
    summary: string;
    rules?: Array<{ label: string; formula?: string; example: string; exampleVi?: string }>;
    signals?: string[];
  };
  drill: {
    type: 'word_match' | 'dialogue_cloze' | 'passage_explorer' | 'phonetic_drill';
    props: WordPairMatchWidgetProps | DialogueClozeWidgetProps | ReadingPassageExplorerProps | PhoneticArticulationProps;
  };
  mnemonic: {
    tip: string;
    anchorFormula?: string;
    imageUrl?: string;
  };
  summary: {
    canDoStatement: string;
    earnedXp?: number;
    nextStepTitle?: string;
  };
}

export interface MicroLearningContainerProps {
  config: MicroLearningStepConfig;
  onComplete: (summary: { passed: boolean; score: number; elapsedSeconds: number }) => void;
  onExit?: () => void;
}

const STEP_LABELS = [
  '1. Bối cảnh thực tế',
  '2. Quy tắc cốt lõi',
  '3. Luyện tập tương tác',
  '4. Mẹo nhớ sâu',
  '5. Hoàn thành & Quiz',
];

export const MicroLearningContainer: React.FC<MicroLearningContainerProps> = ({
  config,
  onComplete,
  onExit,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showViTranslation, setShowViTranslation] = useState(false);
  const [drillScore, setDrillScore] = useState<number>(100);
  const [drillPassed, setDrillPassed] = useState<boolean>(true);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Track elapsed session time
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Step 3 Drill Complete handler
  const handleDrillFinished = (stats: { score?: number; passed?: boolean; correct?: number; attempts?: number }) => {
    const finalScore = stats.score !== undefined ? stats.score : 100;
    const isPassed = stats.passed !== undefined ? stats.passed : true;
    setDrillScore(finalScore);
    setDrillPassed(isPassed);
  };

  const handleNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      onCompleteRef.current({
        passed: drillPassed,
        score: drillScore,
        elapsedSeconds,
      });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Render embedded drill widget dynamically
  const renderInteractiveDrill = () => {
    const { type, props } = config.drill;

    switch (type) {
      case 'word_match': {
        const matchProps = props as WordPairMatchWidgetProps;
        return (
          <WordPairMatchWidget
            pairs={matchProps.pairs}
            onComplete={(stats) => {
              handleDrillFinished({
                score: Math.round((stats.correct / Math.max(1, stats.attempts)) * 100),
                passed: true,
              });
              if (matchProps.onComplete) matchProps.onComplete(stats);
            }}
          />
        );
      }
      case 'dialogue_cloze': {
        const clozeProps = props as DialogueClozeWidgetProps;
        return (
          <DialogueClozeWidget
            dialogue={clozeProps.dialogue}
            onComplete={(stats) => {
              handleDrillFinished(stats);
              if (clozeProps.onComplete) clozeProps.onComplete(stats);
            }}
          />
        );
      }
      case 'passage_explorer': {
        const passageProps = props as ReadingPassageExplorerProps;
        return (
          <ReadingPassageExplorer
            passage={passageProps.passage}
            audioUrl={passageProps.audioUrl}
            targetWords={passageProps.targetWords}
            comprehensionQuestions={passageProps.comprehensionQuestions}
            onComplete={(stats) => {
              handleDrillFinished({ score: stats.score, passed: stats.score >= 70 });
              if (passageProps.onComplete) passageProps.onComplete(stats);
            }}
          />
        );
      }
      case 'phonetic_drill': {
        const phoneticProps = props as PhoneticArticulationProps;
        return (
          <PhoneticArticulationWidget
            ipa={phoneticProps.ipa}
            mouthTip={phoneticProps.mouthTip}
            whyHard={phoneticProps.whyHard}
            audioUrl={phoneticProps.audioUrl}
            minimalPairs={phoneticProps.minimalPairs}
            onComplete={(stats) => {
              handleDrillFinished(stats);
              if (phoneticProps.onComplete) phoneticProps.onComplete(stats);
            }}
          />
        );
      }
      default:
        return <div>Unsupported drill type</div>;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
      {/* 5-Step Progress Stepper Bar */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {STEP_LABELS.map((label, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentStep(stepNum)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none ${
                  isCurrent
                    ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200 dark:ring-indigo-900'
                    : isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                    {stepNum}
                  </span>
                )}
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content Container */}
      <div className="bg-white dark:bg-zinc-900 p-6 sm:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all min-h-[420px] flex flex-col justify-between">
        {/* STEP 1: Real-World Contextual Hook */}
        {currentStep === 1 && (
          <div className="animate-fadeIn space-y-6">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-full uppercase tracking-wider">
                {config.hook.badge || 'Tình huống giao tiếp thực tế'}
              </span>

              <button
                type="button"
                onClick={() => playWordAudio(config.hook.audioText || config.hook.scenario)}
                className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                <Volume2 className="w-4 h-4" />
                <span>Nghe tình huống</span>
              </button>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {config.hook.title}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
                Hãy quan sát cách kiến thức này được người bản xứ sử dụng trong đời sống thực.
              </p>
            </div>

            {/* Illustration Image if provided */}
            {config.hook.imageUrl && (
              <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 relative shadow-inner">
                <img
                  src={config.hook.imageUrl}
                  alt={config.hook.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Scenario Dialogue Card */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80">
              <p className="text-base sm:text-lg text-zinc-800 dark:text-zinc-200 leading-relaxed font-medium">
                "{config.hook.scenario}"
              </p>

              {config.hook.scenarioVi && (
                <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-700/60">
                  <button
                    type="button"
                    onClick={() => setShowViTranslation(!showViTranslation)}
                    className="text-xs text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 font-semibold mb-1"
                  >
                    {showViTranslation ? 'Ẩn bản dịch tiếng Việt' : 'Xem dịch nghĩa tiếng Việt'}
                  </button>
                  {showViTranslation && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                      "{config.hook.scenarioVi}"
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: Micro-rule / Core Concept */}
        {currentStep === 2 && (
          <div className="animate-fadeIn space-y-6">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-lg">
                <Lightbulb className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Quy tắc vi mô 1 phút (Micro-rule)
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                {config.concept.title}
              </h2>
              <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {config.concept.summary}
              </p>
            </div>

            {/* Rule Formula Cards */}
            {config.concept.rules && config.concept.rules.length > 0 && (
              <div className="space-y-3">
                {config.concept.rules.map((rule, rIdx) => (
                  <div
                    key={rIdx}
                    className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-sm text-indigo-950 dark:text-indigo-200 mb-1">
                        {rule.label}
                      </div>
                      <div className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                        Ví dụ: <span className="font-semibold">{rule.example}</span>
                        {rule.exampleVi && <span className="text-zinc-500 italic ml-2">({rule.exampleVi})</span>}
                      </div>
                    </div>

                    {rule.formula && (
                      <div className="px-3 py-1.5 bg-white dark:bg-zinc-800 rounded-xl border border-indigo-200 dark:border-indigo-800 font-mono text-xs font-bold text-indigo-700 dark:text-indigo-300 shrink-0 self-start sm:self-center">
                        {rule.formula}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Signal words chips */}
            {config.concept.signals && config.concept.signals.length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
                  Dấu hiệu nhận biết trọng tâm
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.concept.signals.map((sig, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold"
                    >
                      {sig}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Interactive Practice Drill */}
        {currentStep === 3 && (
          <div className="animate-fadeIn space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <Zap className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Thực hành tương tác tức thời
                </span>
              </div>
            </div>

            {/* Embedded widget */}
            {renderInteractiveDrill()}
          </div>
        )}

        {/* STEP 4: Memory Anchor / Mnemonic Tip */}
        {currentStep === 4 && (
          <div className="animate-fadeIn space-y-6">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                Điểm neo ghi nhớ sâu (Memory Anchor)
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Mẹo nhớ bản chất không bao giờ quên
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Liên tưởng âm thanh, hình ảnh và ngữ cảnh để chuyển kiến thức vào trí nhớ dài hạn (LTM).
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row items-center gap-6">
              {config.mnemonic.imageUrl && (
                <img
                  src={config.mnemonic.imageUrl}
                  alt="Mnemonic"
                  className="w-28 h-28 object-cover rounded-2xl shadow-sm shrink-0 border border-purple-200"
                />
              )}
              <div className="space-y-3">
                <p className="text-base sm:text-lg text-purple-950 dark:text-purple-100 font-medium leading-relaxed">
                  💡 {config.mnemonic.tip}
                </p>
                {config.mnemonic.anchorFormula && (
                  <div className="inline-block px-3 py-1 bg-white dark:bg-zinc-800 rounded-lg text-xs font-mono font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                    Công thức neo: {config.mnemonic.anchorFormula}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Transition to Mini-Quiz / Node Completion */}
        {currentStep === 5 && (
          <div className="animate-fadeIn text-center space-y-6 py-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Sẵn sàng kiểm tra năng lực
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
                Hoàn thành xuất sắc bài học vi mô!
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                Bạn đã nắm vững bối cảnh, quy tắc và thực hành tương tác thành công.
              </p>
            </div>

            {/* Can-Do Statement Verified */}
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center gap-3 text-left">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs font-semibold uppercase text-emerald-800 dark:text-emerald-400">
                  Mục tiêu năng lực đầu ra (Can-Do):
                </div>
                <div className="text-sm font-bold text-emerald-950 dark:text-emerald-200">
                  "{config.summary.canDoStatement}"
                </div>
              </div>
            </div>

            {/* XP Awarded & Stats */}
            <div className="flex items-center justify-center gap-4 text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300">
              <div className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                🎁 +{config.summary.earnedXp || 15} XP tích lũy
              </div>
              <div className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                ⏱️ Thời gian học: {Math.floor(elapsedSeconds / 60)}p {elapsedSeconds % 60}s
              </div>
            </div>
          </div>
        )}

        {/* Stepper Navigation Footer */}
        <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-6 mt-6">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={handlePrevStep}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              currentStep === 1
                ? 'opacity-0 pointer-events-none'
                : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>

          <button
            type="button"
            onClick={handleNextStep}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition hover:shadow active:scale-95"
          >
            <span>{currentStep === 5 ? 'Vào Mini-Quiz đánh giá' : 'Bước tiếp theo'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MicroLearningContainer;
