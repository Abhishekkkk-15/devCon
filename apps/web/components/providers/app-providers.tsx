'use client';

import { AiStudioProvider } from '@/components/ai-studio/ai-studio-context';
import { Toaster } from '@/components/ui/toaster';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AiStudioProvider>
      {children}
      <Toaster />
    </AiStudioProvider>
  );
}
