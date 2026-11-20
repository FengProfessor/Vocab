'use client';

import React from 'react';
import { ExamInteractiveText } from '@/components/exam/ExamInteractiveText';
import type { CoreVocabulary } from '@/types/listening';

export interface WordLookupPopoverProps {
  sentence: string;
  coreVocabulary?: CoreVocabulary[];
  onWordSelect?: (word: string) => void;
  onWordClickSeek?: () => void;
  className?: string;
  activeTokenStyle?: string;
}

export const WordLookupPopover: React.FC<WordLookupPopoverProps> = ({
  sentence,
  coreVocabulary = [],
  onWordSelect,
  onWordClickSeek,
  className = '',
  activeTokenStyle = '',
}) => {
  return (
    <ExamInteractiveText
      text={sentence}
      enabled={true}
      as="span"
      inheritClassName
      className={className}
      activeWordClassName={activeTokenStyle}
      coreVocabulary={coreVocabulary}
      onWordClick={(_rawWord, cleanWord) => {
        onWordClickSeek?.();
        onWordSelect?.(cleanWord);
      }}
    />
  );
};
