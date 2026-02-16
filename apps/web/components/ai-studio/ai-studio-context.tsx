'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { AiStudio } from '@/components/ai-studio/ai-studio';
import type { AiGeneratedFile, MockFile } from '@/types/ai-studio';

export type StudioTab = 'dockerfile' | 'compose' | 'assistant';

export interface AiStudioPrefill {
  tab?: StudioTab;
  resourceType?: 'compute' | 'postgres' | 'redis';
}

interface AiStudioContextValue {
  files: MockFile[];
  generatedFiles: AiGeneratedFile[];
  selectedPath: string;
  selectedFile: MockFile | undefined;
  selectFile: (path: string) => void;
  updateFile: (path: string, content: string) => void;
  saveGeneratedToFile: (type: 'dockerfile' | 'compose', content: string) => void;
  insertIntoSelectedFile: (content: string) => void;
  isStudioModalOpen: boolean;
  modalPrefill: AiStudioPrefill | null;
  openStudio: (prefill?: AiStudioPrefill) => void;
  closeStudio: () => void;
}

const initialFiles: MockFile[] = [
  {
    path: 'Dockerfile',
    content: `FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start"]`,
    lastModified: new Date().toISOString(),
  },
  {
    path: 'docker-compose.yml',
    content: `services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file:
      - .env

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: app_db
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"`,
    lastModified: new Date().toISOString(),
  },
  {
    path: '.env',
    content: `NODE_ENV=development
DATABASE_URL=postgresql://app_user:secret@localhost:5432/app_db
REDIS_URL=redis://localhost:6379`,
    lastModified: new Date().toISOString(),
  },
];

const AiStudioContext = createContext<AiStudioContextValue | undefined>(undefined);

export function AiStudioProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<MockFile[]>(initialFiles);
  const [generatedFiles, setGeneratedFiles] = useState<AiGeneratedFile[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('Dockerfile');
  const [isStudioModalOpen, setIsStudioModalOpen] = useState(false);
  const [modalPrefill, setModalPrefill] = useState<AiStudioPrefill | null>(null);

  const selectedFile = useMemo(
    () => files.find((file) => file.path === selectedPath),
    [files, selectedPath]
  );

  const updateFile = useCallback((path: string, content: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.path === path
          ? {
              ...file,
              content,
              lastModified: new Date().toISOString(),
            }
          : file
      )
    );
  }, []);

  const saveGeneratedToFile = useCallback(
    (type: 'dockerfile' | 'compose', content: string) => {
      const path = type === 'dockerfile' ? 'Dockerfile' : 'docker-compose.yml';
      setSelectedPath(path);
      updateFile(path, content);
      setGeneratedFiles((prev) => [
        {
          id: crypto.randomUUID(),
          type,
          content,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [updateFile]
  );

  const insertIntoSelectedFile = useCallback(
    (content: string) => {
      setFiles((prev) =>
        prev.map((file) =>
          file.path === selectedPath
            ? {
                ...file,
                content: `${file.content}\n\n${content}`,
                lastModified: new Date().toISOString(),
              }
            : file
        )
      );
    },
    [selectedPath]
  );

  const openStudio = useCallback((prefill?: AiStudioPrefill) => {
    setModalPrefill(prefill ?? null);
    setIsStudioModalOpen(true);
  }, []);

  const closeStudio = useCallback(() => {
    setIsStudioModalOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      files,
      generatedFiles,
      selectedPath,
      selectedFile,
      selectFile: setSelectedPath,
      updateFile,
      saveGeneratedToFile,
      insertIntoSelectedFile,
      isStudioModalOpen,
      modalPrefill,
      openStudio,
      closeStudio,
    }),
    [
      files,
      generatedFiles,
      selectedPath,
      selectedFile,
      updateFile,
      saveGeneratedToFile,
      insertIntoSelectedFile,
      isStudioModalOpen,
      modalPrefill,
      openStudio,
      closeStudio,
    ]
  );

  return (
    <AiStudioContext.Provider value={value}>
      {children}
      <Dialog open={isStudioModalOpen} onOpenChange={setIsStudioModalOpen}>
        <DialogContent className="max-w-[95vw] h-[90vh] p-0 border-border bg-card">
          <AiStudio mode="modal" prefill={modalPrefill ?? undefined} onClose={closeStudio} />
        </DialogContent>
      </Dialog>
    </AiStudioContext.Provider>
  );
}

export function useAiStudio() {
  const context = useContext(AiStudioContext);
  if (!context) {
    throw new Error('useAiStudio must be used within AiStudioProvider');
  }
  return context;
}
