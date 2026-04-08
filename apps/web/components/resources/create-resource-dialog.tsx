'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateResourcePayload, ResourceType } from '@/types/resource';

const defaultComposeTemplate = `version: "3.9"
services:
  app:
    image: nginx:alpine
    ports:
      - "3000:3000"
    command: ["sleep", "infinity"]`;

const presets: Record<
  ResourceType,
  { image?: string; containerPort?: string; hostPort?: string; env?: string[]; description: string }
> = {
  compute: {
    image: 'nginx:alpine',
    containerPort: '80',
    hostPort: '3000',
    description: 'Fast general-purpose HTTP workload for demos, previews, and temporary utilities.',
  },
  postgres: {
    image: 'postgres:16',
    containerPort: '5432',
    hostPort: '5432',
    env: ['POSTGRES_PASSWORD=devcon', 'POSTGRES_DB=devcon'],
    description: 'Default PostgreSQL service with local credentials and a ready-to-use database.',
  },
  redis: {
    image: 'redis:7-alpine',
    containerPort: '6379',
    hostPort: '6379',
    description: 'Lightweight cache node for queues, sessions, and event pipelines.',
  },
  custom: {
    description: 'Paste your own Docker Compose stack when the presets are too narrow.',
  },
};

interface CreateResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (resource: CreateResourcePayload) => void;
}

export function CreateResourceDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateResourceDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ResourceType>('compute');
  const [hostPort, setHostPort] = useState('3000');
  const [image, setImage] = useState(presets.compute.image ?? '');
  const [containerPort, setContainerPort] = useState(presets.compute.containerPort ?? '');
  const [envText, setEnvText] = useState((presets.compute.env ?? []).join('\n'));
  const [composeYaml, setComposeYaml] = useState(defaultComposeTemplate);

  useEffect(() => {
    if (type === 'custom') {
      setComposeYaml((prev) => prev || defaultComposeTemplate);
      return;
    }

    const preset = presets[type];
    setImage(preset.image ?? '');
    setContainerPort(preset.containerPort ?? '');
    setHostPort(preset.hostPort ?? '3000');
    setEnvText((preset.env ?? []).join('\n'));
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'custom') {
      if (!composeYaml.trim()) {
        return;
      }

      onCreate({
        name,
        type,
        compose: composeYaml.trim(),
      });
    } else {
      const env = envText
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

      if (!image || !containerPort || !hostPort) {
        return;
      }

      onCreate({
        name,
        type,
        image,
        containerPort,
        hostPort,
        env: env.length ? env : undefined,
      });
    }

    setName('');
    setType('compute');
    setHostPort('3000');
    setEnvText('');
    setComposeYaml(defaultComposeTemplate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-[#15110e] text-white sm:max-w-[620px]">
        <DialogHeader>
          <p className="eyebrow">Provision Resource</p>
          <DialogTitle className="text-3xl font-semibold tracking-tight">Create a new local service</DialogTitle>
          <DialogDescription className="text-sm leading-6 text-muted-foreground">
            Choose a preset when speed matters, or switch to Compose when you need a fuller topology.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-5 py-2 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="type">Resource Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as ResourceType)}>
                <SelectTrigger id="type" className="rounded-2xl border-white/10 bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compute">Compute Container</SelectItem>
                  <SelectItem value="postgres">PostgreSQL Database</SelectItem>
                  <SelectItem value="redis">Redis Cache</SelectItem>
                  <SelectItem value="custom">Custom Docker Compose</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs leading-5 text-muted-foreground">{presets[type].description}</p>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Resource Name</Label>
              <Input
                id="name"
                placeholder="my-api-service"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="rounded-2xl border-white/10 bg-white/5"
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase letters, numbers, and hyphens.
              </p>
            </div>

            {type !== 'custom' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="host-port">Host Port</Label>
                  <Input
                    id="host-port"
                    placeholder="3000"
                    value={hostPort}
                    onChange={(e) => setHostPort(e.target.value)}
                    required
                    className="rounded-2xl border-white/10 bg-white/5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="container-port">Container Port</Label>
                  <Input
                    id="container-port"
                    placeholder="80"
                    value={containerPort}
                    onChange={(e) => setContainerPort(e.target.value)}
                    required
                    className="rounded-2xl border-white/10 bg-white/5"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="image">Container Image</Label>
                  <Input
                    id="image"
                    placeholder="e.g. nginx:alpine"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    required
                    className="rounded-2xl border-white/10 bg-white/5"
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="environment">Environment Variables</Label>
                  <Textarea
                    id="environment"
                    rows={4}
                    placeholder="KEY=value"
                    value={envText}
                    onChange={(e) => setEnvText(e.target.value)}
                    className="rounded-[22px] border-white/10 bg-black/30 font-mono text-xs"
                  />
                  <p className="text-xs text-muted-foreground">One `KEY=value` entry per line.</p>
                </div>
              </>
            )}

            {type === 'custom' && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="compose-yaml">Docker Compose</Label>
                <Textarea
                  id="compose-yaml"
                  rows={10}
                  placeholder="Paste your docker-compose.yml content"
                  value={composeYaml}
                  onChange={(e) => setComposeYaml(e.target.value)}
                  required
                  className="rounded-[22px] border-white/10 bg-black/30 font-mono text-xs"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-2xl border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="rounded-2xl bg-sky-300 text-slate-950 hover:bg-sky-200"
            >
              {type === 'custom' ? 'Create Compose Resource' : 'Create Resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
