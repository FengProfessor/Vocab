'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  Search,
  Volume2,
  Bookmark,
  Check,
  Sparkles,
  MessageSquare,
  Briefcase,
  Plane,
  Utensils,
  GraduationCap,
  Layers,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { speak } from '@/lib/study';
import { toast } from 'sonner';
import { authFetch } from '@/lib/auth-fetch';
import { isWordSavedLocally, saveWordLocally } from '@/lib/exam-dict-cache';
import { notifyWordSavedOptimistic, notifyWordSaveRollback } from '@/lib/word-summary-cache';
import {
  CONVERSATION_CATEGORIES,
  CONVERSATION_ITEMS,
  type ConversationItem,
} from '@/data/conversations/conversations-data';
import { ConversationQuizModal } from '@/components/dictionary/ConversationQuizModal';

interface PhrasebookViewProps {
  onLookupWord?: (word: string) => void;
}

export function PhrasebookView({ onLookupWord }: PhrasebookViewProps = {}) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(false);
  const [savedMap, setSavedMap] = useState<Record<string, boolean>>(() => {
    if (typeof window === 'undefined') return {};
    const map: Record<string, boolean> = {};
    for (const item of CONVERSATION_ITEMS) {
      if (isWordSavedLocally(item.english)) {
        map[item.id] = true;
      }
    }
    return map;
  });

  const filteredItems = useMemo(() => {
    let list = CONVERSATION_ITEMS;
    if (selectedCategory !== 'all') {
      list = list.filter((i) => i.category === selectedCategory);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.english.toLowerCase().includes(q) ||
          i.vietnamese.toLowerCase().includes(q) ||
          i.situation.toLowerCase().includes(q) ||
          i.keyPhrases.some((k) => k.phrase.toLowerCase().includes(q) || k.meaning.toLowerCase().includes(q))
      );
    }
    return list;
  }, [selectedCategory, searchQuery]);

  const handlePlayAudio = (id: string, text: string) => {
    setPlayingId(id);
    speak(text);
    setTimeout(() => {
      setPlayingId((curr) => (curr === id ? null : curr));
    }, 2500);
  };

  const handleSaveItem = useCallback(async (item: ConversationItem) => {
    const key = item.id;
    const isSaved = savedMap[key];

    if (isSaved) {
      toast.info('Câu này đã có trong sổ từ của bạn');
      return;
    }

    // Optimistic save
    setSavedMap((prev) => ({ ...prev, [key]: true }));
    saveWordLocally(item.english);
    notifyWordSavedOptimistic();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lingo_word_saved', { detail: { word: item.english } }));
    }

    try {
      const res = await authFetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: item.english,
          translation: item.vietnamese,
          example: item.situation,
        }),
      });
      const json = await res.json().catch(() => ({}));

      if (res.status === 429) {
        toast.error('Quá nhiều yêu cầu, vui lòng thử lại sau');
      } else if (json.error === 'FREE_WORD_LIMIT' || (res.status === 403 && json.error === 'FREE_WORD_LIMIT')) {
        setSavedMap((prev) => ({ ...prev, [key]: false }));
        notifyWordSaveRollback();
        const { requestUpsell, upsellFromWordLimitError } = await import('@/lib/upsell');
        requestUpsell(upsellFromWordLimitError(json));
        toast.error(json.message ?? 'Đã đủ hạn mức lưu từ tháng này');
      } else if (json.alreadyExists) {
        toast.info('Câu này đã được lưu trước đó');
      } else if (json.success) {
        toast.success('Đã lưu mẫu câu vào sổ ôn tập!');
      }
    } catch {
      // Giữ local optimistic save
    }
  }, [savedMap]);

  const handleSavePhrase = useCallback(async (phrase: string, meaning: string) => {
    saveWordLocally(phrase);
    notifyWordSavedOptimistic();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('lingo_word_saved', { detail: { word: phrase } }));
    }

    try {
      const res = await authFetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: phrase,
          translation: meaning,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.success) {
        toast.success(`Đã lưu cụm từ "${phrase}"!`);
      } else if (json.alreadyExists) {
        toast.info(`Cụm từ "${phrase}" đã có trong sổ từ`);
      }
    } catch {
      toast.success(`Đã lưu "${phrase}" vào máy`);
    }
  }, []);

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'daily':
        return <MessageSquare className="h-4 w-4" />;
      case 'work':
        return <Briefcase className="h-4 w-4" />;
      case 'travel':
        return <Plane className="h-4 w-4" />;
      case 'dining':
        return <Utensils className="h-4 w-4" />;
      case 'toeic':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Layers className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar & Search input */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Kho Mẫu câu Giao tiếp & Cụm từ Thông dụng
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Các mẫu câu đàm thoại chuẩn ngữ cảnh bản xứ, phân loại theo chủ đề và đính kèm cụm từ trọng điểm
          </p>
        </div>

        {/* Thanh tìm kiếm và nút làm 100 câu test */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo câu, nghĩa hoặc cụm từ..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-muted/60 border border-border/60 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-primary focus:bg-background transition-all"
            />
          </div>

          <Button
            type="button"
            variant="chunky"
            size="sm"
            onClick={() => setIsQuizOpen(true)}
            className="h-8 px-3 rounded-xl text-xs gap-1.5 font-bold shadow-xs whitespace-nowrap shrink-0"
          >
            <Trophy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Luyện 100 câu Test</span>
            <span className="sm:hidden">100 câu</span>
          </Button>
        </div>
      </div>

      {/* Danh mục chủ đề (Category Tabs) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
              : 'bg-card border border-border/70 hover:bg-muted text-muted-foreground'
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>Tất cả ({CONVERSATION_ITEMS.length})</span>
        </button>

        {CONVERSATION_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                : 'bg-card border border-border/70 hover:bg-muted text-muted-foreground'
            }`}
          >
            {getCategoryIcon(cat.id)}
            <span>{cat.name}</span>
            <span className="opacity-70 text-[10px]">({cat.count})</span>
          </button>
        ))}
      </div>

      {/* Danh sách các câu giao tiếp */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border/80 rounded-2xl bg-card/40">
          <p className="text-sm font-medium text-muted-foreground">Không tìm thấy câu giao tiếp nào phù hợp.</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-2 text-xs"
          >
            Đặt lại bộ lọc
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => {
            const isSaved = Boolean(savedMap[item.id]);
            const isPlaying = playingId === item.id;

            return (
              <div
                key={item.id}
                className="group relative flex flex-col justify-between p-4 rounded-2xl border border-border/70 bg-card hover:border-primary/40 hover:shadow-sm transition-all duration-200"
              >
                <div>
                  {/* Category badge & situation tag */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary/90 bg-primary/10 px-2 py-0.5 rounded-md">
                      {getCategoryIcon(item.category)}
                      {item.categoryLabel}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate max-w-[200px]" title={item.situation}>
                      {item.situation}
                    </span>
                  </div>

                  {/* English sentence */}
                  <p className="text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                    {item.english}
                  </p>

                  {/* Phonetic IPA */}
                  {item.ipa && (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5 tracking-tight">
                      {item.ipa}
                    </p>
                  )}

                  {/* Vietnamese translation */}
                  <p className="text-sm text-foreground/85 font-medium mt-1.5 leading-relaxed">
                    {item.vietnamese}
                  </p>
                </div>

                {/* Key Collocations / Phrasal Verbs Section */}
                {item.keyPhrases.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1.5">
                      Cụm từ trọng điểm:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.keyPhrases.map((kp, idx) => (
                        <div
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-muted/70 hover:bg-muted border border-border/60 transition-colors"
                        >
                          <span
                            onClick={() => onLookupWord?.(kp.phrase)}
                            className="font-semibold text-foreground hover:text-primary cursor-pointer"
                            title="Bấm để tra cứu từ điển"
                          >
                            {kp.phrase}
                          </span>
                          <span className="text-muted-foreground text-[11px] font-normal">
                            : {kp.meaning}
                          </span>
                          <button
                            type="button"
                            onClick={() => void handleSavePhrase(kp.phrase, kp.meaning)}
                            className="ml-1 p-0.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                            title="Lưu cụm từ này vào sổ từ"
                          >
                            <Bookmark className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bottom Actions Bar */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-2">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handlePlayAudio(item.id, item.english)}
                      className={`p-1.5 rounded-lg border transition-all ${
                        isPlaying
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                      title="Nghe phát âm chuẩn"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onLookupWord && (
                      <button
                        type="button"
                        onClick={() => onLookupWord(item.english)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Phân tích chi tiết câu này"
                      >
                        <span>Phân tích</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}

                    <Button
                      type="button"
                      size="sm"
                      variant={isSaved ? 'outline' : 'secondary'}
                      onClick={() => void handleSaveItem(item)}
                      className={`h-7 px-2.5 rounded-lg text-xs gap-1 font-medium transition-all ${
                        isSaved
                          ? 'border-emerald-300 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400'
                          : ''
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span>Đã lưu</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="h-3 w-3" />
                          <span>Lưu câu</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Luyện tập 100 câu Trắc nghiệm Cụm từ & Giao tiếp */}
      <ConversationQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        onLookupWord={onLookupWord}
      />
    </div>
  );
}
