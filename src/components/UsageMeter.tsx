import React from 'react';
import { Infinity as InfinityIcon } from 'lucide-react';
import type { Plan, Usage } from '../types';

interface UsageMeterProps {
  usage: Usage;
  plan: Plan;
  compact?: boolean;
}

export function UsageMeter({ usage, plan, compact }: UsageMeterProps) {
  if (usage.unlimited) {
    return (
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <InfinityIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        Unlimited transcriptions
      </div>
    );
  }

  const limit = usage.limit ?? 0;
  const pct = limit > 0 ? Math.min(100, Math.round((usage.used / limit) * 100)) : 0;
  const remaining = usage.remaining ?? 0;
  const barColor = remaining === 0 ? 'bg-red-500' : remaining <= 1 ? 'bg-amber-500' : 'bg-indigo-600';
  const label = plan === 'FREE' ? 'free transcriptions' : 'transcriptions this month';

  return (
    <div className={compact ? 'w-full' : 'w-full max-w-md'}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {usage.used} of {limit} {label} used
        </span>
        {!compact && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{remaining} left</span>
        )}
      </div>
      <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
