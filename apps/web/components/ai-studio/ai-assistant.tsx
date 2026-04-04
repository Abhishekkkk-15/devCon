'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Copy, Save, ArrowDownToLine, Sparkles } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      <div className="flex flex-wrap gap-1.5">
        {examplePrompts.map((prompt) => (
          <button 
            key={prompt} 
            onClick={() => void sendPrompt(prompt)}
            className="text-[10px] px-2 py-1 rounded-full border border-border bg-muted/30 hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all text-muted-foreground font-medium"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto rounded-xl border border-border/50 bg-muted/10 p-3 space-y-4 shadow-inner custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ask about Dockerfile optimizations, multi-stage builds, or Compose networking.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[12px] leading-relaxed shadow-sm",
                message.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-tr-none" 
                  : "bg-card border border-border/50 rounded-tl-none"
              )}>
                <p className="whitespace-pre-wrap">{message.content || 'Thinking...'}</p>
                {message.role === 'assistant' && message.content.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-border/30 flex items-center gap-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-muted-foreground hover:text-primary" 
                      onClick={async () => { await navigator.clipboard.writeText(message.content); toast({ title: 'Copied', description: 'Response copied.' }); }}
                      title="Copy response"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-muted-foreground hover:text-primary" 
                      onClick={() => { onInsert(message.content); toast({ title: 'Inserted', description: 'Appended to editor.' }); }}
                      title="Insert into editor"
                    >
                      <ArrowDownToLine className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-muted-foreground hover:text-primary" 
                      onClick={() => toast({ title: 'Saved', description: 'Snippet bookmarked.' })}
                      title="Save snippet"
                    >
                      <Save className="h-3.5 w-3.5" />
                    </Button>
                    {typingMessageId === message.id && (
                      <span className="ml-auto flex h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <form
        className="flex gap-2 p-1 bg-muted/20 border border-border/50 rounded-lg focus-within:ring-1 focus-within:ring-primary/30 transition-all"
        onSubmit={(event) => {
          event.preventDefault();
          void sendPrompt(input);
        }}
      >
        <Input 
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          placeholder="Type a message..." 
          className="border-0 bg-transparent focus-visible:ring-0 text-[12px] h-9"
        />
        <Button 
          type="submit" 
          size="sm" 
          disabled={isTyping || input.trim().length === 0}
          className="h-8 w-8 p-0 rounded-md shrink-0"
        >
          <ArrowDownToLine className="h-4 w-4 rotate-[-90deg]" />
        </Button>
      </form>
    </div>
  );
}
