'use client';

import React, { useState } from 'react';
import {
  DIMENSIONS_15,
  type DimensionItem,
} from '@/data/sat-thu-toeic-listening-data';
import {
  Layers,
  Zap,
  ShieldAlert,
  FileCheck2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function KillerMatrixSection() {
  const [activeBlock, setActiveBlock] = useState<1 | 2 | 3>(1);
  const [selectedDimensionId, setSelectedDimensionId] = useState<number>(1);

  const blockDimensions = DIMENSIONS_15.filter((d) => d.block === activeBlock);
  const selectedDimension =
    DIMENSIONS_15.find((d) => d.id === selectedDimensionId) || blockDimensions[0];

  const handleSwitchBlock = (blockId: 1 | 2 | 3) => {
    setActiveBlock(blockId);
    const firstDim = DIMENSIONS_15.find((d) => d.block === blockId);
    if (firstDim) setSelectedDimensionId(firstDim.id);
  };

  return (
    <div className="w-full space-y-6 text-slate-900">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold uppercase tracking-wider shadow-xs">
          <Layers className="w-3.5 h-3.5 text-indigo-600" />
          Vũ Khí Khảo Thí Độc Quyền
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Ma Trận 15 Bẫy Nghe Sát Thủ
        </h2>
        <p className="text-xs sm:text-sm text-slate-600">
          Giải mã toàn bộ các bẫy nghe và chiêu lừa tâm lý được cài cắm trong 2,000 câu hỏi ETS 2024 &amp; ETS 2026.
        </p>
      </div>

      {/* Block Selector */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-100 border border-slate-200 gap-1 overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => handleSwitchBlock(1)}
            className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeBlock === 1
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Khối 1: Part 1</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/20 font-mono">
              6 Câu
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchBlock(2)}
            className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeBlock === 2
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Khối 2: Part 2</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/20 font-mono">
              25 Câu
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchBlock(3)}
            className={`px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeBlock === 3
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Khối 3: Part 3 &amp; 4</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/20 font-mono">
              69 Câu
            </span>
          </button>
        </div>
      </div>

      {/* Split-Pane Matrix Layout: Dimensions Nav on Left, Deep Dive on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Navigation: List of 5 dimensions in this block */}
        <div className="lg:col-span-5 space-y-2">
          {blockDimensions.map((dim: DimensionItem) => {
            const isSelected = selectedDimension.id === dim.id;
            return (
              <div
                key={dim.id}
                onClick={() => setSelectedDimensionId(dim.id)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition cursor-pointer select-none ${
                  isSelected
                    ? 'bg-white border-indigo-600 shadow-md shadow-indigo-100/60 ring-1 ring-indigo-500/20 text-slate-900'
                    : 'bg-white/80 border-slate-200/90 hover:border-slate-300 hover:bg-white text-slate-700 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                      0{dim.id}
                    </span>
                    <span className="font-bold text-xs sm:text-sm text-slate-900">
                      {dim.nameVi}
                    </span>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isSelected ? 'translate-x-1 text-indigo-600' : ''
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px]">
                  <span className="text-slate-500 font-mono truncate max-w-[200px]">
                    {dim.codeName}
                  </span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1 flex-shrink-0">
                    <TrendingUp className="w-3 h-3" />
                    {dim.etsShift.split('(')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Pane: Deep Dive Inspector Card */}
        <div className="lg:col-span-7 rounded-3xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xl shadow-slate-100/80 space-y-5 text-slate-900">
          {/* Header */}
          <div className="border-b border-slate-100 pb-4 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono text-xs font-bold">
                BẪY {selectedDimension.id} / 15
              </span>
              <span className="text-xs text-emerald-800 font-mono font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {selectedDimension.etsShift}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900">
              {selectedDimension.nameVi}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Tên gọi thực chiến: {selectedDimension.codeName}
            </p>
          </div>

          {/* Trap Analysis */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              Bản chất bẫy lừa của ETS:
            </h4>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              {selectedDimension.trapDetail}
            </p>
          </div>

          {/* Exam Proof */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-sky-600" />
              Dẫn chứng thực nghiệm từ đề thi thật:
            </h4>
            <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 text-xs sm:text-sm font-mono leading-relaxed">
              {selectedDimension.examProof}
            </div>
          </div>

          {/* 3-Second Reflex Formula */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-white border border-indigo-200 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800">
              <Zap className="w-4 h-4 text-amber-600" />
              Công Thức Phản Xạ 3 Giây LingoPro:
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-900">
              {selectedDimension.reflexRule}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
