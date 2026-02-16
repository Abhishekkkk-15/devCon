'use client';

import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X } from 'lucide-react';
import { DockerfileGenerator } from '@/components/ai-studio/dockerfile-generator';
import { ComposeGenerator } from '@/components/ai-studio/compose-generator';
import { AiAssistant } from '@/components/ai-studio/ai-assistant';
import { CodeEditor } from '@/components/ai-studio/code-editor';
import { useAiStudio, type AiStudioPrefill, type StudioTab } from '@/components/ai-studio/ai-studio-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type AiStudioMode = 'page' | 'modal';

interface AiStudioProps {
  mode?: AiStudioMode;
  prefill?: AiStudioPrefill;
  onClose?: () => void;
}

function inferLanguage(path: string) {
  if (path.endsWith('.yml') || path.endsWith('.yaml') || path === '.env') {
    return 'yaml' as const;
  }
  return 'dockerfile' as const;
}

export function AiStudio({ mode = 'page', prefill, onClose }: AiStudioProps) {
  const {
    files,
    selectedPath,
    selectedFile,
    selectFile,
    updateFile,
    saveGeneratedToFile,
    insertIntoSelectedFile,
  } = useAiStudio();

  const [activeTab, setActiveTab] = useState<StudioTab>(prefill?.tab ?? 'dockerfile');

  const language = useMemo(() => inferLanguage(selectedPath), [selectedPath]);

  const fileList = useMemo(
    () => files.filter((file) => ['Dockerfile', 'docker-compose.yml', '.env'].includes(file.path)),
    [files]
  );

  const title = mode === 'modal' ? 'AI Studio Preview' : 'AI Studio';

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-background to-muted/30">
      <div className="h-16 border-b border-border px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold leading-none">{title}</h1>
            <p className="text-xs text-muted-foreground mt-1">Mocked AI generation for Docker and DevOps workflows</p>
          </div>
        </div>
        {mode === 'modal' && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        <div className="col-span-7 border-r border-border overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StudioTab)} className="h-full flex flex-col">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="dockerfile">Dockerfile</TabsTrigger>
                <TabsTrigger value="compose">Docker Compose</TabsTrigger>
                <TabsTrigger value="assistant">AI Assistant</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dockerfile" className="flex-1 overflow-auto px-6 pb-6">
              <DockerfileGenerator
                onGenerated={(content) => {
                  saveGeneratedToFile('dockerfile', content);
                  toast({ title: 'Dockerfile generated', description: 'Mock AI output inserted into project files.' });
                }}
              />
            </TabsContent>

            <TabsContent value="compose" className="flex-1 overflow-auto px-6 pb-6">
              <ComposeGenerator
                prefill={prefill}
                onGenerated={(content) => {
                  saveGeneratedToFile('compose', content);
                  toast({ title: 'Compose generated', description: 'Mock AI output inserted into project files.' });
                }}
              />
            </TabsContent>

            <TabsContent value="assistant" className="flex-1 overflow-auto px-6 pb-6">
              <AiAssistant onInsert={insertIntoSelectedFile} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="col-span-5 p-6 overflow-hidden flex flex-col gap-4">
          <Card className="border-border/70 bg-card/70 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Project Files</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {fileList.map((file) => (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => selectFile(file.path)}
                  className={cn(
                    'w-full rounded-md border px-3 py-2 text-left transition-colors',
                    selectedPath === file.path
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border bg-muted/30 hover:bg-muted/60'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs">{file.path}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {new Date(file.lastModified).toLocaleTimeString()}
                    </Badge>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <div className="min-h-0 flex-1">
            <CodeEditor
              language={language}
              title={selectedPath}
              value={selectedFile?.content ?? ''}
              onChange={(nextValue) => updateFile(selectedPath, nextValue)}
              onSave={() => toast({ title: 'Saved successfully', description: `${selectedPath} updated in mock file system.` })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
