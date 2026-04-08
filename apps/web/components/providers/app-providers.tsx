'use client';

import { AiStudioProvider } from '@/components/ai-studio/ai-studio-context';
import { Toaster } from '@/components/ui/toaster';
import { WorkspaceProvider } from '@/components/workspace/workspace-context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <AiStudioProvider>
        {children}
        <Toaster />
      </AiStudioProvider>
    </WorkspaceProvider>
  );
}
