'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useOnboarding } from './OnboardingProvider';
import { Mascot } from '@/components/gamification/Mascot';
import { supabase } from '@/lib/supabase';
import { Check } from 'lucide-react';
import './onboarding.css';

/**
 * Step 6: Khảo sát nguồn giới thiệu.
 * Hiện trước khi sang bước RewardModal nhận quà.
 */
export function SurveyModal() {
  const { isActive, currentStep, next } = useOnboarding();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isActive || currentStep.id !== 'survey') return null;

  const options = [
    { value: 'facebook', label: 'Facebook 🌐' },
    { value: 'tiktok', label: 'TikTok 🎥' },
    { value: 'instagram', label: 'Instagram 📸' },
    { value: 'threads', label: 'Threads 💬' },
    { value: 'referral', label: 'Người quen giới thiệu 👥' },
    { value: 'other', label: 'Nguồn khác 🚀' },
  ];

  const handleSelect = async (source: string) => {
    if (isSubmitting) return;
    setSelectedSource(source);
    setIsSubmitting(true);

    try {
      // 1. Lưu vào localStorage để RewardModal đọc và truyền vào order note
      localStorage.setItem('lingopro_referral_source', source);

      // 2. Lưu vào auth user metadata trên Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.auth.updateUser({
          data: { referral_source: source }
        });
      }
    } catch (err) {
      console.warn('[Onboarding] Failed to save referral source:', err);
    }

    // Delay 400ms để người học thấy trạng thái check rồi chuyển bước
    setTimeout(() => {
      setIsSubmitting(false);
      next();
    }, 450);
  };

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-900/70 p-3 backdrop-blur-sm onboarding-fade-in sm:p-4">
      <div className="relative my-auto w-full max-w-md max-h-[min(640px,calc(100dvh-24px))] overflow-y-auto rounded-[28px] border-b-8 border-indigo-200 bg-white shadow-2xl onboarding-zoom-in">
        {/* Header */}
        <div className="bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 p-6 pb-10 text-center relative">
          <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-white/10" />
          <div className="absolute bottom-2 right-8 w-10 h-10 rounded-full bg-white/10" />

          <div className="relative z-10">
            <div className="onboarding-mascot-bounce inline-block mb-2">
              <Mascot mood="thinking" size="md" />
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              Khảo sát nhỏ 📊
            </h2>
            <p className="text-indigo-100 font-bold mt-1 text-xs">
              Bạn biết đến LingoPro từ nguồn nào thế?
            </p>
          </div>
        </div>

        {/* Body / Options */}
        <div className="p-6 -mt-6 relative bg-white">
          <div className="space-y-2.5">
            {options.map((opt) => {
              const isSelected = selectedSource === opt.value;
              return (
                <button
                  key={opt.value}
                  disabled={isSubmitting}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full h-13 px-5 rounded-2xl border-2 flex items-center justify-between text-sm font-bold transition-all text-slate-700 cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 shadow-sm scale-[0.99]'
                      : 'border-slate-100 bg-slate-50 hover:bg-slate-100/70 hover:border-slate-200'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="h-5 w-5 text-indigo-600 animate-scale-up animate-duration-200" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
