import React from 'react';
import type { Plan, Usage } from '../types';
import { cx } from './ui';

interface UsageMeterProps {
  usage: Usage;
  plan: Plan;
  compact?: boolean;
}

/** Usage as a sentence with a thin bar under it, the way the sidebar draws it. */
export function UsageMeter({ usage, plan, compact }: UsageMeterProps) {
  if (usage.unlimited) {
    return (
      <p className="text-ui text-ink-2">
        <span className="font-medium text-ink">Unlimited</span> transcriptions
      </p>
    );
  }

  const limit = usage.limit ?? 0;
  const pct = limit > 0 ? Math.min(100, Math.round((usage.used / limit) * 100)) : 0;
  const remaining = usage.remaining ?? 0;
  // Red once the allowance is spent, amber when one is left, ink otherwise.
  const barColor = remaining === 0 ? 'bg-danger' : remaining <= 1 ? 'bg-warn' : 'bg-ink';
  const label = plan === 'FREE' ? 'free transcriptions' : 'transcriptions this month';

  return (
    <div className={compact ? 'w-full' : 'w-full max-w-md'}>
      <p className="text-ui text-ink-2">
        <span className="tnum font-medium text-ink">{usage.used} of {limit}</span> {label} used
        {!compact && (
          <>
            , <span className="tnum font-medium text-ink">{remaining}</span> left
          </>
        )}
      </p>
      <span className="mt-2 block h-1 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <span className={cx('block h-full rounded-full', barColor)} style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
