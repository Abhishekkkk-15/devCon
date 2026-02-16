'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Cpu, Database, Radio, Play, Square, Trash2, Sparkles } from 'lucide-react';
import { Resource } from '@/app/resources/page';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ResourceCardProps {
  resource: Resource;
  onStart: (id: string) => void;
  onStop: (id: string) => void;
  onDelete: (id: string) => void;
  onGenerateWithAi: (resource: Resource) => void;
}

const typeIcons = {
  compute: Cpu,
  postgres: Database,
  redis: Radio,
};

const typeLabels = {
  compute: 'Compute',
  postgres: 'PostgreSQL',
  redis: 'Redis',
};

const statusColors = {
  CREATING: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  RUNNING: 'bg-green-500/10 text-green-500 border-green-500/20',
  STOPPED: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
  ERROR: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function ResourceCard({ resource, onStart, onStop, onDelete, onGenerateWithAi }: ResourceCardProps) {
  const Icon = typeIcons[resource.type];
  const isRunning = resource.status === 'RUNNING';
  const isStopped = resource.status === 'STOPPED';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{resource.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                {typeLabels[resource.type]}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={statusColors[resource.status]}>
            {resource.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">CPU</span>
              <span className="font-medium">{resource.cpu}% of {resource.cpuLimit}</span>
            </div>
            <Progress value={resource.cpu} className="h-2" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Memory</span>
              <span className="font-medium">{resource.memory}% of {resource.memoryLimit}</span>
            </div>
            <Progress value={resource.memory} className="h-2" />
          </div>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Created {formatDistanceToNow(new Date(resource.createdAt), { addSuffix: true })}
          </p>
        </div>

        <Button variant="secondary" size="sm" className="w-full" onClick={() => onGenerateWithAi(resource)}>
          <Sparkles className="w-3 h-3 mr-2" />
          Generate with AI
        </Button>

        <div className="flex gap-2">
          {isStopped && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onStart(resource.id)}
            >
              <Play className="w-3 h-3 mr-1" />
              Start
            </Button>
          )}
          {isRunning && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onStop(resource.id)}
            >
              <Square className="w-3 h-3 mr-1" />
              Stop
            </Button>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <span className="font-semibold">{resource.name}</span>? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(resource.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
