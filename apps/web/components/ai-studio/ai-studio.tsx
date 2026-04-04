'use client';

import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, X, FileJson, Box, MessageSquare, Files, ChevronRight } from 'lucide-react';
import { DockerfileGenerator } from '@/components/ai-studio/dockerfile-generator';
import { ComposeGenerator } from '@/components/ai-studio/compose-generator';
import { AiAssistant } from '@/components/ai-studio/ai-assistant';
import { CodeEditor } from '@/components/ai-studio/code-editor';
import { useAiStudio, type AiStudioPrefill, type StudioTab } from '@/components/ai-studio/ai-studio-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
    <TooltipProvider>
      <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
        {/* Top Header */}
        <header className="h-14 border-b border-border px-4 flex items-center justify-between bg-card/50 backdrop-blur-md z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-md bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm tracking-tight">{title}</span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer transition-colors">Projects</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">Infrastructure</span>
              <ChevronRight className="h-3 w-3" />
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">{selectedPath}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'modal' && (
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Vertical Activity Bar */}
          <nav className="w-14 border-r border-border flex flex-col items-center py-4 bg-muted/20 gap-4">
            <ActivityBarItem
              icon={<FileJson className="h-5 w-5" />}
              label="Dockerfile"
              active={activeTab === 'dockerfile'}
              onClick={() => setActiveTab('dockerfile')}
            />
            <ActivityBarItem
              icon={<Box className="h-5 w-5" />}
              label="Docker Compose"
              active={activeTab === 'compose'}
              onClick={() => setActiveTab('compose')}
            />
            <ActivityBarItem
              icon={<MessageSquare className="h-5 w-5" />}
              label="AI Assistant"
              active={activeTab === 'assistant'}
              onClick={() => setActiveTab('assistant')}
            />
            <div className="mt-auto pt-4 border-t border-border flex flex-col items-center gap-4 w-full">
              <ActivityBarItem
                icon={<Files className="h-5 w-5" />}
                label="Explorer"
                active={false}
                onClick={() => {}}
              />
            </div>
          </nav>

          {/* Sidebar / Configuration Pane */}
          <aside className="w-[400px] border-r border-border bg-card/30 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-5 custom-scrollbar">
              {activeTab === 'dockerfile' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold">Dockerfile Generation</h2>
                    <p className="text-xs text-muted-foreground">Configure your application runtime and environment.</p>
                  </div>
                  <DockerfileGenerator
                    onGenerated={(content) => {
                      saveGeneratedToFile('dockerfile', content);
                      toast({ title: 'Dockerfile generated', description: 'Mock AI output inserted into project files.' });
                    }}
                  />
                </div>
              )}

              {activeTab === 'compose' && (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-sm font-semibold">Docker Compose</h2>
                    <p className="text-xs text-muted-foreground">Define multi-container orchestration for your stack.</p>
                  </div>
                  <ComposeGenerator
                    prefill={prefill}
                    onGenerated={(content) => {
                      saveGeneratedToFile('compose', content);
                      toast({ title: 'Compose generated', description: 'Mock AI output inserted into project files.' });
                    }}
                  />
                </div>
              )}

              {activeTab === 'assistant' && (
                <div className="h-full flex flex-col">
                  <div className="space-y-1 mb-4">
                    <h2 className="text-sm font-semibold">DevOps Assistant</h2>
                    <p className="text-xs text-muted-foreground">Chat with AI to refine your DevOps configurations.</p>
                  </div>
                  <div className="flex-1 min-h-0">
                    <AiAssistant onInsert={insertIntoSelectedFile} />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom File Explorer in Sidebar */}
            <div className="h-48 border-t border-border flex flex-col bg-muted/10">
              <div className="px-4 py-2 border-b border-border flex items-center justify-between bg-muted/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Workspace Files</span>
                <Badge variant="outline" className="text-[9px] h-4 px-1">MOCK</Badge>
              </div>
              <div className="flex-1 overflow-auto p-2 space-y-1">
                {fileList.map((file) => (
                  <button
                    key={file.path}
                    type="button"
                    onClick={() => selectFile(file.path)}
                    className={cn(
                      'w-full flex items-center justify-between rounded px-2.5 py-1.5 text-left transition-all group',
                      selectedPath === file.path
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <FileJson className={cn("h-3.5 w-3.5", selectedPath === file.path ? "text-primary" : "text-muted-foreground")} />
                      <span className="font-mono text-[11px] truncate">{file.path}</span>
                    </div>
                    <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {new Date(file.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Editor Pane */}
          <main className="flex-1 bg-muted/5 flex flex-col overflow-hidden">
            <div className="flex-1 p-4 overflow-hidden">
              <CodeEditor
                language={language}
                title={selectedPath}
                value={selectedFile?.content ?? ''}
                onChange={(nextValue) => updateFile(selectedPath, nextValue)}
                onSave={() => toast({ title: 'Saved successfully', description: `${selectedPath} updated in mock file system.` })}
              />
            </div>
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}

function ActivityBarItem({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <Tooltip delayDuration={300}>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          className={cn(
            "h-10 w-10 flex items-center justify-center rounded-lg transition-all duration-200",
            active 
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105" 
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
