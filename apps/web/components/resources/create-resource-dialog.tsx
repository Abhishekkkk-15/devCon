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

const presets: Record<ResourceType, { image?: string; containerPort?: string; hostPort?: string; env?: string[]; description: string }> = {
  compute: {
    image: 'nginx:alpine',
    containerPort: '80',
    hostPort: '3000',
    description: 'General compute container running nginx for quick HTTP responses.',
  },
  postgres: {
    image: 'postgres:16',
    containerPort: '5432',
    hostPort: '5432',
    env: ['POSTGRES_PASSWORD=devcon', 'POSTGRES_DB=devcon'],
    description: 'PostgreSQL 16 with a default database and password.',
  },
  redis: {
    image: 'redis:7-alpine',
    containerPort: '6379',
    hostPort: '6379',
    description: 'Redis cache ready to accept connections on 6379.',
  },
  custom: {
    description: 'Paste your own docker-compose stack and we will orchestrate it locally.',
  },
};

interface CreateResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (resource: CreateResourcePayload) => void;
}

export function CreateResourceDialog({ open, onOpenChange, onCreate }: CreateResourceDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ResourceType>('compute');
  const [hostPort, setHostPort] = useState('3000');
  const [image, setImage] = useState(presets.compute.image ?? '');
  const [containerPort, setContainerPort] = useState(presets.compute.containerPort ?? '');
  const [env, setEnv] = useState<string[]>(presets.compute.env ?? []);
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
    setEnv(preset.env ?? []);
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
    setComposeYaml(defaultComposeTemplate);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Resource</DialogTitle>
          <DialogDescription>
            Configure and deploy a new resource to your local environment
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Resource Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as ResourceType)}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compute">Compute Container</SelectItem>
                  <SelectItem value="postgres">PostgreSQL Database</SelectItem>
                  <SelectItem value="redis">Redis Cache</SelectItem>
                  <SelectItem value="custom">Custom Docker Compose</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {presets[type].description}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Resource Name</Label>
              <Input
                id="name"
                placeholder="my-api-service"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Use lowercase letters, numbers, and hyphens
              </p>
            </div>

            {type !== 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="host-port">Host Port</Label>
                <Input
                  id="host-port"
                  placeholder="3000"
                  value={hostPort}
                  onChange={(e) => setHostPort(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {type === 'compute' && 'Maps to container port 80 using nginx:alpine'}
                  {type === 'postgres' && 'Maps to container port 5432 using postgres:16'}
                  {type === 'redis' && 'Maps to container port 6379 using redis:7-alpine'}
                </p>
              </div>
            )}

            {type !== 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="image">Container Image</Label>
                <Input
                  id="image"
                  placeholder="e.g. nginx:alpine"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  required
                />
              </div>
            )}

            {type !== 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="container-port">Container Port</Label>
                <Input
                  id="container-port"
                  placeholder="80"
                  value={containerPort}
                  onChange={(e) => setContainerPort(e.target.value)}
                  required
                />
              </div>
            )}

            {type === 'custom' && (
              <div className="space-y-2">
                <Label htmlFor="compose-yaml">Docker Compose</Label>
                <Textarea
                  id="compose-yaml"
                  rows={6}
                  placeholder="Paste your docker-compose.yml content"
                  value={composeYaml}
                  onChange={(e) => setComposeYaml(e.target.value)}
                  required
                  className="font-mono text-xs"
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {type === 'custom' ? 'Create Compose Resource' : 'Create Resource'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
