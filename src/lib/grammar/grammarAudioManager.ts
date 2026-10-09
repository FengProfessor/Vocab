// File: src/lib/grammar/grammarAudioManager.ts

type AudioStateListener = (state: { isPlaying: boolean; activeId: string | null }) => void;

class GrammarAudioManager {
  private static instance: GrammarAudioManager;
  private currentAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private activeId: string | null = null;
  private listeners: Set<AudioStateListener> = new Set();

  private constructor() {}

  public static getInstance(): GrammarAudioManager {
    if (!GrammarAudioManager.instance) {
      GrammarAudioManager.instance = new GrammarAudioManager();
    }
    return GrammarAudioManager.instance;
  }

  public subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    listener({ isPlaying: this.isPlaying(), activeId: this.activeId });
    return () => this.listeners.delete(listener);
  }

  private notify() {
    const state = { isPlaying: this.isPlaying(), activeId: this.activeId };
    this.listeners.forEach((l) => l(state));
  }

  public isPlaying(): boolean {
    return this.currentAudio !== null || this.currentUtterance !== null;
  }

  public getActiveId(): string | null {
    return this.activeId;
  }

  public stopAll(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    this.activeId = null;
    this.notify();
  }

  public play(id: string, text: string, audioUrl?: string): void {
    // 1. Immediately abort preceding playback to eliminate concurrency
    this.stopAll();

    this.activeId = id;
    this.notify();

    // 2. Prioritize Native Studio MP3 Asset if available
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      this.currentAudio = audio;
      let fellBack = false;

      const triggerFallback = () => {
        if (fellBack) return;
        fellBack = true;
        if (this.currentAudio === audio) {
          this.currentAudio = null;
        }
        if (this.activeId === id) {
          this.fallbackSpeak(text);
        }
      };

      audio.onended = () => {
        if (this.currentAudio === audio) {
          this.currentAudio = null;
          this.activeId = null;
          this.notify();
        }
      };

      audio.onerror = () => {
        triggerFallback();
      };

      audio.play().catch(() => {
        triggerFallback();
      });
      return;
    }

    // 3. Web Speech Fallback
    this.fallbackSpeak(text);
  }

  private fallbackSpeak(text: string): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.activeId = null;
      this.notify();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    this.currentUtterance = utterance;

    // Ưu tiên chọn giọng tiếng Anh chuẩn (tránh phát âm lỗi trên thiết bị dùng ngôn ngữ mặc định khác như vi-VN)
    try {
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const enVoice =
          voices.find((v) => v.lang === 'en-US') ||
          voices.find((v) => v.lang.startsWith('en-US')) ||
          voices.find((v) => v.lang.startsWith('en'));
        if (enVoice) {
          utterance.voice = enVoice;
        }
      }
    } catch {
      // Bỏ qua nếu môi trường không hỗ trợ getVoices
    }

    utterance.onend = () => {
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
        this.activeId = null;
        this.notify();
      }
    };

    utterance.onerror = () => {
      if (this.currentUtterance === utterance) {
        this.currentUtterance = null;
        this.activeId = null;
        this.notify();
      }
    };

    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      this.currentUtterance = null;
      this.activeId = null;
      this.notify();
    }
  }
}

export const grammarAudio = GrammarAudioManager.getInstance();
