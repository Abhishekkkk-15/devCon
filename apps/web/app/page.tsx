"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Box, Cpu, HardDrive, ArrowRight, Sparkles, Server } from "lucide-react";
import { CPUChart } from "@/components/dashboard/cpu-chart";
import { container_service } from "@/service/container/container.service";
import { system_service } from "@/service/system/system.service";
import { Resource } from "@/types/resource";
import { SystemStats } from "@/types/system";

export default function DashboardPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [cpuHistory, setCpuHistory] = useState<Array<{ time: string; cpu: number }>>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const [resourceRes, systemRes] = await Promise.all([
        container_service.getResources(),
        system_service.getSystemStats(),
      ]);

      setResources(resourceRes.data.resources);
      setSystemStats(systemRes.data.stats);
      setCpuHistory((prev) => [
        ...prev.slice(-11),
        {
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          cpu: Number(systemRes.data.stats.cpu.usage_percent.toFixed(1)),
        },
      ]);
    };

    void fetchDashboardData();
    const interval = window.setInterval(() => {
      void fetchDashboardData();
    }, 10000);

    return () => window.clearInterval(interval);
  }, []);

  const runningCount = useMemo(
    () => resources.filter((resource) => resource.status === "RUNNING").length,
    [resources]
  );

  const stats = [
    {
      title: "Total Resources",
      value: String(resources.length),
      icon: Box,
      description: `${runningCount} active workloads`,
    },
    {
      title: "Running Containers",
      value: String(runningCount),
      icon: Activity,
      description: `${Math.max(resources.length - runningCount, 0)} idle or stopped`,
    },
    {
      title: "CPU Pressure",
      value: systemStats ? `${Math.round(systemStats.cpu.usage_percent)}%` : "--",
      icon: Cpu,
      description: systemStats ? systemStats.cpu.model : "Waiting for host metrics",
    },
    {
      title: "Memory Footprint",
      value: systemStats ? `${systemStats.memory.used_gb.toFixed(1)} GB` : "--",
      icon: HardDrive,
      description: systemStats
        ? `of ${systemStats.memory.total_gb.toFixed(1)} GB on host`
        : "Waiting for host metrics",
    },
  ];

  const activeResources = resources.slice(0, 4);

  return (
    <div className="section-shell space-y-8 animate-in fade-in duration-500">
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Welcome Box / Hero Bento */}
        <div className="md:col-span-2 surface-panel px-6 py-8 sm:px-8 sm:py-10 bg-white border border-black/5 rounded-2xl shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/[0.02] to-transparent flex translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          <div className="space-y-4 relative z-10">
            <p className="eyebrow flex items-center gap-2 text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Command Center
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Operate your local Docker environment without losing the thread.
            </h1>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">
              Watch host pressure, keep resource state visible, and move directly into the containers that need work.
            </p>
          </div>
        </div>

        {/* Live Fleet Bento */}
        <div className="surface-card p-6 flex flex-col justify-center border border-black/5 rounded-2xl shadow-sm bg-white">
          <div className="flex items-center justify-between mb-4">
            <p className="eyebrow text-muted-foreground">Live Fleet</p>
            <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center">
              <Server className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-5xl font-semibold text-foreground tracking-tight">{runningCount}</p>
          <p className="mt-2 text-sm text-muted-foreground">containers actively serving traffic or workloads</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="surface-card group hover:border-black/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="rounded-lg bg-black/5 p-2 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-foreground tracking-tight">{stat.value}</div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="surface-card hover:border-black/10">
          <CardHeader className="flex flex-row items-center justify-between border-b border-black/5 pb-4 mb-4">
            <div>
              <p className="eyebrow mb-1 text-muted-foreground">Telemetry</p>
              <CardTitle className="text-xl text-foreground">CPU usage over time</CardTitle>
            </div>
            <div className="rounded-full bg-black/5 px-3 py-1 text-xs font-medium text-muted-foreground">
              {systemStats ? `${systemStats.cpu.cores} cores` : "Collecting"}
            </div>
          </CardHeader>
          <CardContent>
            <CPUChart data={cpuHistory.length > 0 ? cpuHistory : undefined} />
          </CardContent>
        </Card>

        <Card className="surface-card hover:border-black/10 flex flex-col">
          <CardHeader className="border-b border-black/5 pb-4 mb-4">
            <p className="eyebrow mb-1 text-muted-foreground">Attention Queue</p>
            <CardTitle className="text-xl text-foreground">Recent resources</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3">
            {activeResources.length > 0 ? (
              activeResources.map((resource) => (
                <div
                  key={resource.id}
                  className="group flex items-center justify-between rounded-xl border border-black/5 bg-white px-4 py-3 hover:border-black/10 hover:shadow-sm transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 relative">
                    <div className="absolute -left-1 w-[2px] h-0 bg-primary transition-all group-hover:h-full group-hover:-left-4 rounded-r-md" />
                    <div>
                      <p className="font-medium text-foreground text-sm">{resource.name}</p>
                      <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground mt-0.5">
                        {resource.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      {resource.status}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 group-hover:text-foreground transition-all" />
                  </div>
                </div>
              ))
            ) : (
               <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-black/10 bg-black/[0.02] p-8 text-center text-sm text-muted-foreground">
                No resources available yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
