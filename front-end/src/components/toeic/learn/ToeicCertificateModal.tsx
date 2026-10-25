'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Award,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  Edit2,
  Check,
} from 'lucide-react';

export interface ToeicCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultLearnerName?: string;
  completionDate?: string;
  totalLessonsCompleted?: number;
  totalCheckpointsPassed?: number;
}

export function ToeicCertificateModal({
  isOpen,
  onClose,
  defaultLearnerName = 'Học Viên LingoPro',
  completionDate,
  totalLessonsCompleted = 16,
  totalCheckpointsPassed = 61,
}: ToeicCertificateModalProps) {
  const [learnerName, setLearnerName] = useState<string>(defaultLearnerName);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [certCode, setCertCode] = useState<string>('LP-TOEIC-2026-88F9');

  useEffect(() => {
    // Generate or hydrate persistent certificate code
    try {
      const savedCode = localStorage.getItem('lingo_toeic_cert_code');
      if (savedCode) {
        setCertCode(savedCode);
      } else {
        const rand = Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase();
        const code = `LP-TOEIC-2026-${rand}`;
        setCertCode(code);
        localStorage.setItem('lingo_toeic_cert_code', code);
      }

      const savedName = localStorage.getItem('lingo_toeic_cert_name');
      if (savedName) {
        setLearnerName(savedName);
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleSaveName = () => {
    setIsEditingName(false);
    try {
      localStorage.setItem('lingo_toeic_cert_name', learnerName);
    } catch {
      // Ignore
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (!isOpen) return null;

  const displayDate =
    completionDate ||
    new Date().toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-sm border-2 border-slate-900 dark:border-slate-700 shadow-2xl overflow-hidden my-8">
        {/* Top Control Bar (Hidden on print) */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/80 print:hidden">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
            <Award className="h-4 w-4 text-amber-600" />
            <span>CHỨNG NHẬN TỐT NGHIỆP CHUYÊN KHÓA TOEIC 2026</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition cursor-pointer shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>In Chứng Chỉ / Lưu PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xs hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
              title="Đóng"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── PRINTABLE CERTIFICATE CANVAS ── */}
        <div className="p-6 sm:p-12 bg-white text-slate-900 font-sans print:p-8 relative">
          {/* Ornamental Inner Double Border */}
          <div className="border-4 border-double border-slate-900 p-6 sm:p-10 relative">
            {/* Corner Decorative Badges */}
            <div className="absolute top-2 left-2 font-mono text-[10px] text-slate-400 select-none">
              LINGOPRO · ETS STANDARD
            </div>
            <div className="absolute top-2 right-2 font-mono text-[10px] text-slate-400 select-none">
              VERIFIED CERTIFICATE
            </div>
            <div className="absolute bottom-2 left-2 font-mono text-[10px] text-slate-400 select-none">
              AUTHENTIC ASSESSMENT
            </div>
            <div className="absolute bottom-2 right-2 font-mono text-[10px] text-slate-400 select-none">
              ID: {certCode}
            </div>

            {/* Certificate Header */}
            <div className="text-center space-y-2 max-w-2xl mx-auto pt-2">
              <div className="inline-flex items-center justify-center gap-2 font-mono text-xs tracking-widest uppercase font-bold text-amber-700 pb-1 border-b border-amber-300">
                <ShieldCheck className="h-4 w-4 text-amber-600" />
                <span>HỆ THỐNG KHẢO THÍ & ĐÀO TẠO TIẾNG ANH LINGOPRO</span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-slate-900 uppercase pt-2">
                Chứng Nhận Hoàn Thành
              </h1>
              <p className="font-mono text-xs sm:text-sm text-slate-500 uppercase tracking-widest">
                Certificate of Competence & Tactics Mastery
              </p>
            </div>

            {/* Cert Body */}
            <div className="text-center my-8 sm:my-10 space-y-4 max-w-2xl mx-auto">
              <p className="font-serif italic text-sm text-slate-600">
                Chứng nhận này được trang trọng trao tặng cho:
              </p>

              {/* Student Name with in-place edit */}
              <div className="relative inline-block group">
                {isEditingName ? (
                  <div className="flex items-center gap-2 justify-center">
                    <input
                      type="text"
                      value={learnerName}
                      onChange={(e) => setLearnerName(e.target.value)}
                      className="border-b-2 border-amber-500 px-3 py-1 font-serif text-2xl sm:text-3xl font-bold text-center text-slate-950 focus:outline-hidden"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      className="p-1 rounded-xs bg-emerald-600 text-white hover:bg-emerald-500 print:hidden cursor-pointer"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="font-serif text-2xl sm:text-4xl font-bold text-slate-950 tracking-wide border-b-2 border-slate-400 pb-1 px-4">
                      {learnerName}
                    </h2>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(true)}
                      className="p-1 text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition print:hidden cursor-pointer"
                      title="Sửa tên học viên trên chứng chỉ"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-xl mx-auto pt-2">
                Đã xuất sắc hoàn thành toàn bộ chuyên khóa đào tạo trực tuyến:
              </p>

              {/* Course Title Badge */}
              <div className="p-3.5 rounded-xs bg-slate-50 border border-slate-300 max-w-xl mx-auto space-y-1">
                <h3 className="font-mono text-sm sm:text-base font-bold text-slate-900 uppercase">
                  Chuyên Khảo Chiến Thuật & Toàn Diện TOEIC 450–850+
                </h3>
                <p className="font-mono text-xs text-slate-600">
                  (Format ETS 2026 · Ngữ Pháp Part 5-6 · Phản Xạ Part 1-4 · Quản Trị Đọc Hiểu Part 7)
                </p>
              </div>

              {/* Course Metrics */}
              <div className="flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-slate-600 pt-2">
                <div>
                  <strong className="text-slate-900 font-bold">{totalLessonsCompleted}/16</strong> Chuyên Đề
                </div>
                <span>•</span>
                <div>
                  <strong className="text-slate-900 font-bold">{totalCheckpointsPassed}/61</strong> Checkpoints Đạt
                </div>
                <span>•</span>
                <div>
                  Tiêu Chuẩn: <strong className="text-emerald-700 font-bold">ETS Authentic</strong>
                </div>
              </div>
            </div>

            {/* Certificate Footer: Signatures & Gold Seal */}
            <div className="mt-12 pt-6 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Left Signature */}
              <div className="text-center space-y-1 sm:text-left">
                <div className="font-mono text-[11px] text-slate-500 uppercase">Ngày cấp chứng nhận:</div>
                <div className="font-mono text-xs font-bold text-slate-800 flex items-center gap-1.5 justify-center sm:justify-start">
                  <Calendar className="h-3.5 w-3.5 text-slate-500" />
                  <span>{displayDate}</span>
                </div>
              </div>

              {/* Center: Gold Seal Stamp */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full border-2 border-amber-600 bg-amber-50 flex flex-col items-center justify-center text-amber-800 shadow-xs">
                  <Award className="h-7 w-7 text-amber-600" />
                  <span className="font-mono text-[8px] uppercase tracking-tighter font-bold">VERIFIED</span>
                </div>
              </div>

              {/* Right Signature */}
              <div className="text-center space-y-1 sm:text-right">
                <div className="font-serif italic text-base text-slate-800 font-bold">
                  Hội Đồng Học Thuật LingoPro
                </div>
                <div className="font-mono text-[10px] text-slate-500 uppercase">
                  Academic Director & Chief Examiner
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
