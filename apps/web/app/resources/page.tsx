'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ResourceCard } from '@/components/resources/resource-card';
import { CreateResourceDialog } from '@/components/resources/create-resource-dialog';
import { useAiStudio } from '@/components/ai-studio/ai-studio-context';
import { container_service } from '@/service/container/container.service';
import { CreateResourcePayload, Resource } from '@/types/resource';

export default function ResourcesPage() {
  const searchParams = useSearchParams();
  const typeFilter = searchParams.get('type');
  const [resources, setResources] = useState<Resource[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mutatingId, setMutatingId] = useState<string | null>(null);
  const { openStudio } = useAiStudio();

  const fetchResources = async () => {
    setLoading(true);
    try {
      const res = await container_service.getResources();
      setResources(res.data.resources);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchResources();
  }, []);

  const filteredResources = useMemo(() => {
    if (!typeFilter || typeFilter === 'database') {
      return resources;
    }
    return resources.filter((resource) => resource.type === typeFilter);
  }, [resources, typeFilter]);

  const handleStart = async (id: string) => {
    setMutatingId(id);
    try {
      await container_service.startResource(id);
      await fetchResources();
    } finally {
      setMutatingId(null);
    }
  };

  const handleStop = async (id: string) => {
    setMutatingId(id);
    try {
      await container_service.stopResource(id);
      await fetchResources();
    } finally {
      setMutatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setMutatingId(id);
    try {
      await container_service.deleteResource(id);
      await fetchResources();
    } finally {
      setMutatingId(null);
    }
  };

  const handleCreate = async (resource: CreateResourcePayload) => {
    await container_service.createResource(resource);
    await fetchResources();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-muted-foreground mt-2">
            Manage compute, database, cache, and custom compose resources
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Resource
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {!loading && filteredResources.map((resource) => (
          <ResourceCard
            key={resource.id}
            resource={resource}
            onStart={() => void handleStart(resource.id)}
            onStop={() => void handleStop(resource.id)}
            onDelete={() => void handleDelete(resource.id)}
            onGenerateWithAi={(selectedResource) =>
              openStudio({ tab: 'compose', resourceType: selectedResource.type })
            }
          />
        ))}
      </div>

      {loading && <div className="text-sm text-muted-foreground">Loading resources...</div>}
      {!loading && filteredResources.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-sm text-muted-foreground">
          No resources found{typeFilter ? ` for type "${typeFilter}"` : ''}.
        </div>
      )}

      {mutatingId && (
        <div className="text-xs text-muted-foreground">Applying action to resource {mutatingId.slice(0, 12)}...</div>
      )}

      <CreateResourceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreate}
      />
    </div>
  );
}
