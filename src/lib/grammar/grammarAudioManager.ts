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

      audio.onended = () => {
        this.currentAudio = null;
        this.activeId = null;
        this.notify();
      };

      audio.onerror = () => {
        // Fallback gracefully to Web Speech
        this.currentAudio = null;
        this.fallbackSpeak(text);
      };

      audio.play().catch(() => {
        this.fallbackSpeak(text);
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

    utterance.onend = () => {
      this.currentUtterance = null;
      this.activeId = null;
      this.notify();
    };

    utterance.onerror = () => {
      this.currentUtterance = null;
      this.activeId = null;
      this.notify();
    };

    window.speechSynthesis.speak(utterance);
  }
}

export const grammarAudio = GrammarAudioManager.getInstance();
