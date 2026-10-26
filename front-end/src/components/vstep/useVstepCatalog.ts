import { useState, useMemo, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useSearchParams } from '@/shared/router/navigation';
import {
  getVstepProgressStats,
  getVstepExamSummaries,
  getVstepDraftStatusMap,
  clearVstepExamHistory,
  clearVstepSkillHistory,
  resetAllVstepHistory,
  VSTEP_HISTORY_UPDATED_EVENT,
  type VstepPracticeFilterMode,
  type VstepDraftSummary,
} from '@/lib/vstep-history';
import type { VstepExamCatalogItem, VstepExamSummary } from '@/lib/vstep-types';
import {
  catalog,
  ITEMS_PER_PAGE,
  PRACTICE_SKILL_META,
  normalizeViText,
  type VstepActiveTab,
  type VstepBankTotals,
  type VstepPracticeSkill,
  type VstepResetOption,
  type VstepTestFilter,
} from './vstepCatalogConstants';

export function useVstepCatalog() {
  const searchParams = useSearchParams();

  const initialTab: VstepActiveTab =
    searchParams.get('tab') === 'skill_practice' ||
    searchParams.get('flow') === 'skill_practice' ||
    searchParams.get('tab') === 'practice'
      ? 'skill_practice'
      : 'full_mock';

  const [activeTab, setActiveTab] = useState<VstepActiveTab>(initialTab);

  const requestedSkill = searchParams.get('skill');
  const initialSkill: VstepPracticeSkill =
    requestedSkill === 'reading' || requestedSkill === 'writing' || requestedSkill === 'speaking'
      ? requestedSkill
      : 'listening';
  const [selectedPracticeSkill, setSelectedPracticeSkill] = useState<VstepPracticeSkill>(initialSkill);

  const [testFilter, setTestFilter] = useState<VstepTestFilter>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [displayLayout, setDisplayLayout] = useState<'list' | 'grid'>('list');
  const [filterMode, setFilterMode] = useState<VstepPracticeFilterMode>('unseen');
  const [currentPage, setCurrentPage] = useState<number>(1);

  const [examSummaries, setExamSummaries] = useState<Record<string, VstepExamSummary>>({});
  const [hasMounted, setHasMounted] = useState<boolean>(false);

  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [resetOption, setResetOption] = useState<VstepResetOption>('listening');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const frame = window.requestAnimationFrame(() => {
      try {
        const savedLayout = localStorage.getItem('lingo_vstep_catalog_layout');
        if (savedLayout === 'list' || savedLayout === 'grid') {
          setDisplayLayout(savedLayout);
        }
      } catch {
        // ignore
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const handleLayoutChange = (layout: 'list' | 'grid') => {
    setDisplayLayout(layout);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('lingo_vstep_catalog_layout', layout);
      } catch {
        // ignore
      }
    }
  };

  const indexedItems = useMemo(() => {
    return catalog.items.map((item) => ({
      ...item,
      _searchKey: normalizeViText(
        [item.id, item.title, item.titleVi, item.badge].filter(Boolean).join(' '),
      ),
    }));
  }, []);

  const bankTotals = useMemo<VstepBankTotals>(() => {
    let listening = 0;
    let reading = 0;
    let fullMocks = 0;
    let listeningPracticeSets = 0;
    let readingPracticeSets = 0;
    let writingPracticeSets = 0;
    let speakingPracticeSets = 0;
    let writingTasks = 0;
    let speakingTasks = 0;
    for (const item of catalog.items) {
      if (item.category === 'full_mock') {
        fullMocks++;
        listening += 35;
        reading += 40;
      } else if (item.category === 'listening' || item.skills?.includes('listening')) {
        listeningPracticeSets++;
        listening += item.totalQuestions || 0;
      } else if (item.category === 'reading' || item.skills?.includes('reading')) {
        readingPracticeSets++;
        reading += item.totalQuestions || 0;
      } else if (item.category === 'writing') {
        writingPracticeSets++;
        writingTasks += item.totalTasks || 0;
      } else if (item.category === 'speaking') {
        speakingPracticeSets++;
        speakingTasks += item.totalTasks || 0;
      }
    }
    return {
      totalListening: listening,
      totalReading: reading,
      totalQuestions: listening + reading,
      totalExams: catalog.items.length,
      totalMockExams: fullMocks,
      totalPracticeSets: catalog.items.length - fullMocks,
      listeningPracticeSets,
      readingPracticeSets,
      writingPracticeSets,
      speakingPracticeSets,
      writingTasks,
      speakingTasks,
    };
  }, []);

  const [listeningStats, setListeningStats] = useState({
    answeredCount: 0,
    totalCount: bankTotals.totalListening,
    percentage: 0,
    mistakeCount: 0,
  });
  const [readingStats, setReadingStats] = useState({
    answeredCount: 0,
    totalCount: bankTotals.totalReading,
    percentage: 0,
    mistakeCount: 0,
  });
  const [draftSummaries, setDraftSummaries] = useState<Record<string, VstepDraftSummary>>({});

  const refreshHistory = useCallback(() => {
    setListeningStats(getVstepProgressStats('listening', bankTotals.totalListening));
    setReadingStats(getVstepProgressStats('reading', bankTotals.totalReading));
    setExamSummaries(getVstepExamSummaries());
    setDraftSummaries(getVstepDraftStatusMap());
  }, [bankTotals.totalListening, bankTotals.totalReading]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setHasMounted(true);
      refreshHistory();
    });

    const handleUpdate = () => refreshHistory();
    window.addEventListener(VSTEP_HISTORY_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener(VSTEP_HISTORY_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshHistory]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeTab === 'skill_practice') {
      params.set('tab', 'skill_practice');
      params.set('skill', selectedPracticeSkill);
    } else {
      params.delete('tab');
      params.delete('skill');
      params.delete('flow');
    }
    const newQuery = params.toString();
    const newUrl = newQuery ? `/vstep?${newQuery}` : '/vstep';
    window.history.replaceState(null, '', newUrl);
  }, [activeTab, selectedPracticeSkill]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setCurrentPage(1));
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, selectedPracticeSkill, testFilter, selectedLevel, selectedSource, searchQuery]);

  const { filteredItems, counts } = useMemo(() => {
    const normQ = searchQuery.trim() ? normalizeViText(searchQuery.trim()) : '';

    let itemsToFilter = indexedItems;

    if (activeTab === 'full_mock') {
      itemsToFilter = itemsToFilter.filter((item) => item.category === 'full_mock');
    } else {
      itemsToFilter = itemsToFilter.filter((item) => item.category === selectedPracticeSkill);
    }

    const levelCounts: Record<string, number> = { all: 0, B1: 0, B2: 0, C1: 0 };
    const statusCounts: Record<string, number> = { all: 0, unattempted: 0, completed: 0 };
    const sourceCounts: Record<string, number> = {
      all: 0,
      vstepowl: 0,
      onthivstep: 0,
      englishteststore: 0,
      vnu: 0,
    };

    const filtered: typeof indexedItems = [];

    for (let i = 0; i < itemsToFilter.length; i++) {
      const item = itemsToFilter[i];
      const isCompleted = hasMounted && Boolean(examSummaries[item.id]?.isCompleted);
      const itemLevel = item.cefrLevel || item.targetLevel || 'B2';
      const itemSource = item.source || 'vstepowl';

      statusCounts.all++;
      if (isCompleted) {
        statusCounts.completed++;
      } else {
        statusCounts.unattempted++;
      }

      levelCounts.all++;
      if (levelCounts[itemLevel] !== undefined) {
        levelCounts[itemLevel]++;
      }

      sourceCounts.all++;
      if (sourceCounts[itemSource] !== undefined) {
        sourceCounts[itemSource]++;
      }

      if (normQ && !item._searchKey.includes(normQ)) {
        continue;
      }

      if (activeTab === 'full_mock') {
        if (testFilter === 'unattempted' && isCompleted) continue;
        if (testFilter === 'completed' && !isCompleted) continue;
        if (testFilter === 'b1_b2' && itemLevel === 'C1') continue;
        if (testFilter === 'c1' && itemLevel !== 'C1') continue;
      } else {
        if (testFilter === 'unattempted' && isCompleted) continue;
        if (testFilter === 'completed' && !isCompleted) continue;
        if (selectedLevel !== 'all' && itemLevel !== selectedLevel) continue;
        if (selectedSource !== 'all' && itemSource !== selectedSource) continue;
      }

      filtered.push(item);
    }

    return {
      filteredItems: filtered,
      counts: {
        status: statusCounts,
        levels: levelCounts,
        sources: sourceCounts,
      },
    };
  }, [
    indexedItems,
    activeTab,
    selectedPracticeSkill,
    testFilter,
    selectedLevel,
    selectedSource,
    searchQuery,
    hasMounted,
    examSummaries,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, filteredItems.length);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === safePage) return;
    setCurrentPage(page);
    const anchor = document.getElementById('catalog-controls');
    if (anchor) {
      const topOffset = anchor.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: Math.max(0, topOffset), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleExecuteReset = () => {
    if (resetOption === 'listening') {
      clearVstepSkillHistory('listening');
      toast.success('Đã đặt lại tiến độ kỹ năng Nghe (Listening) về 0%!');
    } else if (resetOption === 'reading') {
      clearVstepSkillHistory('reading');
      toast.success('Đã đặt lại tiến độ kỹ năng Đọc (Reading) về 0%!');
    } else if (resetOption === 'exams') {
      clearVstepExamHistory();
      toast.success('Đã xóa toàn bộ lịch sử thi và bảng điểm đề thi!');
    } else if (resetOption === 'all') {
      resetAllVstepHistory();
      toast.success('Đã đặt lại toàn bộ tiến độ câu hỏi và điểm thi VSTEP!');
    }
    refreshHistory();
    setIsResetModalOpen(false);
  };

  const isObjectivePractice =
    selectedPracticeSkill === 'listening' || selectedPracticeSkill === 'reading';
  const currentSkillProgress =
    selectedPracticeSkill === 'listening' ? listeningStats : readingStats;
  const selectedSkillMeta = PRACTICE_SKILL_META[selectedPracticeSkill];

  const getPracticeHref = (item: VstepExamCatalogItem) =>
    item.category === 'writing' || item.category === 'speaking'
      ? `/vstep/exam/${item.id}`
      : `/vstep/exam/${item.id}?filter=${filterMode}`;

  const getPracticeWorkload = (item: VstepExamCatalogItem) =>
    item.category === 'writing' || item.category === 'speaking'
      ? `${item.totalTasks || 0} ${item.category === 'writing' ? 'task' : 'part'}`
      : `${item.totalQuestions || 0} câu hỏi`;

  return {
    activeTab,
    setActiveTab,
    selectedPracticeSkill,
    setSelectedPracticeSkill,
    testFilter,
    setTestFilter,
    selectedSource,
    setSelectedSource,
    selectedLevel,
    setSelectedLevel,
    searchQuery,
    setSearchQuery,
    displayLayout,
    handleLayoutChange,
    filterMode,
    setFilterMode,
    examSummaries,
    hasMounted,
    isResetModalOpen,
    setIsResetModalOpen,
    resetOption,
    setResetOption,
    bankTotals,
    listeningStats,
    readingStats,
    draftSummaries,
    filteredItems,
    counts,
    totalPages,
    safePage,
    paginatedItems,
    handlePageChange,
    handleExecuteReset,
    isObjectivePractice,
    currentSkillProgress,
    selectedSkillMeta,
    getPracticeHref,
    getPracticeWorkload,
  };
}
