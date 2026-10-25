/**
 * Pronunciation Module Type Definitions
 * Supporting Rachel's English Video Integration for IPA Pronunciation (Milestones M1–M4)
 */

export interface RachelVideoMeta {
  /** 11-character YouTube video ID (e.g. "33F2e7o1q_g") */
  youtubeVideoId: string;
  /** Start time in seconds for mouth/tongue/vocal tract demonstration */
  startSeconds: number;
  /** End time in seconds marking the end of demonstration clip */
  endSeconds: number;
  /** Canonical channel branding ensuring instructor consistency */
  channelName: "Rachel's English";
  /** Concise pedagogical tip extracted from Rachel's instruction */
  videoTip: string;
  /** Optional human-readable clip title */
  clipTitle?: string;
  /** Optional fallback / backward-compat alias */
  mouthTipSummary?: string;
}

export interface MinimalPairItem {
  a: string;
  b: string;
  note?: string;
}

export interface PronunciationLesson {
  id: string;
  level: string;
  title: string;
  ipa: string;
  whyHard: string;
  mouthTip: string;
  exampleWords: string[];
  drillType: 'minimal-pair' | 'stress' | 'intonation' | 'listening';
  minimalPairs: { a: string; b: string; note: string }[];

  // ── Rachel's English Video Integration ──
  /** Structured video metadata object */
  video?: RachelVideoMeta;

  // ── Flat Convenience Properties (Dual-compatible) ──
  youtubeVideoId?: string;
  startSeconds?: number;
  endSeconds?: number;
  channelName?: "Rachel's English" | string;
  videoTip?: string;
}

export interface PhoneticArticulationProps {
  ipa: string;
  mouthTip: string;
  whyHard: string;
  audioUrl?: string;
  minimalPairs: MinimalPairItem[];
  onComplete: (stats: { score: number; passed: boolean }) => void;

  // ── Rachel's English Video Integration (Optional props) ──
  video?: RachelVideoMeta;
  youtubeVideoId?: string;
  startSeconds?: number;
  endSeconds?: number;
  channelName?: string;
  videoTip?: string;
}

export interface InteractiveIpaVideoPlayerProps {
  video: RachelVideoMeta;
  ipa?: string;
  title?: string;
  compact?: boolean;
  autoPlay?: boolean;
  initialSpeed?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  keyArticulationTip?: string;
  videoId?: string;
  startSeconds?: number;
  endSeconds?: number;
  className?: string;
  hideHeader?: boolean;
  cleanMode?: boolean;
}
