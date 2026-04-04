'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Save, Copy, FileCode, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  language: 'dockerfile' | 'yaml';
  title: string;
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

function highlightLine(line: string, language: 'dockerfile' | 'yaml') {
  if (language === 'dockerfile') {
    const dockerKeywords =
      /\b(FROM|RUN|CMD|LABEL|EXPOSE|ENV|ADD|COPY|ENTRYPOINT|VOLUME|USER|WORKDIR|ARG|ONBUILD|STOPSIGNAL|HEALTHCHECK|SHELL)\b/g;
    return line.replace(dockerKeywords, '<span class="text-cyan-300">$1</span>');
  }

  const yamlKeyRegex = /^(\s*)([\w.-]+:)/;
  const withYamlKey = line.replace(yamlKeyRegex, '$1<span class="text-cyan-300">$2</span>');
  return withYamlKey.replace(/("[^"]*")/g, '<span class="text-emerald-300">$1</span>');
}

export function CodeEditor({ language, title, value, onChange, onSave }: CodeEditorProps) {
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [copied, setCopied] = useState(false);

  const lineNumbers = useMemo(
    () => value.split('\n').map((_, idx) => idx + 1).join('\n'),
    [value]
  );

  const highlightedMarkup = useMemo(() => {
    return value
      .split('\n')
      .map((line) => highlightLine(line, language))
      .join('\n');
  }, [language, value]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col rounded-xl border border-border/60 bg-card/50 backdrop-blur-md overflow-hidden shadow-2xl shadow-black/20">
      {/* Editor Header */}
      <header className="h-11 px-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-background/50 border border-border/50">
            <FileCode className="h-3.5 w-3.5 text-primary" />
            <span className="text-[11px] font-mono font-medium tracking-tight truncate max-w-[150px]">{title}</span>
          </div>
          <div className="h-4 w-px bg-border/50" />
          <div className="flex gap-1">
            <button 
              onClick={() => setView('edit')}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all rounded",
                view === 'edit' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Source
            </button>
            <button 
              onClick={() => setView('preview')}
              className={cn(
                "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-all rounded",
                view === 'preview' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
            >
              Preview
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-8 w-8 text-muted-foreground hover:text-primary" 
            onClick={handleCopy}
            title="Copy content"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button 
            size="sm" 
            onClick={onSave}
            className="h-8 px-3 text-xs font-semibold gap-2 shadow-sm"
          >
            <Save className="h-3 w-3" />
            Save Changes
          </Button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex-1 min-h-0 relative">
        {view === 'edit' ? (
          <div className="h-full grid grid-cols-[48px_1fr] font-mono text-[12px] bg-background/80">
            <pre className="m-0 h-full overflow-auto border-r border-border/50 bg-muted/20 p-4 text-right text-muted-foreground/50 select-none custom-scrollbar">
              {lineNumbers}
            </pre>
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="h-full w-full resize-none border-0 bg-transparent p-4 text-foreground outline-none selection:bg-primary/20 custom-scrollbar leading-relaxed"
              spellCheck={false}
              autoFocus
            />
          </div>
        ) : (
          <div className="h-full overflow-auto bg-background/95 p-4 custom-scrollbar">
            <pre className="m-0 text-[12px] leading-relaxed">
              <code className="font-mono" dangerouslySetInnerHTML={{ __html: highlightedMarkup || '&nbsp;' }} />
            </pre>
          </div>
        )}
      </div>

      {/* Editor Footer */}
      <footer className="h-6 px-4 border-t border-border/30 bg-muted/10 flex items-center justify-between">
        <div className="flex gap-4">
          <span className="text-[9px] text-muted-foreground font-mono">Ln {value.substring(0, value.length).split('\n').length}, Col {value.length}</span>
          <span className="text-[9px] text-muted-foreground font-mono uppercase">{language}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[9px] text-muted-foreground font-medium">Ready</span>
        </div>
      </footer>
    </div>
  );
}
