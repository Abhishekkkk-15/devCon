"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Circle, Server, Monitor, ShieldCheck, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { system_service } from "@/service/system/system.service";
import { SystemStats } from "@/types/system";
import { container_service } from "@/service/container/container.service";
import { Resource } from "@/types/resource";
import { toast } from "@/hooks/use-toast";

const installCommand = `docker build -t devcon-agent ./apps/agent
docker run -d --name devcon-agent \\
  -p 8080:8080 \\
  -v /var/run/docker.sock:/var/run/docker.sock \\
  devcon-agent server`;

export default function AgentsPage() {
  const [stats, setStats] = useState<SystemStats>();
  const [resources, setResources] = useState<Resource[]>([]);
  const { getSystemStats } = system_service;
  const [loading, setLoading] = useState(false);

  const uptime = useMemo(() => {
    if (!stats?.host.uptime_seconds) {
      return "--";
    }

    const totalHours = Math.floor(stats.host.uptime_seconds / 3600);
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    const minutes = Math.floor((stats.host.uptime_seconds % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
  }, [stats?.host.uptime_seconds]);

  async function fetchStats() {
    setLoading(true);
    try {
      const [systemRes, resourceRes] = await Promise.all([
        getSystemStats(),
        container_service.getResources(),
      ]);
      setStats(systemRes.data.stats);
      setResources(resourceRes.data.resources);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchStats();
  }, []);

  if (!stats) {
    return <div className="section-shell text-sm text-muted-foreground">Loading agent status...</div>;
  }

  return (
    <div className="section-shell space-y-6">
      <section className="surface-panel px-6 py-7 sm:px-8 sm:py-8">
        <div className="max-w-3xl space-y-4">
          <p className="eyebrow">Agent Surface</p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Keep the local bridge visible and trustworthy.
          </h1>
          <p className="text-sm leading-7 text-muted-foreground sm:text-base">
            The agent is the runtime handshake between your machine and the control plane. This view should read like operator telemetry, not a setup wizard.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="surface-card border-white/10 bg-white/5">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                  <Server className="h-5 w-5 text-sky-100" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-white">Local Agent</CardTitle>
                  <CardDescription className="mt-1 text-muted-foreground">
                    {stats.host.hostname}
                  </CardDescription>
                </div>
              </div>
              <Badge className="border border-emerald-400/20 bg-emerald-500/10 text-emerald-100">
                <Circle className="mr-2 h-2.5 w-2.5 fill-current" />
                Connected
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              { label: "Mode", value: "Local Development" },
              { label: "Operating System", value: stats.host.platform },
              { label: "Agent Version", value: "local build" },
              { label: "Uptime", value: uptime },
              { label: "Resources Managed", value: `${resources.length} containers` },
              { label: "Last Heartbeat", value: loading ? "Refreshing..." : "Live" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-card border-white/10 bg-white/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                <Monitor className="h-5 w-5 text-sky-200" />
              </div>
              <div>
                <CardTitle className="text-2xl text-white">Host Capacity</CardTitle>
                <CardDescription className="mt-1 text-muted-foreground">
                  Real-time pressure on the machine backing the agent
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              {
                label: "CPU",
                value: `${stats.cpu.cores} cores`,
                detail: `${Math.floor(stats.cpu.usage_percent)}% utilized`,
                width: `${Math.floor(stats.cpu.usage_percent)}%`,
              },
              {
                label: "Memory",
                value: `${Math.floor(stats.memory.total_gb)} GB`,
                detail: `${Math.floor(stats.memory.used_gb)} GB / ${Math.floor(stats.memory.total_gb)} GB`,
                width: `${Math.floor(stats.memory.used_percent)}%`,
              },
              {
                label: "Disk",
                value: `${Math.floor(stats.disk.total_gb)} GB`,
                detail: `${Math.floor(stats.disk.used_gb)} GB / ${Math.floor(stats.disk.total_gb)} GB`,
                width: `${Math.floor(stats.disk.used_percent)}%`,
              },
            ].map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-white">{item.value}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-300" style={{ width: item.width }} />
                </div>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card className="surface-card border-white/10 bg-white/5">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Bootstrap</p>
            <CardTitle className="mt-2 text-2xl text-white">Install agent on another machine</CardTitle>
            <CardDescription className="mt-2 text-muted-foreground">
              Use the same runtime contract everywhere so local environments stay predictable.
            </CardDescription>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-muted-foreground">
            Socket mount required
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0d0b09] p-5">
            <pre className="overflow-x-auto text-sm leading-7 text-zinc-200">
              <code className="font-mono whitespace-pre-wrap">{installCommand}</code>
            </pre>
            <Button
              size="sm"
              variant="secondary"
              className="absolute right-4 top-4 rounded-2xl border border-white/10 bg-white/10 text-white hover:bg-white/15"
              onClick={() => {
                navigator.clipboard.writeText(installCommand);
                toast({ title: "Copied", description: "Agent bootstrap command copied." });
              }}
            >
              <Copy className="mr-2 h-3.5 w-3.5" />
              Copy
            </Button>
          </div>

          <div className="flex items-start gap-3 rounded-2xl border border-emerald-400/10 bg-emerald-500/5 p-4 text-sm text-emerald-100">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
            Build the local agent image from `apps/agent/Dockerfile`, then run it with the Docker socket mounted so the web UI can manage local containers and compose-backed resources.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
