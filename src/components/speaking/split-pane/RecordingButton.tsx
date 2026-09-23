'use client';

/**
 * RecordingButton Component
 * File: src/components/speaking/split-pane/RecordingButton.tsx
 *
 * Technical Minimalist Multi-State Voice Recording Trigger:
 * - 6 discrete states: 'idle', 'preparing', 'recording', 'processing', 'disabled', 'error'.
 * - Concentric ripple/pulse animation using Tailwind (animate-ping, animate-pulse)
 *   dynamically scaled by live audioLevel (0.0 to 1.0).
 * - Fully accessible: ARIA role="button", aria-label, aria-pressed, aria-disabled.
 * - Mobile-first touch target >= 44px (default 64x64px, sm: 48x48px, lg: 80x80px).
 * - Clean ergonomic integration with STT services and audio recorders.
 */

import React, { useMemo } from 'react';
import { Mic, MicOff, Square, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RecordingButtonState } from '@/types/speaking-module';

export type { RecordingButtonState };

export interface RecordingButtonProps {
  /** True when active audio recording is underway */
  isRecording?: boolean;
  /** True when audio is processing or uploading */
  isProcessing?: boolean;
  /** Disables button interaction */
  disabled?: boolean;
  /** Error flag or error descriptor */
  hasError?: boolean;
  /** Direct state override */
  state?: RecordingButtonState;
  /** Granular status descriptor from STT or recorder */
  status?: RecordingButtonState | string;
  /** Click handler to start recording */
  onStartRecording?: () => void | Promise<void>;
  /** Click handler to stop recording */
  onStopRecording?: () => void | Promise<void>;
  /** General click handler fallback (toggles start/stop) */
  onClick?: () => void | Promise<void>;
  /** Real-time microphone audio volume level (0.0 to 1.0) */
  audioLevel?: number;
  /** Optional custom text status label displayed below button */
  statusLabel?: string;
  /** Button sizing variant */
  size?: 'sm' | 'default' | 'lg';
  /** Additional container CSS class */
  className?: string;
}

/**
 * Deterministically derives the current discrete button state from props.
 * Follows strict priority order:
 * disabled > error > preparing > processing > recording > idle
 */
export function deriveRecordingButtonState(props: {
  isRecording?: boolean;
  isProcessing?: boolean;
  disabled?: boolean;
  hasError?: boolean;
  status?: RecordingButtonState | string;
  state?: RecordingButtonState;
}): RecordingButtonState {
  if (props.state) return props.state;
  if (props.disabled || props.status === 'disabled') return 'disabled';
  if (props.hasError || props.status === 'error') return 'error';
  if (props.status === 'preparing') return 'preparing';
  if (props.isProcessing || props.status === 'processing') return 'processing';
  if (props.isRecording || props.status === 'recording') return 'recording';
  return 'idle';
}

