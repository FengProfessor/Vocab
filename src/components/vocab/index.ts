export {
  VocabLookupProvider,
  useVocabLookup,
  useOptionalVocabLookup,
  calculateLookupPopoverPosition,
  type LookupThemeVariant,
  type LookupAnchorRect,
  type OpenLookupOptions,
  type VocabLookupContextValue,
} from './VocabLookupProvider';

export {
  InteractiveFormattedText,
  parseFormattedSegments,
  type FormattedSegment,
  type InteractiveFormattedTextProps,
} from './InteractiveFormattedText';

export {
  InteractiveHighlightedText,
  computeHighlightSegments,
  type HighlightSpan,
  type HighlightedSegment,
  type InteractiveHighlightedTextProps,
} from './InteractiveHighlightedText';

export {
  InteractiveClozeText,
  splitClozeSegments,
  type ClozeSegment,
  type InteractiveClozeTextProps,
} from './InteractiveClozeText';
