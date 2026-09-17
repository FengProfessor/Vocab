'use client';

import React, { useState, useEffect } from 'react';
import { UrgencyCountdown } from './UrgencyCountdown';
import { ChallengeHeader } from './ChallengeHeader';
import { LeadMagnetModal } from './LeadMagnetModal';
import { FloatingSocialProof } from './FloatingSocialProof';
import { StickyMobileCta } from './StickyMobileCta';

interface ChallengeInteractiveWrapperProps {
  children: React.ReactNode;
}

export function ChallengeInteractiveWrapper({ children }: ChallengeInteractiveWrapperProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Exit-intent trigger on desktop
  useEffect(() => {
    let hasTriggeredExit = false;
    const sessionSeen = typeof window !== 'undefined' && sessionStorage.getItem('challenge_lead_seen');
    if (sessionSeen) {
      hasTriggeredExit = true;
    }

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 8 && !hasTriggeredExit && !isModalOpen) {
        hasTriggeredExit = true;
        sessionStorage.setItem('challenge_lead_seen', 'true');
        setIsModalOpen(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isModalOpen]);

  const openLeadModal = () => {
    setIsModalOpen(true);
  };

  const closeLeadModal = () => {
    setIsModalOpen(false);
  };

  return (
    <>
      {/* 1. Urgency Countdown Top Bar */}
      <UrgencyCountdown onOpenLeadModal={openLeadModal} />

      {/* 2. Glassmorphism Sticky Navigation */}
      <ChallengeHeader onOpenLeadModal={openLeadModal} />

      {/* 3. Main Page Content (Passing openLeadModal trigger context or custom events) */}
      <div onClick={(e) => {
        // Intercept any click on elements with data-trigger="lead-modal"
        const target = (e.target as HTMLElement).closest('[data-trigger="lead-modal"]');
        if (target) {
          e.preventDefault();
          openLeadModal();
        }
      }}>
        {children}
      </div>

      {/* 4. Exit-intent / Triggerable Lead Magnet Modal */}
      <LeadMagnetModal isOpen={isModalOpen} onClose={closeLeadModal} />

      {/* 5. Floating Social Proof Toasts */}
      <FloatingSocialProof />

      {/* 6. Sticky Mobile CTA Bar */}
      <StickyMobileCta onOpenLeadModal={openLeadModal} />
    </>
  );
}
