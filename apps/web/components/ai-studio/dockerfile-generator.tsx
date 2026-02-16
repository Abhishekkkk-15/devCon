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
import { Download, Copy, Save, Sparkles, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/hooks/use-toast';
import { CodeEditor } from '@/components/ai-studio/code-editor';

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
    <div className="pt-6 space-y-6">
      <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base">Dockerfile Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Application Type</Label>
              <Select value={appType} onValueChange={(value) => setAppType(value as AppType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="node">Node</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="go">Go</SelectItem>
                  <SelectItem value="nextjs">Next.js</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Runtime Version</Label>
              <Input value={runtimeVersion} onChange={(e) => setRuntimeVersion(e.target.value)} placeholder="20" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Exposed Port</Label>
              <Input value={port} onChange={(e) => setPort(e.target.value)} placeholder="3000" />
            </div>
            <div className="space-y-2">
              <Label>Package Manager</Label>
              <Select value={packageManager} onValueChange={(value) => setPackageManager(value as PackageManager)}>
                <SelectTrigger>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label className="text-sm">Include Production Optimizations</Label>
              <Switch checked={optimize} onCheckedChange={setOptimize} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label className="text-sm">Multi-stage build</Label>
              <Switch checked={multiStage} onCheckedChange={setMultiStage} />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Dockerfile
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Generated Dockerfile</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!canAct}
                onClick={async () => {
                  await navigator.clipboard.writeText(editorValue);
                  toast({ title: 'Copied', description: 'Dockerfile copied to clipboard.' });
                }}
              >
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copy
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!canAct}
                onClick={() => {
                  downloadDockerfile(editorValue);
                  toast({ title: 'Downloaded', description: 'Dockerfile downloaded.' });
                }}
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!canAct}
                onClick={() => toast({ title: 'Saved to path', description: 'Saved to local path (mock).' })}
              >
                <Save className="mr-2 h-3.5 w-3.5" />
                Save to local path
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[92%]" />
              <Skeleton className="h-4 w-[88%]" />
              <Skeleton className="h-4 w-[75%]" />
              <Skeleton className="h-4 w-[80%]" />
            </div>
          ) : canAct ? (
            <div className="h-[340px]">
              <CodeEditor
                language="dockerfile"
                title="Dockerfile"
                value={editorValue}
                onChange={(nextValue) => {
                  setEditorValue(nextValue);
                  setDockerfile(nextValue);
                }}
                onSave={() => {
                  onGenerated(editorValue);
                  toast({ title: 'Saved successfully', description: 'Dockerfile updated in mock file system.' });
                }}
              />
            </div>
          ) : (
            <pre className="max-h-[280px] overflow-auto rounded-md border border-border bg-muted/30 p-4 text-xs leading-6">
              <code className="font-mono"># Generate a Dockerfile to preview AI output</code>
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
