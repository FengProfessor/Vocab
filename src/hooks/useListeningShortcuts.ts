'use client';

import { useEffect, useRef } from 'react';

export interface ListeningShortcutsOptions {
  onTogglePlay: () => void;
  onPrevSentence: () => void;
  onNextSentence: () => void;
  onToggleLoop: () => void;
  onCycleSpeed: () => void;
  onToggleFocusMode?: () => void;
  isEnabled?: boolean;
}

/**
 * Checks if an event target is an active text input or editable element.
 * When a user is typing in a text field (e.g. cloze fill-in-the-blank or search bar),
 * keyboard shortcuts should be shielded and completely ignored.
 */
export function isInputElement(target: EventTarget | null | unknown): boolean {
  if (!target || typeof target !== 'object') return false;

  const el = target as {
    tagName?: string;
    isContentEditable?: boolean | string;
    closest?: (selector: string) => unknown;
    getAttribute?: (name: string) => string | null;
  };

  const tagName = (el.tagName || '').toUpperCase();
  if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
    return true;
  }

  if (el.isContentEditable === true || el.isContentEditable === 'true') {
    return true;
  }

  if (typeof el.closest === 'function') {
    try {
      if (
        el.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]')
      ) {
        return true;
      }
    } catch {
      // Ignore selector errors in non-standard DOM environments
    }
  }

  return false;
}

export type ShortcutAction =
  | 'toggle_play'
  | 'prev_sentence'
  | 'next_sentence'
  | 'toggle_loop'
  | 'cycle_speed'
  | 'exit_focus_mode'
  | null;

/**
 * Pure helper to map a KeyboardEvent to a listening action,
 * verifying that no modifier keys (Ctrl, Meta, Alt) are held.
 */
export function getShortcutActionFromEvent(e: {
  code?: string;
  key?: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  target?: unknown;
}): ShortcutAction {
  // Never intercept when typing into an input field or content-editable area
  if (isInputElement(e.target)) {
    return null;
  }

  // Never intercept hotkeys when Ctrl / Cmd / Alt is pressed (e.g. Ctrl+S save, Alt+Left back)
  if (e.ctrlKey || e.metaKey || e.altKey) {
    return null;
  }

  const code = e.code || '';
  const key = e.key || '';

  // 1. Space: Play / Pause toggle
  if (code === 'Space' || key === ' ') {
    return 'toggle_play';
  }

  // 2. ArrowLeft: Jump to previous sentence cue
  if (code === 'ArrowLeft' || key === 'ArrowLeft') {
    return 'prev_sentence';
  }

  // 3. ArrowRight: Jump to next sentence cue
  if (code === 'ArrowRight' || key === 'ArrowRight') {
    return 'next_sentence';
  }

  // 4. L / l: Toggle A-B sentence loop
  if (code === 'KeyL' || key === 'l' || key === 'L') {
    return 'toggle_loop';
  }

  // 5. S / s: Cycle playback speed (0.75x -> 1.0x -> 1.25x -> 0.75x)
  if (code === 'KeyS' || key === 's' || key === 'S') {
    return 'cycle_speed';
  }

  // 6. Escape: Exit Focus Mode if active
  if (code === 'Escape' || key === 'Escape' || key === 'Esc') {
    return 'exit_focus_mode';
  }

  return null;
}

/**
 * Custom React Hook for Listening Player Keyboard Shortcuts:
 * - Space: Play / Pause toggle (prevents default scroll)
 * - ArrowLeft: Jump to previous sentence cue
 * - ArrowRight: Jump to next sentence cue
 * - L / l: Toggle A-B sentence loop mode
 * - S / s: Cycle playback speed (0.75x -> 1.0x -> 1.25x -> 0.75x)
 * - Escape: Exit Focus Mode if active
 *
 * Includes strict input shielding so typing in cloze input fields or search bars
 * does NOT trigger playback actions.
 */
export function useListeningShortcuts({
  onTogglePlay,
  onPrevSentence,
  onNextSentence,
  onToggleLoop,
  onCycleSpeed,
  onToggleFocusMode,
  isEnabled = true,
}: ListeningShortcutsOptions): void {
  // Use latest ref pattern to avoid re-binding window listener on callback changes
  const callbacksRef = useRef({
    onTogglePlay,
    onPrevSentence,
    onNextSentence,
    onToggleLoop,
    onCycleSpeed,
    onToggleFocusMode,
  });

  useEffect(() => {
    callbacksRef.current = {
      onTogglePlay,
      onPrevSentence,
      onNextSentence,
      onToggleLoop,
      onCycleSpeed,
      onToggleFocusMode,
    };
  }, [
    onTogglePlay,
    onPrevSentence,
    onNextSentence,
    onToggleLoop,
    onCycleSpeed,
    onToggleFocusMode,
  ]);

  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return;

    function handleKeyDown(e: KeyboardEvent) {
      const action = getShortcutActionFromEvent(e);
      if (!action) return;

      switch (action) {
        case 'toggle_play':
          e.preventDefault();
          callbacksRef.current.onTogglePlay();
          break;
        case 'prev_sentence':
          e.preventDefault();
          callbacksRef.current.onPrevSentence();
          break;
        case 'next_sentence':
          e.preventDefault();
          callbacksRef.current.onNextSentence();
          break;
        case 'toggle_loop':
          e.preventDefault();
          callbacksRef.current.onToggleLoop();
          break;
        case 'cycle_speed':
          e.preventDefault();
          callbacksRef.current.onCycleSpeed();
          break;
        case 'exit_focus_mode':
          if (callbacksRef.current.onToggleFocusMode) {
            e.preventDefault();
            callbacksRef.current.onToggleFocusMode();
          }
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEnabled]);
}
