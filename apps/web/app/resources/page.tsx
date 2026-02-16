'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ResourceCard } from '@/components/resources/resource-card';
import { CreateResourceDialog } from '@/components/resources/create-resource-dialog';
import { useAiStudio } from '@/components/ai-studio/ai-studio-context';

export type ResourceType = 'compute' | 'postgres' | 'redis';
export type ResourceStatus = 'CREATING' | 'RUNNING' | 'STOPPED' | 'ERROR';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  cpu: number;
  memory: number;
  cpuLimit: string;
  memoryLimit: string;
  createdAt: string;
}

const initialResources: Resource[] = [
  {
    id: '1',
    name: 'api-gateway',
    type: 'compute',
    status: 'RUNNING',
    cpu: 45,
    memory: 62,
    cpuLimit: '2 cores',
    memoryLimit: '4 GB',
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    name: 'postgres-main',
    type: 'postgres',
    status: 'RUNNING',
    cpu: 28,
    memory: 48,
    cpuLimit: '1 core',
    memoryLimit: '2 GB',
    createdAt: '2024-01-14T14:20:00Z',
  },
  {
    id: '3',
    name: 'redis-cache',
    type: 'redis',
    status: 'RUNNING',
    cpu: 12,
    memory: 15,
    cpuLimit: '0.5 cores',
    memoryLimit: '1 GB',
    createdAt: '2024-01-14T09:15:00Z',
  },
  {
    id: '4',
    name: 'worker-service',
    type: 'compute',
    status: 'STOPPED',
    cpu: 0,
    memory: 0,
    cpuLimit: '1 core',
    memoryLimit: '2 GB',
    createdAt: '2024-01-13T16:45:00Z',
  },
  {
    id: '5',
    name: 'postgres-analytics',
    type: 'postgres',
    status: 'CREATING',
    cpu: 0,
    memory: 0,
    cpuLimit: '2 cores',
    memoryLimit: '8 GB',
    createdAt: '2024-01-16T08:00:00Z',
  },
];

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>(initialResources);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { openStudio } = useAiStudio();

  const handleStart = (id: string) => {
    setResources(resources.map(r =>
      r.id === id ? { ...r, status: 'RUNNING' as ResourceStatus, cpu: 35, memory: 40 } : r
    ));
  };

  const handleStop = (id: string) => {
    setResources(resources.map(r =>
      r.id === id ? { ...r, status: 'STOPPED' as ResourceStatus, cpu: 0, memory: 0 } : r
    ));
  };

  const handleDelete = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const handleCreate = (resource: Omit<Resource, 'id' | 'cpu' | 'memory' | 'createdAt'>) => {
    const newResource: Resource = {
      ...resource,
      id: Math.random().toString(36).substr(2, 9),
      cpu: 0,
      memory: 0,
      createdAt: new Date().toISOString(),
    };
    setResources([newResource, ...resources]);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground mt-2">
            Manage your compute, database, and cache resources
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Resource
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onStart={handleStart}
            onStop={handleStop}
            onDelete={handleDelete}
            onGenerateWithAi={(selectedResource) =>
              openStudio({ tab: 'compose', resourceType: selectedResource.type })
            }
          />
        ))}
      </div>

      <CreateResourceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreate}
      />
    </div>
  );
}
