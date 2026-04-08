'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { container_service } from '@/service/container/container.service';
import { Resource, ResourceDetails } from '@/types/resource';
import { toast } from '@/hooks/use-toast';

interface ResourceInspectorDialogProps {
  resource: Resource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function renderKeyValueList(items: string[]) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">None</p>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono text-zinc-100">
          {item}
        </div>
      ))}
    </div>
  );
}

export function ResourceInspectorDialog({
  resource,
  open,
  onOpenChange,
}: ResourceInspectorDialogProps) {
  const [details, setDetails] = useState<ResourceDetails | null>(null);
  const [logs, setLogs] = useState('');
  const [loading, setLoading] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [detailsRes, logsRes] = await Promise.all([
          container_service.getResourceDetails(resource.id),
          container_service.getResourceLogs(resource.id),
        ]);

        if (cancelled) {
          return;
        }

        setDetails(detailsRes.data.resource);
        setLogs(logsRes.data.logs);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load Docker resource details.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [open, resource.id]);

  const handleRefreshLogs = async () => {
    try {
      const logsRes = await container_service.getResourceLogs(resource.id);
      setLogs(logsRes.data.logs);
      toast({ title: 'Logs refreshed', description: `${resource.name} logs updated.` });
    } catch (err) {
      toast({
        title: 'Unable to refresh logs',
        description: err instanceof Error ? err.message : 'Docker logs request failed.',
        variant: 'destructive',
      });
    }
  };

  const handleRestart = async () => {
    setRestarting(true);
    try {
      await container_service.restartResource(resource.id);
      const [detailsRes, logsRes] = await Promise.all([
        container_service.getResourceDetails(resource.id),
        container_service.getResourceLogs(resource.id),
      ]);
      setDetails(detailsRes.data.resource);
      setLogs(logsRes.data.logs);
      toast({ title: 'Resource restarted', description: `${resource.name} is restarting.` });
    } catch (err) {
      toast({
        title: 'Restart failed',
        description: err instanceof Error ? err.message : 'Docker restart request failed.',
        variant: 'destructive',
      });
    } finally {
      setRestarting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl border-white/10 bg-[#15110e] text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{resource.name}</span>
            <Badge variant="outline" className="border-white/10 bg-white/5 text-zinc-100">{resource.status}</Badge>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Inspect Docker metadata, recent logs, and runtime configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">{resource.image}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10" onClick={() => void handleRefreshLogs()}>
              Refresh Logs
            </Button>
            <Button size="sm" className="rounded-2xl bg-sky-300 text-slate-950 hover:bg-sky-200" onClick={() => void handleRestart()} disabled={restarting}>
              {restarting ? 'Restarting...' : 'Restart'}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="py-10 text-sm text-muted-foreground">Loading Docker details...</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-6 text-sm text-rose-100">
            {error}
          </div>
        ) : (
          <Tabs defaultValue="details" className="space-y-4">
            <TabsList className="rounded-2xl border border-white/10 bg-white/5">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
              <TabsTrigger value="runtime">Runtime</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ports</p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {details?.host_ports.length
                      ? details.host_ports
                          .map((port, index) => `${port}:${details.container_ports[index] ?? '?'}`)
                          .join(', ')
                      : 'No published ports'}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Networks</p>
                  <p className="mt-2 text-sm font-medium text-white">
                    {details?.networks.length ? details.networks.join(', ') : 'No attached networks'}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Command</p>
                <p className="mt-2 break-all text-sm font-mono text-white">
                  {details?.command.length ? details.command.join(' ') : 'Default image command'}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="logs">
              <div className="max-h-[420px] overflow-auto rounded-lg border border-border bg-slate-950 p-4 text-xs text-slate-100">
                <pre className="whitespace-pre-wrap break-all font-mono">
                  {logs || 'No logs available.'}
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="runtime" className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Environment</p>
                {renderKeyValueList(details?.env ?? [])}
              </div>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Mounts</p>
                {renderKeyValueList(details?.mounts ?? [])}
              </div>
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 md:col-span-2">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Labels</p>
                {renderKeyValueList(
                  Object.entries(details?.labels ?? {}).map(([key, value]) => `${key}=${value}`)
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
