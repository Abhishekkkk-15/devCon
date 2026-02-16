'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Copy, Download, Save, Sparkles, Loader2, FileCode2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CodeEditor } from '@/components/ai-studio/code-editor';
import type { AiStudioPrefill } from '@/components/ai-studio/ai-studio-context';

interface ComposeGeneratorProps {
  prefill?: AiStudioPrefill;
  onGenerated: (content: string) => void;
}

interface EnvPair {
  key: string;
  value: string;
}

function downloadCompose(content: string) {
  const blob = new Blob([content], { type: 'text/yaml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'docker-compose.yml';
  anchor.click();
  URL.revokeObjectURL(url);
}

function generateComposeYaml(input: {
  includeApp: boolean;
  includePostgres: boolean;
  includeRedis: boolean;
  includeNginx: boolean;
  appPort: string;
  dbName: string;
  env: EnvPair[];
  enableVolumes: boolean;
  enableRestartPolicy: boolean;
}) {
  const envLines = input.env
    .filter((pair) => pair.key.trim().length > 0)
    .map((pair) => `      ${pair.key}: ${pair.value || '""'}`)
    .join('\n');

  const restartLine = input.enableRestartPolicy ? '    restart: unless-stopped\n' : '';
  const volumesLine = input.enableVolumes ? '    volumes:\n      - ./:/app\n' : '';

  const appService = input.includeApp
    ? `  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "${input.appPort}:${input.appPort}"
${restartLine}${volumesLine}${envLines ? `    environment:\n${envLines}\n` : ''}`
    : '';

  const postgresService = input.includePostgres
    ? `  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: ${input.dbName}
      POSTGRES_USER: platform_user
      POSTGRES_PASSWORD: dev_secret
    ports:
      - "5432:5432"
${input.enableVolumes ? '    volumes:\n      - postgres_data:/var/lib/postgresql/data\n' : ''}${restartLine}`
    : '';

  const redisService = input.includeRedis
    ? `  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
${restartLine}`
    : '';

  const nginxService = input.includeNginx
    ? `  nginx:
    image: nginx:1.27-alpine
    depends_on:
      - app
    ports:
      - "80:80"
    volumes:
      - ./infra/nginx.conf:/etc/nginx/conf.d/default.conf:ro
${restartLine}`
    : '';

  const volumeSection = input.enableVolumes && input.includePostgres ? '\nvolumes:\n  postgres_data:\n' : '';

  return `version: "3.9"

services:
${[appService, postgresService, redisService, nginxService].filter(Boolean).join('\n')}${volumeSection}`;
}

export function ComposeGenerator({ prefill, onGenerated }: ComposeGeneratorProps) {
  const [includeApp, setIncludeApp] = useState(true);
  const [includePostgres, setIncludePostgres] = useState(true);
  const [includeRedis, setIncludeRedis] = useState(false);
  const [includeNginx, setIncludeNginx] = useState(false);
  const [appPort, setAppPort] = useState('3000');
  const [dbName, setDbName] = useState('platform_db');
  const [env, setEnv] = useState<EnvPair[]>([
    { key: 'NODE_ENV', value: 'development' },
    { key: 'LOG_LEVEL', value: 'info' },
  ]);
  const [enableVolumes, setEnableVolumes] = useState(true);
  const [enableRestartPolicy, setEnableRestartPolicy] = useState(true);
  const [composeYaml, setComposeYaml] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorValue, setEditorValue] = useState('');

  useEffect(() => {
    if (!prefill?.resourceType) {
      return;
    }

    if (prefill.resourceType === 'postgres') {
      setIncludePostgres(true);
      setIncludeApp(true);
      setIncludeRedis(false);
      setDbName('postgres_main');
    }

    if (prefill.resourceType === 'redis') {
      setIncludeRedis(true);
      setIncludeApp(true);
      setIncludePostgres(false);
    }
  }, [prefill?.resourceType]);

  const canAct = useMemo(() => composeYaml.length > 0, [composeYaml.length]);

  const updateEnvAt = (idx: number, key: 'key' | 'value', value: string) => {
    setEnv((prev) => prev.map((pair, index) => (index === idx ? { ...pair, [key]: value } : pair)));
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateComposeYaml({
        includeApp,
        includePostgres,
        includeRedis,
        includeNginx,
        appPort,
        dbName,
        env,
        enableVolumes,
        enableRestartPolicy,
      });
      setComposeYaml(generated);
      setEditorValue(generated);
      onGenerated(generated);
      setIsGenerating(false);
    }, 1500);
  };

  return (
    <div className="pt-6 space-y-6">
      <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base">Docker Compose Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 rounded-md border border-border p-3">
              <Label className="text-sm">Include services</Label>
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={includeApp} onCheckedChange={(v) => setIncludeApp(Boolean(v))} /> App</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={includePostgres} onCheckedChange={(v) => setIncludePostgres(Boolean(v))} /> Postgres</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={includeRedis} onCheckedChange={(v) => setIncludeRedis(Boolean(v))} /> Redis</label>
                <label className="flex items-center gap-2 text-sm"><Checkbox checked={includeNginx} onCheckedChange={(v) => setIncludeNginx(Boolean(v))} /> Nginx</label>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label>App Port</Label>
                <Input value={appPort} onChange={(e) => setAppPort(e.target.value)} placeholder="3000" />
              </div>
              <div className="space-y-2">
                <Label>Database Name</Label>
                <Input value={dbName} onChange={(e) => setDbName(e.target.value)} placeholder="platform_db" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Environment Variables</Label>
              <Button size="sm" variant="outline" onClick={() => setEnv((prev) => [...prev, { key: '', value: '' }])}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {env.map((pair, idx) => (
                <div className="grid grid-cols-2 gap-2" key={`${idx}-${pair.key}`}>
                  <Input placeholder="KEY" value={pair.key} onChange={(e) => updateEnvAt(idx, 'key', e.target.value)} />
                  <Input placeholder="value" value={pair.value} onChange={(e) => updateEnvAt(idx, 'value', e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label className="text-sm">Enable volumes</Label>
              <Switch checked={enableVolumes} onCheckedChange={setEnableVolumes} />
            </div>
            <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <Label className="text-sm">Enable restart policy</Label>
              <Switch checked={enableRestartPolicy} onCheckedChange={setEnableRestartPolicy} />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate docker-compose.yml
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Generated docker-compose.yml</CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!canAct}
                onClick={async () => {
                  await navigator.clipboard.writeText(composeYaml);
                  toast({ title: 'Copied', description: 'Compose YAML copied.' });
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
                  downloadCompose(composeYaml);
                  toast({ title: 'Downloaded', description: 'Compose file downloaded.' });
                }}
              >
                <Download className="mr-2 h-3.5 w-3.5" />
                Download
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!canAct}
                onClick={() => toast({ title: 'Saved to path', description: 'Saved docker-compose.yml to local path (mock).' })}
              >
                <Save className="mr-2 h-3.5 w-3.5" />
                Save to path
              </Button>
              <Button size="sm" variant="outline" disabled={!canAct} onClick={() => setEditorOpen(true)}>
                <FileCode2 className="mr-2 h-3.5 w-3.5" />
                Open in Editor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[94%]" />
              <Skeleton className="h-4 w-[86%]" />
              <Skeleton className="h-4 w-[81%]" />
              <Skeleton className="h-4 w-[77%]" />
            </div>
          ) : (
            <pre className="max-h-[280px] overflow-auto rounded-md border border-border bg-muted/30 p-4 text-xs leading-6">
              <code className="font-mono">{composeYaml || '# Generate docker-compose.yml to preview AI output'}</code>
            </pre>
          )}
        </CardContent>
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit docker-compose.yml</DialogTitle>
          </DialogHeader>
          <div className="h-[60vh]">
            <CodeEditor
              language="yaml"
              title="docker-compose.yml"
              value={editorValue}
              onChange={setEditorValue}
              onSave={() => {
                setComposeYaml(editorValue);
                onGenerated(editorValue);
                toast({ title: 'Saved successfully', description: 'Compose content updated in mock project files.' });
                setEditorOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