export const RecordingButton: React.FC<RecordingButtonProps> = ({
  isRecording = false,
  isProcessing = false,
  disabled = false,
  hasError = false,
  state: explicitState,
  status,
  onStartRecording,
  onStopRecording,
  onClick,
  audioLevel = 0,
  statusLabel,
  size = 'default',
  className = '',
}) => {
  // Derive effective discrete state
  const effectiveState = useMemo(
    () =>
      deriveRecordingButtonState({
        isRecording,
        isProcessing,
        disabled,
        hasError,
        status,
        state: explicitState,
      }),
    [isRecording, isProcessing, disabled, hasError, status, explicitState]
  );

  const isStateRecording = effectiveState === 'recording';
  const isStatePreparing = effectiveState === 'preparing';
  const isStateProcessing = effectiveState === 'processing';
  const isStateError = effectiveState === 'error';
  const isStateDisabled = effectiveState === 'disabled';

  const isDisabled =
    isStateDisabled || isStatePreparing || isStateProcessing;

  // Clamp audioLevel safely within [0.0, 1.0]
  const clampedLevel = Math.max(0, Math.min(1, isNaN(audioLevel) ? 0 : audioLevel));

  // Dynamic scale factor for volume visualizer
  const rippleScale = isStateRecording ? 1 + clampedLevel * 0.35 : 1;

  // Touch dimensions (all >= 44px min touch target)
  const sizeClasses = {
    sm: 'size-12 min-w-[48px] min-h-[48px]',
    default: 'size-16 min-w-[64px] min-h-[64px]',
    lg: 'size-20 min-w-[80px] min-h-[80px]',
  }[size];

  const iconSizes = {
    sm: 'size-5',
    default: 'size-7',
    lg: 'size-9',
  }[size];

  // Primary click handler routing
  const handleClick = async () => {
    if (isDisabled) return;

    if (isStateRecording) {
      if (onStopRecording) {
        await onStopRecording();
      } else if (onClick) {
        await onClick();
      }
    } else {
      if (onStartRecording) {
        await onStartRecording();
      } else if (onClick) {
        await onClick();
      }
    }
  };

  // Accessible ARIA labels and texts
  const ariaLabel = isStateRecording
    ? 'Dừng thu âm (Stop recording)'
    : isStateProcessing
    ? 'Đang nhận diện giọng nói (Processing speech)...'
    : isStatePreparing
    ? 'Đang chuẩn bị micro (Preparing microphone)...'
    : isStateError
    ? 'Lỗi micro — Bấm để thử lại (Microphone error, click to retry)'
    : isStateDisabled
    ? 'Micro đang bị khóa (Recording disabled)'
    : 'Bắt đầu thu âm (Start recording)';

  const defaultStatusLabel = isStateRecording
    ? 'Đang thu âm... Nhấn để dừng'
    : isStatePreparing
    ? 'Đang mở micro...'
    : isStateProcessing
    ? 'Đang chuyển âm thanh thành chữ...'
    : isStateError
    ? 'Lỗi micro — Thử lại'
    : isStateDisabled
    ? 'Tạm khóa thu âm'
    : 'Nhấn Micro và bắt đầu nói';

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-2.5 select-none',
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* 1. Animated Concentric Ripple Rings during active recording */}
        {isStateRecording && (
          <>
            {/* Outer high-frequency ping ring */}
            <span
              className="absolute size-28 rounded-full bg-destructive/15 animate-ping pointer-events-none"
              aria-hidden="true"
            />
            {/* Mid pulse ring */}
            <span
              className="absolute size-24 rounded-full bg-destructive/25 animate-pulse pointer-events-none"
              aria-hidden="true"
            />
            {/* Dynamic volume level responder ring */}
            <span
              className="absolute size-20 rounded-full bg-destructive/35 pointer-events-none transition-transform duration-75 ease-out"
              style={{ transform: `scale(${rippleScale})` }}
              aria-hidden="true"
            />
          </>
        )}

        {/* 2. Preparing / Connecting Glow */}
        {isStatePreparing && (
          <span
            className="absolute size-20 rounded-full bg-amber-500/25 animate-pulse pointer-events-none"
            aria-hidden="true"
          />
        )}

        {/* 3. Core Accessible Button Element */}
        <button
          type="button"
          role="button"
          onClick={handleClick}
          disabled={isDisabled}
          aria-label={ariaLabel}
          aria-pressed={isStateRecording}
          aria-disabled={isDisabled}
          className={cn(
            'relative z-10 flex items-center justify-center rounded-full transition-all duration-200 outline-none',
            'cursor-pointer touch-manipulation focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2',
            'active:scale-95 shadow-md',
            sizeClasses,
            // Recording State: Destructive Red with shadow
            isStateRecording &&
              'bg-destructive text-white hover:bg-destructive/90 shadow-destructive/40 shadow-lg',
            // Idle State: Primary Indigo
            !isStateRecording &&
              !isStateError &&
              !isStatePreparing &&
              !isStateProcessing &&
              'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/30 hover:scale-105',
            // Error State
            isStateError &&
              'bg-destructive/15 text-destructive border-2 border-destructive hover:bg-destructive/25',
            // Preparing / Processing State
            (isStatePreparing || isStateProcessing) &&
              'bg-muted text-muted-foreground border border-border cursor-wait',
            // Disabled State
            isStateDisabled &&
              'opacity-40 cursor-not-allowed bg-muted text-muted-foreground shadow-none'
          )}
        >
          {isStateRecording ? (
            <Square className={cn(iconSizes, 'fill-current text-white')} />
          ) : isStatePreparing || isStateProcessing ? (
            <Loader2 className={cn(iconSizes, 'animate-spin text-primary')} />
          ) : isStateError ? (
            <AlertCircle className={cn(iconSizes, 'text-destructive')} />
          ) : isStateDisabled ? (
            <MicOff className={cn(iconSizes, 'text-muted-foreground')} />
          ) : (
            <Mic className={cn(iconSizes, 'text-white')} />
          )}
        </button>
      </div>

      {/* 4. Live Politeness Region for Status Announcement */}
      <span
        aria-live="polite"
        className={cn(
          'text-xs font-mono font-medium text-center transition-colors max-w-[260px]',
          isStateRecording && 'text-destructive font-semibold',
          isStateError && 'text-destructive font-semibold',
          !isStateRecording && !isStateError && 'text-muted-foreground'
        )}
      >
        {statusLabel || defaultStatusLabel}
      </span>
    </div>
  );
};

export default RecordingButton;
