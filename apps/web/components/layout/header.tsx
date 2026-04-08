'use client';

import { ChevronDown, Circle, Command, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useWorkspace } from '@/components/workspace/workspace-context';

export function Header() {
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspace();

  return (
    <header className="border-b border-black/5 bg-background">
      <div className="section-shell py-4">
        <div className="surface-panel flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-11 rounded-xl border-black/5 bg-white px-4 text-sm hover:bg-muted/50"
                >
                    <span className="mr-2 text-left">
                    <span className="block text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground/80">
                      Workspace
                    </span>
                    <span className="block font-semibold text-foreground">{currentWorkspace.name}</span>
                  </span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {workspaces.map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => setCurrentWorkspace(workspace.id)}
                  >
                    {workspace.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden h-11 min-w-[240px] items-center gap-3 rounded-xl border border-black/5 bg-muted/30 px-4 text-sm text-muted-foreground md:flex">
              <Search className="h-4 w-4" />
              <span className="flex-1">Search routes, containers, or commands</span>
              <span className="rounded-lg border border-black/10 px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.16em]">
                <Command className="mr-1 inline h-3 w-3" />
                K
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge className="h-10 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 text-emerald-700 hover:bg-emerald-500/15">
              <Circle className="mr-2 h-2.5 w-2.5 fill-current" />
              Agent Connected
            </Badge>
            <Badge className="h-10 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 text-amber-700 hover:bg-amber-500/15">
              <Sparkles className="mr-2 h-3.5 w-3.5" />
              Local Mode
            </Badge>
          </div>
        </div>
      </div>
    </header>
  );
}
