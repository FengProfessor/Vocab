'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trophy, Flame, BookOpen, Swords, Sparkles, 
  Star, Award, Shield, Crown, Zap, Lock, EyeOff, 
  RotateCcw, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BadgeTier {
  id: number;
  nameVi: string;
  nameEn: string;
  maxSubLevels: number;
  color: string;
  glow: string;
  borderClass: string;
  bgGradient: string;
  description: string;
  material: string;
  requiredXpPerLevel: number;
  imageSrc: string;
}

const TIERS: BadgeTier[] = [
  {
    id: 1,
    nameVi: "Đồng (Bronze)",
    nameEn: "Bronze",
    maxSubLevels: 10,
    color: "#cd7f32",
    glow: "rgba(205, 127, 50, 0.5)",
    borderClass: "border-amber-700/60",
    bgGradient: "from-amber-950/40 via-amber-900/20 to-stone-950",
    description: "Khiên đồng mộc mạc cổ kính, đinh tán thau",
    material: "Đồng thau rèn thô & đinh tán sắt",
    requiredXpPerLevel: 100,
    imageSrc: "/badges/tier-showcase-all.jpg"
  },
  {
    id: 2,
    nameVi: "Bạc (Silver)",
    nameEn: "Silver",
    maxSubLevels: 15,
    color: "#c0c0c0",
    glow: "rgba(192, 192, 192, 0.5)",
    borderClass: "border-slate-400/60",
    bgGradient: "from-slate-800/40 via-cyan-950/20 to-slate-950",
    description: "Khiên thép trắng mạ bạc, chạm khắc hoa văn filigree",
    material: "Thép trắng tinh luyện & thạch anh lam",
    requiredXpPerLevel: 250,
    imageSrc: "/badges/tier-showcase-all.jpg"
  },
  {
    id: 3,
    nameVi: "Vàng (Gold)",
    nameEn: "Gold",
    maxSubLevels: 20,
    color: "#ffd700",
    glow: "rgba(255, 215, 0, 0.55)",
    borderClass: "border-yellow-500/60",
    bgGradient: "from-yellow-950/40 via-amber-900/20 to-stone-950",
    description: "Huy hiệu Hoàng gia vàng 24K, nguyệt quế và hồng ngọc",
    material: "Vàng ròng 24K & Hồng ngọc Ruby huyết bồ câu",
    requiredXpPerLevel: 500,
    imageSrc: "/badges/tier-showcase-all.jpg"
  },
  {
    id: 4,
    nameVi: "Bạch Kim (Platinum)",
    nameEn: "Platinum",
    maxSubLevels: 25,
    color: "#00f0ff",
    glow: "rgba(0, 240, 255, 0.55)",
    borderClass: "border-cyan-400/60",
    bgGradient: "from-cyan-950/40 via-blue-950/20 to-slate-950",
    description: "Cánh thiên thần bạch kim sắc bén, lam ngọc sapphire",
    material: "Bạch kim ánh kim & Lam ngọc Thần thánh",
    requiredXpPerLevel: 900,
    imageSrc: "/badges/tier-showcase-all.jpg"
  },
  {
    id: 5,
    nameVi: "Kim Cương (Diamond)",
    nameEn: "Diamond",
    maxSubLevels: 30,
    color: "#c084fc",
    glow: "rgba(192, 132, 252, 0.6)",
    borderClass: "border-purple-400/60",
    bgGradient: "from-purple-950/40 via-fuchsia-950/20 to-slate-950",
    description: "Lăng kính đa giác tán sắc cực quang, vầng sáng rực rỡ",
    material: "Pha lê kim cương đa diện vô cấu",
    requiredXpPerLevel: 1500,
    imageSrc: "/badges/tier-showcase-all.jpg"
  },
  {
    id: 6,
    nameVi: "Lục Bảo Rồng (Emerald Dragon)",
    nameEn: "Emerald Dragon",
    maxSubLevels: 35,
    color: "#10b981",
    glow: "rgba(16, 185, 129, 0.6)",
    borderClass: "border-emerald-500/60",
    bgGradient: "from-emerald-950/40 via-green-950/20 to-slate-950",
    description: "Chiến giáp đầu rồng hộ mệnh, lửa ngọc lục bảo rực cháy",
    material: "Vảy rồng ngọc bích & Ngọn lửa long tộc",
    requiredXpPerLevel: 2500,
    imageSrc: "/badges/tier-elite-showcase.jpg"
  },
  {
    id: 7,
    nameVi: "Tinh Tú (Astral Amethyst)",
    nameEn: "Astral Amethyst",
    maxSubLevels: 40,
    color: "#a855f7",
    glow: "rgba(168, 85, 247, 0.6)",
    borderClass: "border-violet-500/60",
    bgGradient: "from-violet-950/40 via-indigo-950/20 to-slate-950",
    description: "Vòng xoáy thiên hà tím, chòm sao hoàng đạo quay quanh",
    material: "Bụi sao tinh vân & Tinh thể vũ trụ",
    requiredXpPerLevel: 4000,
    imageSrc: "/badges/tier-elite-showcase.jpg"
  },
  {
    id: 8,
    nameVi: "Hỏa Phượng (Mythic Phoenix)",
    nameEn: "Mythic Phoenix",
    maxSubLevels: 45,
    color: "#f97316",
    glow: "rgba(249, 115, 22, 0.65)",
    borderClass: "border-orange-500/60",
    bgGradient: "from-orange-950/40 via-red-950/20 to-stone-950",
    description: "Cánh phượng hoàng lửa bất diệt mạ vàng đỏ thần thánh",
    material: "Lông vũ phượng hoàng lửa & Lửa dung nham",
    requiredXpPerLevel: 6500,
    imageSrc: "/badges/tier-elite-showcase.jpg"
  },
  {
    id: 9,
    nameVi: "Hắc Lôi (Obsidian Titan)",
    nameEn: "Obsidian Titan",
    maxSubLevels: 50,
    color: "#fb923c",
    glow: "rgba(251, 146, 60, 0.65)",
    borderClass: "border-amber-600/60",
    bgGradient: "from-stone-900 via-orange-950/30 to-black",
    description: "Đá núi lửa đen nham thạch, búa sấm sét cuồng nộ",
    material: "Hắc diệu thạch nham thạch & Sấm sét cổ đại",
    requiredXpPerLevel: 10000,
    imageSrc: "/badges/tier-elite-showcase.jpg"
  },
  {
    id: 10,
    nameVi: "Thần Giới (Divine Archangel)",
    nameEn: "Divine Archangel",
    maxSubLevels: 55,
    color: "#ffffff",
    glow: "rgba(255, 255, 255, 0.75)",
    borderClass: "border-yellow-200/80",
    bgGradient: "from-amber-100/10 via-yellow-500/20 to-slate-950",
    description: "Vương miện thánh halo, cánh thiên sứ cực quang lộng lẫy",
    material: "Ánh sáng thần thánh nguyên bản & Cổ tự rune",
    requiredXpPerLevel: 20000,
    imageSrc: "/badges/tier-elite-showcase.jpg"
  },
];

