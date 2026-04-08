'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Box,
  Cpu,
  Database,
  Radio,
  Server,
  Settings,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const primaryNavigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Resources', href: '/resources', icon: Box },
  { name: 'AI Studio', href: '/ai-studio', icon: Sparkles },
  { name: 'Agents', href: '/agents', icon: Server },
  { name: 'Settings', href: '/settings', icon: Settings },
];

const resourceFilters = [
  { name: 'Compute', href: '/resources?type=compute', icon: Cpu, type: 'compute' },
  { name: 'Postgres', href: '/resources?type=postgres', icon: Database, type: 'postgres' },
  { name: 'Redis', href: '/resources?type=redis', icon: Radio, type: 'redis' },
  { name: 'Stacks', href: '/resources?type=custom', icon: Sparkles, type: 'custom' },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeType = searchParams.get('type');

  return (
    <aside className="hidden w-[280px] shrink-0 border-r border-black/5 bg-white xl:flex xl:flex-col">
      <div className="border-b border-black/5 px-6 py-6">
        <div className="surface-card overflow-hidden bg-muted/20 p-5 border border-black/5 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Server className="h-5 w-5" />
            </div>
            <div>
              <p className="eyebrow text-muted-foreground">Local Control Plane</p>
              <h1 className="text-lg font-semibold tracking-tight text-foreground">Devcon</h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            A cleaner command center for Docker resources, local agents, and generated infrastructure.
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto px-4 py-6">
        <section className="space-y-2">
          <p className="px-3 eyebrow text-muted-foreground">
            Navigation
          </p>
          <div className="space-y-1.5">
            {primaryNavigation.map((item) => {
              const active = pathname === item.href || (item.href === '/resources' && pathname.startsWith('/resources'));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center justify-between rounded-xl px-3 py-3 text-sm transition-all',
                    active
                      ? 'bg-muted/50 text-foreground font-medium shadow-sm border border-black/5'
                      : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg border transition-colors',
                        active
                          ? 'border-black/10 bg-white text-primary shadow-sm'
                          : 'border-transparent bg-transparent text-muted-foreground group-hover:bg-white group-hover:border-black/5 group-hover:text-foreground group-hover:shadow-sm'
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span>{item.name}</span>
                  </div>
                  {active && <ArrowUpRight className="h-4 w-4 text-muted-foreground" />}
                </Link>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="px-3">
            <p className="eyebrow text-muted-foreground">
              Resource Views
            </p>
          </div>
          <div className="space-y-2">
            {resourceFilters.map((item) => {
              const active = pathname.startsWith('/resources') && activeType === item.type;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all',
                    active ? 'bg-muted/50 text-foreground font-medium shadow-sm border border-black/5' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="px-3">
          <div className="surface-card bg-muted/10 p-4 border border-black/5 rounded-xl shadow-sm">
            <p className="eyebrow text-muted-foreground">
              System Pulse
            </p>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Treat this sidebar as the operator rail: move fast between fleet health, live containers, and generated Docker config.
            </p>
          </div>
        </section>
      </div>
    </aside>
  );
}
