'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Gift, ArrowRight, Flame } from 'lucide-react';

interface StickyMobileCtaProps {
  onOpenLeadModal: () => void;
}

export function StickyMobileCta({ onOpenLeadModal }: StickyMobileCtaProps) {
  const scrollToPricing = () => {
    const element = document.getElementById('pricing');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-slate-950/95 backdrop-blur-lg border-t border-slate-800/80 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-2xl">
      <div className="flex items-center justify-between gap-2.5">
        {/* Value hint */}
        <div className="flex flex-col min-w-0 pr-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            <Flame className="w-3 h-3 fill-amber-400" />
            <span>Hoàn tiền 100%</span>
          </div>
          <span className="text-xs font-black text-white truncate">
            Chỉ từ 300k • Tặng Pro
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={onOpenLeadModal}
            variant="outline"
            size="sm"
            className="border-amber-500/40 bg-amber-500/10 text-amber-300 font-bold text-xs h-10 px-3 rounded-xl active:scale-95"
          >
            <Gift className="w-3.5 h-3.5 mr-1 text-amber-400" />
            Quà 0đ
          </Button>

          <Button
            onClick={scrollToPricing}
            size="sm"
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-orange-500 hover:to-orange-700 text-white font-black text-xs h-10 px-4 rounded-xl shadow-md uppercase tracking-wider active:scale-95"
          >
            Đăng ký <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
