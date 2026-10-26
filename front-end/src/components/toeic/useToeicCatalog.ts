import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  getPartProgressStats,
  resetPartProgress,
  getQuestionsForReview,
  TOEIC_HISTORY_UPDATED_EVENT,
  type PartProgressStats,
} from '@/lib/toeic-question-history';
import {
  catalog,
  PART_DEFINITIONS,
  PART_QUESTION_PRESETS,
  TESTS_PER_PAGE,
  emptyPartProgress,
  type ToeicActiveTab,
  type ToeicListeningYear,
  type ToeicTestFilter,
  type ToeicFilterMode,
  type UserExamStatus,
} from './toeicCatalogConstants';

export function useToeicCatalog({
  tabParam,
  partParam,
}: {
  tabParam: string | null;
  partParam: string | null;
}) {
  const initialTab: ToeicActiveTab =
    tabParam === 'practice_parts' || tabParam === 'practice'
      ? 'practice_parts'
      : tabParam === 'review_flagged' || tabParam === 'flagged' || tabParam === 'review'
        ? 'review_flagged'
        : 'full_test';
  const initialPart = parseInt(partParam || '1', 10);
  const validPart = initialPart >= 1 && initialPart <= 7 ? initialPart : 1;

  const [activeTab, setActiveTab] = useState<ToeicActiveTab>(initialTab);
  const [selectedPart, setSelectedPart] = useState<number>(validPart);
  const [selectedListeningYear, setSelectedListeningYear] = useState<ToeicListeningYear>('all');
  const [reviewCount, setReviewCount] = useState<number>(0);
  const [testFilter, setTestFilter] = useState<ToeicTestFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayLayout, setDisplayLayout] = useState<'list' | 'grid'>('list');
  const [userExamStatus, setUserExamStatus] = useState<Record<string, UserExamStatus>>({});

  const getTestsForYear = useCallback((yr: string) => {
    if (yr === '2026') {
      return catalog.fullTests.filter((t) => t.source === 'ets2026');
    }
    if (yr === '2024') {
      return catalog.fullTests.filter((t) => t.source === 'ets2024');
    }
    if (yr === '2023') {
      const etsPro = catalog.fullTests.filter((t) => (t.source as string) === 'ets_pro');
      return etsPro.slice(10, 20);
    }
    if (yr === '2022') {
      const etsPro = catalog.fullTests.filter((t) => (t.source as string) === 'ets_pro');
      return etsPro.slice(0, 10);
    }
    if (yr === '2021') {
      const estudyme = catalog.fullTests.filter((t) => t.source === 'estudyme');
      return estudyme.slice(0, 5);
    }
    if (yr === '2020') {
      const study4 = catalog.fullTests.filter((t) => t.source === 'study4');
      return study4.slice(0, 10);
    }
    if (yr === '2019') {
      const study4 = catalog.fullTests.filter((t) => t.source === 'study4');
      return study4.slice(10, 20);
    }
    return catalog.fullTests;
  }, []);

  useEffect(() => {
    const updateReviewCount = () => {
      try {
        const list = getQuestionsForReview();
        setReviewCount(list.length);
      } catch {
        // ignore
      }
    };
    updateReviewCount();
    if (typeof window !== 'undefined') {
      window.addEventListener(TOEIC_HISTORY_UPDATED_EVENT, updateReviewCount);
      return () => window.removeEventListener(TOEIC_HISTORY_UPDATED_EVENT, updateReviewCount);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedLayout = localStorage.getItem('lingo_toeic_catalog_layout');
      if (savedLayout === 'list' || savedLayout === 'grid') {
        setDisplayLayout(savedLayout);
      }

      const statuses: Record<string, UserExamStatus> = {};

      try {
        const historyRaw = localStorage.getItem('lingo_toeic_exam_history');
        if (historyRaw) {
          const historyList = JSON.parse(historyRaw);
          if (Array.isArray(historyList)) {
            for (const item of historyList) {
              const id = item?.examId || item?.testId;
              if (id && !item?.part && typeof item?.scaledTotal === 'number') {
                const prevScore = statuses[id]?.score ?? -1;
                statuses[id] = {
                  isCompleted: true,
                  score: Math.max(prevScore, item.scaledTotal),
                };
              }
            }
          }
        }
      } catch {
        // ignore
      }

      try {
        const pendingRaw = localStorage.getItem('lingo_pending_toeic_save');
        if (pendingRaw) {
          const pending = JSON.parse(pendingRaw);
          const pendingAnsweredCount =
            typeof pending?.answeredCount === 'number'
              ? pending.answeredCount
              : Object.keys(pending?.answers || {}).length;
          if (pending?.testId && pending?.scoreResult?.scaledTotal !== undefined && pendingAnsweredCount > 0) {
            const prevScore = statuses[pending.testId]?.score ?? -1;
            statuses[pending.testId] = {
              isCompleted: true,
              score: Math.max(prevScore, pending.scoreResult.scaledTotal),
            };
          }
        }
      } catch {
        // ignore
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('lingo_toeic_session_')) {
          try {
            const raw = localStorage.getItem(key);
            if (!raw) continue;
            const session = JSON.parse(raw);
            const rawTestId = typeof session?.testId === 'string' ? session.testId : '';
            if (!rawTestId || rawTestId.includes('_part')) continue;
            const testId = rawTestId.replace(/_(real|practice|full_simulation)$/, '');
            if (testId && !statuses[testId]?.isCompleted) {
              const answeredCount = Object.keys(session?.answers || {}).length;
              const prevAnswered = statuses[testId]?.answeredCount || 0;
              if (
                answeredCount > prevAnswered &&
                (session?.examMode === 'practice' || (session?.timeRemainingSeconds ?? 1) > 0)
              ) {
                statuses[testId] = {
                  inProgress: true,
                  answeredCount,
                };
              }
            }
          } catch {
            // ignore
          }
        }
      }

      setUserExamStatus(statuses);
    } catch {
      // ignore
    }
  }, []);

  const handleLayoutChange = (layout: 'list' | 'grid') => {
    setDisplayLayout(layout);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lingo_toeic_catalog_layout', layout);
      } catch {
        // ignore
      }
    }
  };

  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedFilterMode, setSelectedFilterMode] = useState<ToeicFilterMode>('unseen');
  const [selectedCount, setSelectedCount] = useState<number>(() => {
    return (
      PART_DEFINITIONS.find((p) => p.part === validPart)?.defaultCount ||
      (validPart === 3 || validPart === 4 ? 3 : 10)
    );
  });
  const [customCountInput, setCustomCountInput] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<'practice' | 'real'>('practice');
  const [partProgress, setPartProgress] = useState<PartProgressStats>(() => emptyPartProgress(validPart));
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  useEffect(() => {
    setPartProgress(getPartProgressStats(selectedPart));
  }, [selectedPart]);

  useEffect(() => {
    const handleHistoryUpdate = () => {
      setPartProgress(getPartProgressStats(selectedPart));
    };

    window.addEventListener(TOEIC_HISTORY_UPDATED_EVENT, handleHistoryUpdate);
    window.addEventListener('storage', handleHistoryUpdate);

    return () => {
      window.removeEventListener(TOEIC_HISTORY_UPDATED_EVENT, handleHistoryUpdate);
      window.removeEventListener('storage', handleHistoryUpdate);
    };
  }, [selectedPart]);

  const handleResetConfirm = () => {
    resetPartProgress(selectedPart);
    setPartProgress(getPartProgressStats(selectedPart));
    setIsResetConfirmOpen(false);
    toast.success(`Đã đặt lại tiến độ Part ${selectedPart} về 0 câu.`);
  };

  const partRailRef = useRef<HTMLDivElement | null>(null);
  const [railCanScrollLeft, setRailCanScrollLeft] = useState<boolean>(false);
  const [railCanScrollRight, setRailCanScrollRight] = useState<boolean>(true);

  const checkRailScroll = useCallback(() => {
    const el = partRailRef.current;
    if (!el) return;
    setRailCanScrollLeft(el.scrollLeft > 10);
    setRailCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  }, []);

  useEffect(() => {
    checkRailScroll();
    window.addEventListener('resize', checkRailScroll);
    return () => window.removeEventListener('resize', checkRailScroll);
  }, [checkRailScroll]);

  const scrollPartRail = (dir: 'left' | 'right') => {
    const el = partRailRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -150 : 150, behavior: 'smooth' });
    setTimeout(checkRailScroll, 300);
  };

  const handleSelectPart = (partNum: number) => {
    setSelectedPart(partNum);
    const def =
      PART_DEFINITIONS.find((p) => p.part === partNum)?.defaultCount ||
      (partNum === 3 || partNum === 4 ? 3 : 10);
    setSelectedCount(def);
    setCustomCountInput('');
    if (partRailRef.current) {
      const btn = partRailRef.current.querySelector<HTMLButtonElement>(`[data-part="${partNum}"]`);
      if (btn) {
        btn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeTab === 'practice_parts') {
      params.set('tab', 'practice_parts');
      params.set('part', String(selectedPart));
    } else {
      params.delete('tab');
      params.delete('part');
    }
    const newQuery = params.toString();
    const newUrl = newQuery ? `/toeic?${newQuery}` : '/toeic';
    window.history.replaceState(null, '', newUrl);
  }, [activeTab, selectedPart]);

  const displayedFullTests = useMemo(() => {
    let list = catalog.fullTests || [];
    if (testFilter === '200q') {
      list = list.filter((t) => t.questionCount === 200);
    } else if (testFilter === 'ets2024') {
      list = list.filter((t) => t.source === 'ets2024');
    } else if (testFilter === 'ets2026') {
      list = list.filter((t) => t.source === 'ets2026');
    } else if (testFilter === 'estudyme') {
      list = list.filter((t) => t.source === 'estudyme');
    } else if (testFilter === 'study4') {
      list = list.filter((t) => t.source === 'study4');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.displayId.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [testFilter, searchQuery]);

  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [testFilter, searchQuery]);

  const totalTestPages = Math.max(1, Math.ceil(displayedFullTests.length / TESTS_PER_PAGE));
  const safeTestPage = Math.min(currentPage, totalTestPages);
  const paginatedFullTests = useMemo(() => {
    const start = (safeTestPage - 1) * TESTS_PER_PAGE;
    return displayedFullTests.slice(start, start + TESTS_PER_PAGE);
  }, [displayedFullTests, safeTestPage]);

  const currentPartMeta = useMemo(() => {
    return PART_DEFINITIONS.find((p) => p.part === selectedPart) || PART_DEFINITIONS[0];
  }, [selectedPart]);

  const presetsForCurrentPart = useMemo(() => {
    return PART_QUESTION_PRESETS[selectedPart] || [10, 20, 30];
  }, [selectedPart]);

  const isClusterPart = selectedPart === 3 || selectedPart === 4;
  const effectiveCount = isClusterPart
    ? Math.max(3, Math.round(selectedCount / 3) * 3)
    : Math.max(1, selectedCount);
  const estimatedTimeMinutes = Math.max(
    2,
    Math.ceil((effectiveCount * (currentPartMeta.secondsPerQuestion || 30)) / 60),
  );

  const totalCatalogQuestions = catalog.totalQuestions || 19175;
  const totalQuestionsFormatted = totalCatalogQuestions.toLocaleString('vi-VN');
  const totalFullTestsCount = catalog.fullTests?.length || catalog.totalFullTests || 61;
  const full200Count = useMemo(() => {
    return (catalog.fullTests || []).filter((t) => t.questionCount === 200).length;
  }, []);
  const totalPracticeQuestions = useMemo(() => {
    return PART_DEFINITIONS.reduce((acc, p) => acc + p.questionCount, 0);
  }, []);
  const totalPracticeQuestionsFormatted = totalPracticeQuestions.toLocaleString('vi-VN');
  const totalPracticeSetsCount = catalog.totalPracticeSets || 231;

  return {
    activeTab,
    setActiveTab,
    selectedPart,
    setSelectedPart,
    selectedListeningYear,
    setSelectedListeningYear,
    reviewCount,
    testFilter,
    setTestFilter,
    searchQuery,
    setSearchQuery,
    displayLayout,
    handleLayoutChange,
    userExamStatus,
    getTestsForYear,
    selectedSource,
    setSelectedSource,
    selectedFilterMode,
    setSelectedFilterMode,
    selectedCount,
    setSelectedCount,
    customCountInput,
    setCustomCountInput,
    selectedMode,
    setSelectedMode,
    partProgress,
    isResetConfirmOpen,
    setIsResetConfirmOpen,
    handleResetConfirm,
    partRailRef,
    railCanScrollLeft,
    railCanScrollRight,
    checkRailScroll,
    scrollPartRail,
    handleSelectPart,
    displayedFullTests,
    setCurrentPage,
    totalTestPages,
    safeTestPage,
    paginatedFullTests,
    currentPartMeta,
    presetsForCurrentPart,
    isClusterPart,
    effectiveCount,
    estimatedTimeMinutes,
    totalQuestionsFormatted,
    totalFullTestsCount,
    full200Count,
    totalPracticeQuestionsFormatted,
    totalPracticeSetsCount,
  };
}
