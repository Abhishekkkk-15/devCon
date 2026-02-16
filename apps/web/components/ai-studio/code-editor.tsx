'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save } from 'lucide-react';

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

  return (
    <Card className="h-full flex flex-col border-border/70 bg-card/80 backdrop-blur-sm">
      <CardHeader className="py-3 px-4 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className="flex items-center gap-2">
            <Button size="sm" variant={view === 'edit' ? 'default' : 'outline'} onClick={() => setView('edit')}>
              Edit
            </Button>
            <Button
              size="sm"
              variant={view === 'preview' ? 'default' : 'outline'}
              onClick={() => setView('preview')}
            >
              Preview
            </Button>
            <Button size="sm" onClick={onSave}>
              <Save className="mr-2 h-3.5 w-3.5" />
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 min-h-0 flex-1">
        {view === 'edit' ? (
          <div className="h-full grid grid-cols-[48px_1fr] font-mono text-xs">
            <pre className="m-0 h-full overflow-auto border-r border-border bg-muted/40 p-3 text-right text-muted-foreground select-none">
              {lineNumbers}
            </pre>
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              className="h-full w-full resize-none border-0 bg-background p-3 text-foreground outline-none"
              spellCheck={false}
            />
          </div>
        ) : (
          <pre className="m-0 h-full overflow-auto bg-background p-3 text-xs leading-6">
            <code className="font-mono" dangerouslySetInnerHTML={{ __html: highlightedMarkup || '&nbsp;' }} />
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
