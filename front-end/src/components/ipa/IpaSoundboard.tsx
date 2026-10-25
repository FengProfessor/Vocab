'use client';

import React, { useState, useMemo } from 'react';
import type { IpaPhoneme, UserPhonemeProgress } from '@/types/ipa';
import {
  IPA_STAGES,
  getPhonemeById,
  getPhonemesForStage,
  playPhonemeAudio,
  type IpaStage,
  type IpaPair,
} from '@/lib/ipa-client';
import {
  Volume2,
  Sparkles,
  Flame,
  CheckCircle2,
  Compass,
  LayoutGrid,
  Lightbulb,
  ArrowRight,
  Headphones,
  Check,
  Layers,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface IpaSoundboardProps {
  phonemes: IpaPhoneme[];
  userProgress: Record<string, UserPhonemeProgress>;
  onSelectPhoneme: (phoneme: IpaPhoneme) => void;
  initialStageId?: string;
}

type ViewMode = 'pathway' | 'reference';
type FilterCategory = 'all' | 'vn-hardest' | 'monophthongs' | 'diphthongs' | 'consonants';

export function IpaSoundboard({
  phonemes,
  userProgress,
  onSelectPhoneme,
  initialStageId,
}: IpaSoundboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('pathway');
  const [activeStageId, setActiveStageId] = useState<string>(initialStageId || 'stage-must-fix');
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialStageId) {
      setActiveStageId(initialStageId);
    }
  }, [initialStageId]);

  const activeStage = useMemo(() => {
    return IPA_STAGES.find((s) => s.id === activeStageId) || IPA_STAGES[0];
  }, [activeStageId]);

  const activeStagePhonemes = useMemo(() => {
    return getPhonemesForStage(activeStage.id);
  }, [activeStage.id]);

  // Stage progress calculation
  const stageStats = useMemo(() => {
    const total = activeStage.phonemeIds.length;
    const mastered = activeStage.phonemeIds.filter(
      (id) => (userProgress[id]?.masteryPercent ?? 0) >= 80,
    ).length;
    const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return { total, mastered, percent };
  }, [activeStage, userProgress]);

  const filteredReferencePhonemes = useMemo(() => {
    switch (filter) {
      case 'vn-hardest':
        return phonemes.filter((p) => p.difficultyForVn === 'high');
      case 'monophthongs':
        return phonemes.filter((p) => p.type === 'monophthong');
      case 'diphthongs':
        return phonemes.filter((p) => p.type === 'diphthong');
      case 'consonants':
        return phonemes.filter((p) => p.type === 'consonant');
      default:
        return phonemes;
    }
  }, [phonemes, filter]);

  const handleQuickPlay = (e: React.MouseEvent, phoneme: IpaPhoneme) => {
    e.stopPropagation();
    setPlayingId(phoneme.id);
    playPhonemeAudio(phoneme);
    setTimeout(() => setPlayingId(null), 1000);
  };

  // Groups for Reference view
  const monophthongs = useMemo(() => phonemes.filter((p) => p.type === 'monophthong'), [phonemes]);
  const diphthongs = useMemo(() => phonemes.filter((p) => p.type === 'diphthong'), [phonemes]);
  const consonants = useMemo(() => phonemes.filter((p) => p.type === 'consonant'), [phonemes]);

  // Standard Phoneme Card
  const renderPhonemeCard = (p: IpaPhoneme, customSubtitle?: string) => {
    const progress = userProgress[p.id];
    const isMastered = (progress?.masteryPercent ?? 0) >= 80;
    const isHard = p.difficultyForVn === 'high';
    const isPlaying = playingId === p.id;
    const masteryPercent = progress?.masteryPercent ?? 0;

    return (
      <div
        key={p.id}
        onClick={() => onSelectPhoneme(p)}
        className={`group relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer select-none text-center ${
          isMastered
            ? 'bg-emerald-500/5 border-emerald-500/40 hover:border-emerald-500/70 hover:bg-emerald-500/10'
            : isHard
              ? 'bg-card border-amber-400/40 hover:border-amber-500 hover:bg-amber-500/5'
              : 'bg-card border-border/70 hover:border-primary/60 hover:bg-muted/40'
        }`}
      >
        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex items-center">
          {isHard && (
            <span
              className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-800/60"
              title="Âm người Việt hay phát âm sai"
            >
              <Flame className="w-2.5 h-2.5" /> Hay sai
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2 flex items-center">
          {isMastered ? (
            <span title="Đã nắm vững">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => handleQuickPlay(e, p)}
              className={`p-1 rounded-md text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors ${
                isPlaying ? 'text-primary scale-110' : 'opacity-70 group-hover:opacity-100'
              }`}
              title="Nghe phát âm từ mẫu"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Center: IPA Symbol */}
        <div className="pt-2 pb-0.5">
          <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-foreground group-hover:text-primary transition-colors">
            /{p.symbol}/
          </div>
          <p className="text-xs font-semibold text-foreground/80 mt-0.5 flex items-center justify-center gap-1">
            <span>{p.anchorWord}</span>
            <span className="text-[10px] font-mono text-muted-foreground">{p.anchorWordIpa}</span>
          </p>
          {customSubtitle && (
            <span className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5 block">
              {customSubtitle}
            </span>
          )}
        </div>

        {/* Subtle Mastery Progress */}
        {masteryPercent > 0 && !isMastered && (
          <div className="w-8 bg-muted h-1 rounded-full mt-1.5 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full"
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
        )}
      </div>
    );
  };

  // Pair Card for Stages 2 & 3 (Contrast / Symmetric Pairs)
  const renderPairCard = (pair: IpaPair, index: number) => {
    const p1 = getPhonemeById(pair.phoneme1Id);
    const p2 = getPhonemeById(pair.phoneme2Id);
    if (!p1 || !p2) return null;

    const p1Mastered = (userProgress[p1.id]?.masteryPercent ?? 0) >= 80;
    const p2Mastered = (userProgress[p2.id]?.masteryPercent ?? 0) >= 80;

    return (
      <div
        key={`${pair.phoneme1Id}-${pair.phoneme2Id}-${index}`}
        className="rounded-xl border border-border/80 bg-card p-3 sm:p-3.5 hover:border-primary/40 transition-all shadow-xs flex flex-col justify-between gap-2.5"
      >
        {/* Pair Header & Position */}
        <div className="flex items-start justify-between gap-2 border-b pb-2">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-foreground">{pair.title}</span>
              {p1Mastered && p2Mastered && (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Đã nắm
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{pair.mouthPosition}</p>
          </div>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
            Cặp #{index + 1}
          </span>
        </div>

        {/* The 2 Phonemes Side by Side with ↔ */}
        <div className="grid grid-cols-2 gap-2 relative items-center">
          {/* Tile 1 */}
          <div
            onClick={() => onSelectPhoneme(p1)}
            className={`group/tile relative p-2.5 rounded-lg border text-center cursor-pointer transition-all ${
              p1Mastered
                ? 'bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-500'
                : 'bg-muted/30 border-border hover:border-primary hover:bg-muted/60'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span className="font-medium truncate">
                {p1.subType === 'long-vowel'
                  ? 'Âm dài'
                  : p1.subType === 'short-vowel'
                    ? 'Âm ngắn'
                    : p1.subType === 'voiceless-consonant'
                      ? 'Vô thanh'
                      : 'Hữu thanh'}
              </span>
              <button
                type="button"
                onClick={(e) => handleQuickPlay(e, p1)}
                className="hover:text-primary p-0.5"
                title="Nghe phát âm"
              >
                <Volume2 className="w-3 h-3" />
              </button>
            </div>
            <div className="text-xl font-mono font-black text-foreground group-hover/tile:text-primary transition-colors">
              /{p1.symbol}/
            </div>
            <div className="text-xs font-semibold text-foreground/80 mt-0.5">
              {p1.anchorWord}
            </div>
          </div>

          {/* Contrast Divider Badge */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-background border shadow-xs flex items-center justify-center text-[10px] text-muted-foreground z-10 pointer-events-none">
            ↔
          </div>

          {/* Tile 2 */}
          <div
            onClick={() => onSelectPhoneme(p2)}
            className={`group/tile relative p-2.5 rounded-lg border text-center cursor-pointer transition-all ${
              p2Mastered
                ? 'bg-emerald-500/10 border-emerald-500/40 hover:border-emerald-500'
                : 'bg-muted/30 border-border hover:border-primary hover:bg-muted/60'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span className="font-medium truncate">
                {p2.subType === 'long-vowel'
                  ? 'Âm dài'
                  : p2.subType === 'short-vowel'
                    ? 'Âm ngắn'
                    : p2.subType === 'voiceless-consonant'
                      ? 'Vô thanh'
                      : 'Hữu thanh'}
              </span>
              <button
                type="button"
                onClick={(e) => handleQuickPlay(e, p2)}
                className="hover:text-primary p-0.5"
                title="Nghe phát âm"
              >
                <Volume2 className="w-3 h-3" />
              </button>
            </div>
            <div className="text-xl font-mono font-black text-foreground group-hover/tile:text-primary transition-colors">
              /{p2.symbol}/
            </div>
            <div className="text-xs font-semibold text-foreground/80 mt-0.5">
              {p2.anchorWord}
            </div>
          </div>
        </div>

        {/* Mnemonic Tip */}
        {pair.tip && (
          <p className="text-[11px] text-muted-foreground/90 italic bg-muted/20 px-2 py-1 rounded-md">
            💡 {pair.tip}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Controls: Mode Switcher (Pathway vs Reference) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        {/* Left: View Mode Segmented Control */}
        <div className="inline-flex items-center p-1 rounded-xl bg-muted/60 border border-border/60 text-xs self-start">
          <button
            type="button"
            onClick={() => setViewMode('pathway')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === 'pathway'
                ? 'bg-background text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>🧭 Lộ trình 4 Chặng</span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
              Khuyên dùng
            </span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('reference')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
              viewMode === 'reference'
                ? 'bg-background text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>🗂️ Bảng tra cứu 44 âm</span>
          </button>
        </div>

        {/* Right: Quick Stage Indicator */}
        {viewMode === 'pathway' && (
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <span>Tiến độ chặng hiện tại:</span>
            <span className="font-bold text-foreground font-mono">
              {stageStats.mastered}/{stageStats.total}
            </span>
            <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden inline-block">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${stageStats.percent}%` }}
              />
            </div>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
              {stageStats.percent}%
            </span>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODE 1: PEDAGOGICAL 4-STAGE PATHWAY (KHUYÊN DÙNG)        */}
      {/* ========================================================= */}
      {viewMode === 'pathway' && (
        <div className="space-y-4">
          {/* 4 Stage Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {IPA_STAGES.map((s) => {
              const isActive = s.id === activeStageId;
              const sMastered = s.phonemeIds.filter(
                (id) => (userProgress[id]?.masteryPercent ?? 0) >= 80,
              ).length;
              const sPercent = Math.round((sMastered / s.phonemeIds.length) * 100);

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStageId(s.id)}
                  className={`text-left p-3 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isActive
                      ? 'bg-primary/5 border-primary text-foreground shadow-xs'
                      : 'bg-card border-border hover:border-border/80 hover:bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Chặng {s.stageNumber}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {s.badge}
                    </span>
                  </div>
                  <div className="font-bold text-xs text-foreground line-clamp-1">
                    {s.shortTitle}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>
                      {sMastered}/{s.phonemeIds.length} âm
                    </span>
                    <span className="font-mono font-semibold">{sPercent}%</span>
                  </div>
                  {/* Bottom progress bar for each tab */}
                  <div className="w-full bg-muted h-1 rounded-full mt-1 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${sPercent}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Coach Advice & Pedagogical Box for the active stage */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-muted/20 p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-primary text-primary-foreground">
                    Chặng {activeStage.stageNumber}
                  </span>
                  <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                    {activeStage.title}
                  </h2>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">
                Tổng số: <strong className="text-foreground">{activeStage.phonemeIds.length} âm</strong> ·
                Đã thành thạo: <strong className="text-emerald-600">{stageStats.mastered}</strong>
              </span>
            </div>

            {/* Coach Note & Pedagogical Tip */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-background/80 border border-border/60">
                <span className="text-base shrink-0">👩‍🏫</span>
                <div className="space-y-1">
                  <span className="font-bold text-foreground">Lời dặn của giáo viên:</span>
                  <p className="text-muted-foreground leading-relaxed">{activeStage.coachNote}</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-300/40 dark:border-amber-800/40">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-800 dark:text-amber-300">Mẹo thực hành then chốt:</span>
                  <p className="text-amber-900/80 dark:text-amber-300/80 leading-relaxed">
                    {activeStage.pedagogicalTip}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Stage Content Display */}
          {activeStage.id === 'stage-must-fix' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>14 âm cấp bách cần sửa ngay để tránh nói ngọng:</span>
                <span className="text-[11px] italic">Bấm vào từng âm để vào phòng luyện video</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-3">
                {activeStagePhonemes.map((p) => renderPhonemeCard(p))}
              </div>
            </div>
          )}

          {(activeStage.id === 'stage-vowel-pairs' || activeStage.id === 'stage-consonant-pairs') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>
                  {activeStage.id === 'stage-vowel-pairs'
                    ? '6 Cặp nguyên âm đối lập (Âm Dài cơ miệng CĂNG ↔ Âm Ngắn cơ miệng THẢ LỎNG):'
                    : '8 Cặp phụ âm đối xứng (CÙNG 1 KHẨU HÌNH: Vô thanh chỉ xì gió ↔ Hữu thanh rung cổ họng):'}
                </span>
                <span className="text-[11px] italic">Bấm vào từng âm để luyện</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {activeStage.pairs?.map((pair, idx) => renderPairCard(pair, idx))}
              </div>
            </div>
          )}

          {activeStage.id === 'stage-diphthongs-sonorants' && (
            <div className="space-y-5">
              {/* Diphthongs Sub-group */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h3 className="text-xs font-bold flex items-center gap-2 text-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                    8 Nguyên âm đôi (Diphthongs) · Lướt mượt từ âm 1 sang âm 2
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {activeStagePhonemes
                    .filter((p) => p.type === 'diphthong')
                    .map((p) => renderPhonemeCard(p))}
                </div>
              </div>

              {/* Sonorants & Glides Sub-group */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h3 className="text-xs font-bold flex items-center gap-2 text-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    8 Phụ âm mũi & Âm lướt (Sonorants & Glides) · Giúp nối từ và ngữ điệu trôi chảy
                  </h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {activeStagePhonemes
                    .filter((p) => p.type === 'consonant')
                    .map((p) => renderPhonemeCard(p))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: TRADITIONAL 44-PHONEME REFERENCE TABLE           */}
      {/* ========================================================= */}
      {viewMode === 'reference' && (
        <div className="space-y-5">
          {/* Sleek Category Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/40 rounded-xl border border-border/60 w-fit overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Tất cả (44)
            </button>
            <button
              type="button"
              onClick={() => setFilter('vn-hardest')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                filter === 'vn-hardest'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <Flame className="w-3 h-3" /> Hay sai (14)
            </button>
            <button
              type="button"
              onClick={() => setFilter('monophthongs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === 'monophthongs'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Nguyên âm đơn (12)
            </button>
            <button
              type="button"
              onClick={() => setFilter('diphthongs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === 'diphthongs'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Nguyên âm đôi (8)
            </button>
            <button
              type="button"
              onClick={() => setFilter('consonants')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filter === 'consonants'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Phụ âm (24)
            </button>
          </div>

          {filter !== 'all' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {filteredReferencePhonemes.map((p) => renderPhonemeCard(p))}
            </div>
          ) : (
            <div className="space-y-6">
              {/* SECTION 1: MONOPHTHONGS */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
                    Nguyên âm đơn (Monophthongs · 12 âm)
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-medium">Âm dài / ngắn</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {monophthongs.map((p) => renderPhonemeCard(p))}
                </div>
              </div>

              {/* SECTION 2: DIPHTHONGS */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                    Nguyên âm đôi (Diphthongs · 8 âm)
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-medium">Lướt 2 âm</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  {diphthongs.map((p) => renderPhonemeCard(p))}
                </div>
              </div>

              {/* SECTION 3: CONSONANTS */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b pb-1.5">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-foreground">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    Phụ âm (Consonants · 24 âm)
                  </h3>
                  <span className="text-[11px] text-muted-foreground font-medium">Vô thanh ↔ Hữu thanh</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
                  {consonants.map((p) => renderPhonemeCard(p))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
