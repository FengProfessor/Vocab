/**
 * LingoPro Speaking Subsystem — Split-Pane UI Scaffolding Barrel Export
 * File: src/components/speaking/split-pane/index.ts
 *
 * Clean barrel re-exports of all split-pane UI components, helpers, and types:
 * - SplitPaneLayout: Technical minimalist 2-column responsive layout
 * - SpeakingStimulusPane: Left pane with image stimulus & dual-speed reference audio
 * - SpeakingInteractionPane: Right pane with guidance, recording, and feedback
 * - RecordingButton: 6-state accessible recording button with ripple pulse
 * - LiveTranscriptDisplay: Real-time interim/final transcript & confidence badge
 */

// 1. Split-Pane Layout
export { SplitPaneLayout } from './SplitPaneLayout';
export type {
  SplitPaneLayoutProps,
  SplitPaneRatio,
  MobileLayoutMode,
  MobileActiveTab,
} from './SplitPaneLayout';

// 2. Stimulus Pane (Left Column)
export { SpeakingStimulusPane } from './SpeakingStimulusPane';
export type {
  SpeakingStimulusPaneProps,
  SpeakingStimulusData,
} from './SpeakingStimulusPane';

// 3. Interaction Pane (Right Column)
export { SpeakingInteractionPane } from './SpeakingInteractionPane';
export type {
  SpeakingInteractionPaneProps,
  SpeakingEvaluationFeedback,
} from './SpeakingInteractionPane';

// 4. Recording Button
export { RecordingButton, deriveRecordingButtonState } from './RecordingButton';
export type {
  RecordingButtonProps,
  RecordingButtonState,
} from './RecordingButton';

// 5. Live Transcript Display
export { LiveTranscriptDisplay } from './LiveTranscriptDisplay';
export type {
  LiveTranscriptDisplayProps,
} from './LiveTranscriptDisplay';
