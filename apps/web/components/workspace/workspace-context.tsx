'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface WorkspaceContextValue {
  workspaces: Workspace[];
  currentWorkspace: Workspace;
  setCurrentWorkspace: (workspaceId: string) => void;
  updateCurrentWorkspace: (input: { name: string; slug: string }) => void;
}

const STORAGE_KEY = 'devcon.workspace.state';

const defaultWorkspaces: Workspace[] = [
  { id: 'production', name: 'Production Workspace', slug: 'production' },
  { id: 'development', name: 'Development Workspace', slug: 'development' },
  { id: 'staging', name: 'Staging Workspace', slug: 'staging' },
];

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'workspace';
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(defaultWorkspaces);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string>(defaultWorkspaces[0].id);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as {
        workspaces?: Workspace[];
        currentWorkspaceId?: string;
      };

      if (parsed.workspaces?.length) {
        setWorkspaces(parsed.workspaces);
      }

      if (parsed.currentWorkspaceId) {
        setCurrentWorkspaceId(parsed.currentWorkspaceId);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ workspaces, currentWorkspaceId })
    );
  }, [workspaces, currentWorkspaceId]);

  const currentWorkspace =
    workspaces.find((workspace) => workspace.id === currentWorkspaceId) ?? workspaces[0];

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      currentWorkspace,
      setCurrentWorkspace: (workspaceId: string) => {
        setCurrentWorkspaceId(workspaceId);
      },
      updateCurrentWorkspace: ({ name, slug }) => {
        const normalizedSlug = normalizeSlug(slug);

        setWorkspaces((prev) =>
          prev.map((workspace) =>
            workspace.id === currentWorkspace.id
              ? {
                  ...workspace,
                  name: name.trim() || workspace.name,
                  slug: normalizedSlug,
                }
              : workspace
          )
        );
      },
    }),
    [currentWorkspace, workspaces]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }

  return context;
}
