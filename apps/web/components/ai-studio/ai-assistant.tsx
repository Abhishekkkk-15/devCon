'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Save, ArrowDownToLine } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { ChatMessage } from '@/types/ai-studio';

interface AiAssistantProps {
  onInsert: (content: string) => void;
}

const examplePrompts = [
  'Why is my container restarting?',
  'Optimize this Dockerfile',
  'Add Redis to my compose file',
  'Explain multi-stage builds',
];

function createMockAssistantResponse(prompt: string) {
  const normalized = prompt.toLowerCase();

  if (normalized.includes('restarting')) {
    return `Frequent restart loops usually come from one of three causes: process exits immediately, a failing healthcheck, or dependency startup race. Start by checking container exit code and app logs, then confirm healthcheck intervals are realistic. In compose, add a retry-capable wait strategy for database dependencies before app boot.`;
  }

  if (normalized.includes('optimize') && normalized.includes('dockerfile')) {
    return `Use a multi-stage build with a dependency cache boundary. Copy only lockfiles first, install dependencies, then copy source. Set NODE_ENV=production in the runtime stage and run as a non-root user. Keep image base minimal (alpine/slim) and remove build toolchains from final stage.`;
  }

  if (normalized.includes('add redis')) {
    return `Add a redis service with image redis:7-alpine, expose port 6379, and set REDIS_URL=redis://redis:6379 in the app environment. If persistence is needed, mount a named volume and configure appendonly yes. Also add depends_on: [redis] for the app service.`;
  }

  if (normalized.includes('multi-stage')) {
    return `Multi-stage builds separate build and runtime concerns. You compile or bundle in the builder stage, then copy only production artifacts to the runner stage. This reduces image size, improves security posture, and shortens deployment pull times.`;
  }

  return `For this setup, validate base images, dependency install layers, runtime command, and network wiring between services. If you share your Dockerfile or compose YAML, I can propose a concrete patch tailored to your stack.`;
}

async function typeMessage(
  fullText: string,
  onPartial: (partial: string) => void
) {
  for (let i = 1; i <= fullText.length; i += 1) {
    onPartial(fullText.slice(0, i));
    await new Promise((resolve) => setTimeout(resolve, 8));
  }
}

export function AiAssistant({ onInsert }: AiAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);

  const isTyping = useMemo(() => typingMessageId !== null, [typingMessageId]);

  const sendPrompt = async (prompt: string) => {
    if (!prompt.trim()) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString(),
    };

    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setInput('');
    setTypingMessageId(assistantMessage.id);

    const fullResponse = createMockAssistantResponse(prompt);

    await typeMessage(fullResponse, (partial) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessage.id
            ? { ...message, content: partial }
            : message
        )
      );
    });

    setTypingMessageId(null);
  };

  return (
    <Card className="h-full border-border/70 bg-card/70 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">AI Assistant (DevOps Helper)</CardTitle>
      </CardHeader>
      <CardContent className="h-[70vh] flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {examplePrompts.map((prompt) => (
            <Button key={prompt} size="sm" variant="outline" onClick={() => void sendPrompt(prompt)}>
              {prompt}
            </Button>
          ))}
        </div>

        <div className="flex-1 overflow-auto rounded-md border border-border bg-muted/20 p-3 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ask the assistant for Dockerfile and Compose guidance. Responses are locally mocked.</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${message.role === 'user' ? 'bg-secondary text-secondary-foreground' : 'bg-primary/10 border border-primary/20'}`}>
                  <p className="whitespace-pre-wrap">{message.content || 'Typing...'}</p>
                  {message.role === 'assistant' && message.content.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={async () => { await navigator.clipboard.writeText(message.content); toast({ title: 'Copied response', description: 'Assistant response copied to clipboard.' }); }}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => { onInsert(message.content); toast({ title: 'Inserted into editor', description: 'Response appended to selected project file.' }); }}>
                        <ArrowDownToLine className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => toast({ title: 'Snippet saved', description: 'Snippet saved locally (mock).' })}>
                        <Save className="h-3.5 w-3.5" />
                      </Button>
                      {typingMessageId === message.id && (
                        <Badge variant="secondary" className="text-[10px]">Typing</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            void sendPrompt(input);
          }}
        >
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about Docker, Compose, or build optimization..." />
          <Button type="submit" disabled={isTyping || input.trim().length === 0}>Send</Button>
        </form>
      </CardContent>
    </Card>
  );
}
