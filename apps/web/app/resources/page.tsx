'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, Cpu, Database, Radio, Boxes } from 'lucide-react';
import { ResourceCard } from '@/components/resources/resource-card';
import { CreateResourceDialog } from '@/components/resources/create-resource-dialog';
import { useAiStudio } from '@/components/ai-studio/ai-studio-context';
import { container_service } from '@/service/container/container.service';
import { CreateResourcePayload, Resource } from '@/types/resource';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const filterPills = [
  { label: 'All', value: null, icon: Boxes },
  { label: 'Compute', value: 'compute', icon: Cpu },
  { label: 'Postgres', value: 'postgres', icon: Database },
  { label: 'Redis', value: 'redis', icon: Radio },
  { label: 'Stacks', value: 'custom', icon: Sparkles },
];

export default function ResourcesPage() {
  return (
    <Suspense fallback={<div className="section-shell text-sm text-muted-foreground">Loading resources...</div>}>
      <ResourcesPageContent />
    </Suspense>
  );
}

function ResourcesPageContent() {
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
    } catch (err) {
      toast({
        title: 'Unable to load resources',
        description: err instanceof Error ? err.message : 'Docker resources request failed.',
        variant: 'destructive',
      });
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

  const runningCount = filteredResources.filter((resource) => resource.status === 'RUNNING').length;

  const handleStart = async (id: string) => {
    setMutatingId(id);
    try {
      await container_service.startResource(id);
      await fetchResources();
      toast({ title: 'Resource started', description: `Container ${id.slice(0, 12)} is running.` });
    } catch (err) {
      toast({
        title: 'Start failed',
        description: err instanceof Error ? err.message : 'Unable to start resource.',
        variant: 'destructive',
      });
    } finally {
      setMutatingId(null);
    }
  };

  const handleStop = async (id: string) => {
    setMutatingId(id);
    try {
      await container_service.stopResource(id);
      await fetchResources();
      toast({ title: 'Resource stopped', description: `Container ${id.slice(0, 12)} was stopped.` });
    } catch (err) {
      toast({
        title: 'Stop failed',
        description: err instanceof Error ? err.message : 'Unable to stop resource.',
        variant: 'destructive',
      });
    } finally {
      setMutatingId(null);
    }
  };

  const handleRestart = async (id: string) => {
    setMutatingId(id);
    try {
      await container_service.restartResource(id);
      await fetchResources();
      toast({ title: 'Resource restarted', description: `Container ${id.slice(0, 12)} restarted.` });
    } catch (err) {
      toast({
        title: 'Restart failed',
        description: err instanceof Error ? err.message : 'Unable to restart resource.',
        variant: 'destructive',
      });
    } finally {
      setMutatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setMutatingId(id);
    try {
      await container_service.deleteResource(id);
      await fetchResources();
      toast({ title: 'Resource deleted', description: `Container ${id.slice(0, 12)} was removed.` });
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unable to delete resource.',
        variant: 'destructive',
      });
    } finally {
      setMutatingId(null);
    }
  };

  const handleCreate = async (resource: CreateResourcePayload) => {
    try {
      await container_service.createResource(resource);
      await fetchResources();
      toast({
        title: 'Resource created',
        description: `${resource.name} is now available in the Docker fleet.`,
      });
    } catch (err) {
      toast({
        title: 'Create failed',
        description: err instanceof Error ? err.message : 'Unable to create resource.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="section-shell space-y-6">
      <section className="surface-panel overflow-hidden px-6 py-7 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="eyebrow">Resource Fleet</p>
            <div className="space-y-3">
              <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Make the container grid feel operational, not accidental.
              </h1>
              <p className="text-sm leading-7 text-muted-foreground sm:text-base">
                Create workloads, inspect the running estate, and jump from runtime state into generated Docker config without losing context.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Visible</p>
              <p className="mt-1 text-2xl font-semibold text-white">{filteredResources.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Running</p>
              <p className="mt-1 text-2xl font-semibold text-emerald-200">{runningCount}</p>
            </div>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="h-12 rounded-2xl bg-sky-300 px-5 text-sm font-semibold text-slate-950 hover:bg-sky-200"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Resource
            </Button>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-2">
        {filterPills.map((pill) => {
          const active = (pill.value === null && !typeFilter) || typeFilter === pill.value;
          const Icon = pill.icon;

          return (
            <a
              key={pill.label}
              href={pill.value ? `/resources?type=${pill.value}` : '/resources'}
              className={cn(
                'inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition-all',
                active
                  ? 'border-sky-300/30 bg-sky-400/10 text-sky-100'
                  : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/8 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {pill.label}
            </a>
          );
        })}
      </section>

      {mutatingId && (
        <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
          Applying action to resource <span className="font-mono">{mutatingId.slice(0, 12)}</span>...
        </div>
      )}

      <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {!loading &&
          filteredResources.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              onStart={() => void handleStart(resource.id)}
              onRestart={() => void handleRestart(resource.id)}
              onStop={() => void handleStop(resource.id)}
              onDelete={() => void handleDelete(resource.id)}
              onGenerateWithAi={(selectedResource) =>
                openStudio({ tab: 'compose', resourceType: selectedResource.type })
              }
            />
          ))}
      </section>

      {loading && (
        <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-12 text-sm text-muted-foreground">
          Loading resources...
        </div>
      )}
      {!loading && filteredResources.length === 0 && (
        <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-12 text-sm text-muted-foreground">
          No resources found{typeFilter ? ` for type "${typeFilter}"` : ''}.
        </div>
      )}

      <CreateResourceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onCreate={handleCreate}
      />
    </div>
  );
}
