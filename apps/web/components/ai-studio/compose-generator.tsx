'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Copy, Download, Save, Sparkles, Loader2, FileCode2, Plus, Wand2, Box } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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

    if (prefill.resourceType === 'custom') {
      setIncludeApp(false);
      setIncludePostgres(false);
      setIncludeRedis(false);
      setIncludeNginx(false);
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
    <div className="space-y-6">
      <div className="space-y-5">
        {/* Services Selection */}
        <div className="space-y-3">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Included Services</Label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'app', label: 'App', checked: includeApp, setter: setIncludeApp },
              { id: 'postgres', label: 'Postgres', checked: includePostgres, setter: setIncludePostgres },
              { id: 'redis', label: 'Redis', checked: includeRedis, setter: setIncludeRedis },
              { id: 'nginx', label: 'Nginx', checked: includeNginx, setter: setIncludeNginx },
            ].map((service) => (
              <label 
                key={service.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md border border-border/50 transition-colors cursor-pointer",
                  service.checked ? "bg-primary/5 border-primary/30" : "bg-muted/20 hover:bg-muted/40"
                )}
              >
                <Checkbox 
                  id={service.id} 
                  checked={service.checked} 
                  onCheckedChange={(v) => service.setter(Boolean(v))} 
                  className="h-4 w-4"
                />
                <span className="text-xs font-medium">{service.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Configuration Fields */}
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">App Port</Label>
            <Input 
              value={appPort} 
              onChange={(e) => setAppPort(e.target.value)} 
              placeholder="3000" 
              className="h-9 bg-background/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Database Name</Label>
            <Input 
              value={dbName} 
              onChange={(e) => setDbName(e.target.value)} 
              placeholder="platform_db" 
              className="h-9 bg-background/50"
            />
          </div>
        </div>

        {/* Env Vars */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Environment Variables</Label>
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-6 text-[10px] px-2 hover:bg-primary/10 hover:text-primary"
              onClick={() => setEnv((prev) => [...prev, { key: '', value: '' }])}
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Var
            </Button>
          </div>
          <div className="space-y-2 max-h-40 overflow-auto pr-1 custom-scrollbar">
            {env.map((pair, idx) => (
              <div className="flex gap-2" key={`${idx}-${pair.key}`}>
                <Input 
                  placeholder="KEY" 
                  value={pair.key} 
                  onChange={(e) => updateEnvAt(idx, 'key', e.target.value)} 
                  className="h-8 text-[11px] bg-background/30"
                />
                <Input 
                  placeholder="Value" 
                  value={pair.value} 
                  onChange={(e) => updateEnvAt(idx, 'value', e.target.value)} 
                  className="h-8 text-[11px] bg-background/30"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Switches */}
        <div className="grid gap-3 pt-2">
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Persistent Volumes</Label>
              <p className="text-[10px] text-muted-foreground">Keep data across restarts</p>
            </div>
            <Switch checked={enableVolumes} onCheckedChange={setEnableVolumes} className="scale-75" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
            <div className="space-y-0.5">
              <Label className="text-xs font-medium">Auto-Restart Policy</Label>
              <p className="text-[10px] text-muted-foreground">Unless-stopped strategy</p>
            </div>
            <Switch checked={enableRestartPolicy} onCheckedChange={setEnableRestartPolicy} className="scale-75" />
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
          {isGenerating ? 'Orchestrating...' : 'Generate Compose Stack'}
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
                  await navigator.clipboard.writeText(composeYaml);
                  toast({ title: 'Copied', description: 'Compose content copied.' });
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
                  downloadCompose(composeYaml);
                  toast({ title: 'Downloaded', description: 'Compose file saved.' });
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
