'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useWorkspace } from '@/components/workspace/workspace-context';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { currentWorkspace, updateCurrentWorkspace } = useWorkspace();
  const [workspaceName, setWorkspaceName] = useState(currentWorkspace.name);
  const [workspaceSlug, setWorkspaceSlug] = useState(currentWorkspace.slug);

  useEffect(() => {
    setWorkspaceName(currentWorkspace.name);
    setWorkspaceSlug(currentWorkspace.slug);
  }, [currentWorkspace]);

  const handleSave = () => {
    updateCurrentWorkspace({
      name: workspaceName,
      slug: workspaceSlug,
    });

    toast({
      title: 'Workspace updated',
      description: 'Header and workspace settings now reflect the active workspace.',
    });
  };

  return (
    <div className="section-shell space-y-6">
      <section className="surface-panel px-6 py-7 sm:px-8 sm:py-8">
        <div className="max-w-3xl space-y-4">
          <p className="eyebrow">Preferences</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Reduce noise and make the controls feel intentional.
          </h1>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            Settings should read like operator defaults for a Docker workspace: clear groups, obvious risk boundaries, and no filler.
          </p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="surface-card border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Workspace Identity</CardTitle>
              <CardDescription className="text-muted-foreground">
                Names and slugs used across URLs, CLI calls, and visible labels.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name</Label>
                <Input
                  id="workspace-name"
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  className="rounded-2xl border-white/10 bg-white/5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-slug">Workspace Slug</Label>
                <Input
                  id="workspace-slug"
                  value={workspaceSlug}
                  onChange={(event) => setWorkspaceSlug(event.target.value)}
                  className="rounded-2xl border-white/10 bg-white/5"
                />
                <p className="text-xs text-muted-foreground">
                  Used in routes, environment references, and agent metadata.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="surface-card border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Agent Behavior</CardTitle>
              <CardDescription className="text-muted-foreground">
                Defaults that affect resource automation and observability.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                {
                  label: 'Auto-start Resources',
                  description: 'Bring critical services back online when the agent reconnects.',
                },
                {
                  label: 'Health Checks',
                  description: 'Continuously monitor container state and detect regressions faster.',
                },
                {
                  label: 'Log Collection',
                  description: 'Collect and expose container logs for live diagnostics.',
                },
              ].map((item, index) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between gap-6">
                    <div className="space-y-1">
                      <Label>{item.label}</Label>
                      <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  {index < 2 && <Separator className="mt-6 bg-white/10" />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="surface-card border-white/10 bg-white/5">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Default Limits</CardTitle>
              <CardDescription className="text-muted-foreground">
                Baseline constraints applied to new deployments.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="default-cpu">Default CPU Limit</Label>
                <Input id="default-cpu" defaultValue="1 core" className="rounded-2xl border-white/10 bg-white/5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-memory">Default Memory Limit</Label>
                <Input id="default-memory" defaultValue="2 GB" className="rounded-2xl border-white/10 bg-white/5" />
              </div>
            </CardContent>
          </Card>

          <Card className="surface-card border-red-400/15 bg-red-500/[0.04]">
            <CardHeader>
              <CardTitle className="text-2xl text-white">Danger Zone</CardTitle>
              <CardDescription className="text-red-100/70">
                High-impact actions stay isolated and visually loud.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-[22px] border border-red-400/20 bg-black/20 p-5">
                <h4 className="font-medium text-white">Delete All Resources</h4>
                <p className="mt-2 text-sm leading-6 text-red-100/70">
                  Stop and remove every local resource in this workspace. This should only be used for a full reset.
                </p>
                <Button variant="destructive" className="mt-5 rounded-2xl">
                  Delete All
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          className="rounded-2xl bg-sky-300 px-5 text-slate-950 hover:bg-sky-200"
          onClick={handleSave}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
