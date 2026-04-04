'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Copy, Save, Sparkles, Loader2, Wand2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

type AppType = 'node' | 'python' | 'go' | 'nextjs' | 'custom';
type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'pip' | 'go mod';

interface DockerfileGeneratorProps {
  onGenerated: (content: string) => void;
}

function createDockerfileTemplate(
  appType: AppType,
  runtimeVersion: string,
  port: string,
  packageManager: PackageManager,
  optimize: boolean,
  multiStage: boolean
) {
  const packageInstallCommand: Record<PackageManager, string> = {
    npm: 'npm ci',
    yarn: 'yarn install --frozen-lockfile',
    pnpm: 'pnpm install --frozen-lockfile',
    pip: 'pip install --no-cache-dir -r requirements.txt',
    'go mod': 'go mod download',
  };

  const startCommandByType: Record<AppType, string> = {
    node: 'CMD ["node", "server.js"]',
    python: 'CMD ["python", "app.py"]',
    go: 'CMD ["./app"]',
    nextjs: 'CMD ["npm", "run", "start"]',
    custom: 'CMD ["sh", "-c", "echo Define your custom command"]',
  };

  const baseImage =
    appType === 'python'
      ? `python:${runtimeVersion}-slim`
      : appType === 'go'
        ? `golang:${runtimeVersion}-alpine`
        : `node:${runtimeVersion}-alpine`;

  const optimizeLines = optimize
    ? `\nENV NODE_ENV=production\nRUN addgroup -S app && adduser -S app -G app\nUSER app`
    : '';

  if (multiStage) {
    return `# syntax=docker/dockerfile:1
FROM ${baseImage} AS builder
WORKDIR /app
COPY . .
RUN ${packageInstallCommand[packageManager]}

FROM ${baseImage} AS runner
WORKDIR /app
COPY --from=builder /app /app
EXPOSE ${port}${optimizeLines}
${startCommandByType[appType]}`;
  }

  return `# syntax=docker/dockerfile:1
FROM ${baseImage}
WORKDIR /app
COPY . .
RUN ${packageInstallCommand[packageManager]}
EXPOSE ${port}${optimizeLines}
${startCommandByType[appType]}`;
}

function downloadDockerfile(content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'Dockerfile';
  anchor.click();
  URL.revokeObjectURL(url);
}

export function DockerfileGenerator({ onGenerated }: DockerfileGeneratorProps) {
  const [appType, setAppType] = useState<AppType>('nextjs');
  const [runtimeVersion, setRuntimeVersion] = useState('20');
  const [port, setPort] = useState('3000');
  const [packageManager, setPackageManager] = useState<PackageManager>('npm');
  const [optimize, setOptimize] = useState(true);
  const [multiStage, setMultiStage] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dockerfile, setDockerfile] = useState('');
  const [editorValue, setEditorValue] = useState('');

  const canAct = useMemo(() => dockerfile.length > 0, [dockerfile.length]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = createDockerfileTemplate(
        appType,
        runtimeVersion,
        port,
        packageManager,
        optimize,
        multiStage
      );
      setDockerfile(generated);
      setEditorValue(generated);
      onGenerated(generated);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Application Type</Label>
            <Select value={appType} onValueChange={(value) => setAppType(value as AppType)}>
              <SelectTrigger className="h-9 bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="node">Node.js</SelectItem>
                <SelectItem value="python">Python</SelectItem>
                <SelectItem value="go">Go</SelectItem>
                <SelectItem value="nextjs">Next.js</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Runtime Version</Label>
            <Input 
              value={runtimeVersion} 
              onChange={(e) => setRuntimeVersion(e.target.value)} 
              placeholder="e.g. 20" 
              className="h-9 bg-background/50"
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Exposed Port</Label>
            <Input 
              value={port} 
              onChange={(e) => setPort(e.target.value)} 
              placeholder="3000" 
              className="h-9 bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">Package Manager</Label>
            <Select value={packageManager} onValueChange={(value) => setPackageManager(value as PackageManager)}>
              <SelectTrigger className="h-9 bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="npm">npm</SelectItem>
                <SelectItem value="yarn">yarn</SelectItem>
                <SelectItem value="pnpm">pnpm</SelectItem>
                <SelectItem value="pip">pip</SelectItem>
                <SelectItem value="go mod">go mod</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Production Ready</Label>
              <p className="text-[10px] text-muted-foreground">Optimized base images</p>
            </div>
            <Switch checked={optimize} onCheckedChange={setOptimize} className="scale-75" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Multi-stage Build</Label>
              <p className="text-[10px] text-muted-foreground">Smaller final image size</p>
            </div>
            <Switch checked={multiStage} onCheckedChange={setMultiStage} className="scale-75" />
          </div>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating} 
          className="w-full h-10 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
        >
          {isGenerating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="mr-2 h-4 w-4" />
          )}
          {isGenerating ? 'Analyzing Architecture...' : 'Generate Optimized Dockerfile'}
        </Button>
      </div>

      {canAct && (
        <div className="pt-4 border-t border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Actions</span>
            <div className="flex gap-1.5">
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={async () => {
                  await navigator.clipboard.writeText(editorValue);
                  toast({ title: 'Copied', description: 'Dockerfile content copied.' });
                }}
                title="Copy to clipboard"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => {
                  downloadDockerfile(editorValue);
                  toast({ title: 'Downloaded', description: 'Dockerfile saved.' });
                }}
                title="Download file"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          {isGenerating && (
            <div className="space-y-2 p-3 rounded-md bg-muted/30">
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-2 w-[90%]" />
              <Skeleton className="h-2 w-[70%]" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