export default function BadgesDemoPage() {
  // Current user progress
  const [currentTierIndex, setCurrentTierIndex] = useState(0); // 0 = Bronze
  const [currentSubLevel, setCurrentSubLevel] = useState(1);   // starts at Bronze 1
  const [currentXp, setCurrentXp] = useState(0);

  // Level Up Celebration Modal State
  const [celebrationData, setCelebrationData] = useState<{
    tier: BadgeTier;
    subLevel: number;
    isMajorTierUp: boolean;
  } | null>(null);

  const currentTier = TIERS[currentTierIndex];
  const requiredXp = currentTier.requiredXpPerLevel * currentSubLevel;
  const progressPercent = Math.min(100, Math.round((currentXp / requiredXp) * 100));

  // Sound effect: Arpeggiated Fanfare
  const playFanfare = (isMajor: boolean) => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const notes = isMajor ? [523.25, 659.25, 783.99, 1046.50, 1318.51] : [523.25, 659.25, 783.99]; // C5, E5, G5, C6, E6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = isMajor ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.09);
        osc.stop(ctx.currentTime + i * 0.09 + 0.45);
      });
    } catch {
      // AudioContext might be restricted until user interaction
    }
  };

  // Trigger celebration
  const triggerCelebration = (tier: BadgeTier, subLvl: number, isMajorTierUp: boolean) => {
    playFanfare(isMajorTierUp);
    confetti({
      particleCount: isMajorTierUp ? 120 : 60,
      spread: isMajorTierUp ? 90 : 60,
      origin: { y: 0.55 },
      colors: [tier.color, '#ffd700', '#ffffff', '#38bdf8'],
    });
    setCelebrationData({
      tier,
      subLevel: subLvl,
      isMajorTierUp,
    });
  };

  // Study action that gives XP
  const handleStudySession = (earnedXp: number = 100) => {
    const newXp = currentXp + earnedXp;

    if (newXp >= requiredXp) {
      // Leveled up!
      const leftoverXp = newXp - requiredXp;
      setCurrentXp(leftoverXp);

      if (currentSubLevel < currentTier.maxSubLevels) {
        // Next sub-level within tier
        const nextSubLevel = currentSubLevel + 1;
        setCurrentSubLevel(nextSubLevel);
        triggerCelebration(currentTier, nextSubLevel, false);
      } else if (currentTierIndex < TIERS.length - 1) {
        // Breakthrough to NEW major tier!
        const nextTierIndex = currentTierIndex + 1;
        const nextTier = TIERS[nextTierIndex];
        setCurrentTierIndex(nextTierIndex);
        setCurrentSubLevel(1);
        triggerCelebration(nextTier, 1, true);
      } else {
        // Max level reached
        triggerCelebration(currentTier, currentSubLevel, true);
      }
    } else {
      setCurrentXp(newXp);
    }
  };

  // Instant Level Up button for testing
  const handleInstantLevelUp = () => {
    handleStudySession(requiredXp - currentXp);
  };

  // Reset to level 1
  const handleReset = () => {
    setCurrentTierIndex(0);
    setCurrentSubLevel(1);
    setCurrentXp(0);
    setCelebrationData(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-yellow-500/30 selection:text-yellow-200 p-4 md:p-8 font-sans relative">
      
      {/* Top Banner */}
      <div className="max-w-4xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-semibold mb-3 tracking-wide uppercase">
          <EyeOff className="w-3.5 h-3.5 text-amber-400" />
          Chế Độ Ẩn Huy Hiệu (Fog of War & Instant Reveal)
        </div>
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
          Hệ Thống Huy Hiệu <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">Bí Ẩn Theo Cấp</span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-xs md:text-sm">
          Toàn bộ huy hiệu đều bị <strong className="text-amber-300">khóa & ẩn giấu</strong>. Chỉ khi bạn tích lũy đủ XP và <strong className="text-white">chính thức đột phá lên cấp</strong>, hiệu ứng hiển thị vinh danh mới xuất hiện một lần duy nhất!
        </p>
      </div>

      {/* Interactive Practice & XP Center */}
      <div className="max-w-4xl mx-auto mb-10 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-md"
              style={{ backgroundColor: currentTier.color, color: '#000000' }}
            >
              {currentTier.id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {currentTier.nameVi} — Tiểu Cấp {currentSubLevel} / {currentTier.maxSubLevels}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold">
                  Đang Kích Hoạt
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {currentTier.description}
              </p>
            </div>
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
            title="Đặt lại về Đồng Cấp 1 để thử nghiệm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset về Cấp 1
          </button>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span>Tiến độ kinh nghiệm (XP)</span>
            <span>
              <strong className="text-amber-300">{currentXp}</strong> / {requiredXp} XP 
              <span className="text-slate-500 ml-1">({progressPercent}%)</span>
            </span>
          </div>
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
            <div 
              className="h-full rounded-full transition-all duration-300 bg-gradient-to-r from-amber-500 to-yellow-400 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Action Buttons to Earn XP & Level Up */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            onClick={() => handleStudySession(50)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            Luyện 5 Từ Vựng (+50 XP)
          </button>

          <button
            onClick={() => handleStudySession(100)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition-all cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            Giữ Streak (+100 XP)
          </button>

          <button
            onClick={handleInstantLevelUp}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black shadow-lg shadow-yellow-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-black" />
            Lên Cấp Ngay (Kích Hoạt Vinh Danh!)
          </button>
        </div>
      </div>

      {/* Grid of 10 Tiers (Fog of War: Hidden / Locked) */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            Hành Trình 10 Cấp Bậc (Chỉ mở khi đạt yêu cầu)
          </h2>
          <span className="text-xs text-slate-500">
            Đã mở: <strong className="text-white">{currentTierIndex + 1}</strong> / 10 Cấp
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {TIERS.map((tier, idx) => {
            const isUnlocked = idx <= currentTierIndex;
            const isCurrent = idx === currentTierIndex;

            return (
              <div
                key={tier.id}
                className={`relative rounded-xl border p-3 flex flex-col items-center text-center transition-all ${
                  isCurrent
                    ? `bg-slate-900 ${tier.borderClass} shadow-lg ring-1 ring-yellow-400/40 scale-[1.02]`
                    : isUnlocked
                    ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                    : 'bg-slate-950/80 border-slate-900 text-slate-600 opacity-60'
                }`}
              >
                {/* Badge Icon or Lock */}
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-2 relative">
                  {isUnlocked ? (
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center border transition-all"
                      style={{
                        borderColor: tier.color,
                        boxShadow: isCurrent ? `0 0 15px ${tier.glow}` : 'none',
                        backgroundColor: 'rgba(15, 23, 42, 0.7)'
                      }}
                    >
                      <Crown className="w-6 h-6" style={{ color: tier.color }} />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-900 border border-slate-800 text-slate-700">
                      <Lock className="w-5 h-5" />
                    </div>
                  )}

                  {isCurrent && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                  )}
                </div>

                {/* Info */}
                <div className="text-xs font-bold mb-0.5 text-white">
                  {isUnlocked ? tier.nameEn : '??? Bí Ẩn'}
                </div>
                <div className="text-[10px] text-slate-400 mb-1">
                  {tier.maxSubLevels} Tiểu cấp
                </div>

                {/* Status chip */}
                {isCurrent ? (
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                    Bậc {currentSubLevel}
                  </span>
                ) : isUnlocked ? (
                  <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5" /> Đã đạt
                  </span>
                ) : (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-slate-600 border border-slate-800">
                    Khóa 🔒
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEVEL UP POPUP / CEREMONY MODAL (Chỉ hiển thị 1 lần duy nhất khi Lên Cấp) */}
      {/* ========================================================================= */}
      {celebrationData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div 
            className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-black border-2 rounded-3xl p-6 md:p-8 text-center shadow-2xl overflow-hidden scale-100 animate-in zoom-in-90 duration-300"
            style={{ 
              borderColor: celebrationData.tier.color,
              boxShadow: `0 0 60px ${celebrationData.tier.glow}` 
            }}
          >
            {/* Ambient sunburst rays behind badge */}
            <div 
              className="absolute inset-0 bg-gradient-to-t from-transparent via-yellow-500/10 to-transparent pointer-events-none animate-pulse" 
            />

            {/* Close button */}
            <button 
              onClick={() => setCelebrationData(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header tag */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs font-black uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              {celebrationData.isMajorTierUp ? '🎉 ĐỘT PHÁ CẤP BẬC MỚI!' : '⭐ THĂNG TIỂU CẤP THÀNH CÔNG!'}
            </div>

            {/* Glowing Badge Spotlight */}
            <div className="relative my-4 flex items-center justify-center">
              <div 
                className="w-32 h-32 rounded-3xl flex items-center justify-center border-4 shadow-2xl relative transition-transform duration-500 hover:rotate-3"
                style={{
                  borderColor: celebrationData.tier.color,
                  boxShadow: `0 0 50px ${celebrationData.tier.glow}`,
                  backgroundColor: 'rgba(15, 23, 42, 0.95)'
                }}
              >
                <Crown className="w-16 h-16" style={{ color: celebrationData.tier.color }} />

                <div className="absolute -bottom-3 px-3 py-1 rounded-full bg-slate-950 border border-slate-700 text-yellow-400 text-xs font-black flex items-center gap-1 shadow-lg">
                  <Star className="w-3.5 h-3.5 fill-yellow-400" />
                  Tiểu Bậc {celebrationData.subLevel}
                </div>
              </div>
            </div>

            {/* Congratulation Texts */}
            <h2 className="text-2xl md:text-3xl font-black text-white mt-4 mb-1 tracking-tight">
              {celebrationData.tier.nameVi}
            </h2>
            <div className="text-xs font-bold text-amber-300 mb-2">
              Đạt Tiểu Cấp {celebrationData.subLevel} / {celebrationData.tier.maxSubLevels}
            </div>
            <p className="text-xs text-slate-300 max-w-xs mx-auto mb-6">
              {celebrationData.tier.description}
            </p>

            {/* Action button */}
            <button
              onClick={() => setCelebrationData(null)}
              className="w-full py-3.5 px-6 rounded-2xl font-black text-sm bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black shadow-xl shadow-yellow-500/25 active:scale-95 transition-all cursor-pointer"
            >
              Thu Nhận & Tiếp Tục Học
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
