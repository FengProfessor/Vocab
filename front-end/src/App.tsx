import React from 'react';
import { AppProviders } from '@/app/AppProviders';
import { AppRouter } from '@/app/AppRouter';

/**
 * Root LingoPro SPA component combining global providers and the router tree.
 */
export const App: React.FC = () => {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
};
