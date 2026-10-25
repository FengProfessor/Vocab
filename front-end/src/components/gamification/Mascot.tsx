'use client';

export type MascotMood = 'happy' | 'cheer' | 'sleepy' | 'sad' | 'thinking';

const MOODS: Record<MascotMood, { face: string; class: string }> = {
  happy:    { face: '😊', class: '' },
  cheer:    { face: '🥳', class: 'animate-bounce' },
  sleepy:   { face: '😴', class: '' },
  sad:      { face: '😢', class: '' },
  thinking: { face: '🤔', class: '' },
};

interface Props {
  mood?: MascotMood;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = { sm: 'text-3xl', md: 'text-5xl', lg: 'text-7xl' };

export function Mascot({ mood = 'happy', size = 'md', className = '' }: Props) {
  const { face, class: moodClass } = MOODS[mood];
  return (
    <span
      role="img"
      aria-label={mood}
      className={`inline-block select-none ${SIZES[size]} ${moodClass} ${className}`}
    >
      {face}
    </span>
  );
}
