import type { Plan, Usage } from '../types';

interface UsageMeterProps {
  usage: Usage;
  plan: Plan;
}

/** How much of the plan's transcription allowance is used, as a sentence and a thin bar. */
export function UsageMeter({ usage, plan }: UsageMeterProps) {
  if (usage.unlimited) {
    return <p className="text-sm text-ink-2">Unlimited transcriptions</p>;
  }

  const limit = usage.limit ?? 0;
  const remaining = usage.remaining ?? 0;
  const pct = limit > 0 ? Math.min(100, Math.round((usage.used / limit) * 100)) : 0;
  const spent = remaining === 0;
  const period = plan === 'FREE' ? 'free transcriptions' : 'transcriptions this month';

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
      <p className={spent ? 'font-medium text-red' : 'text-ink-2'}>
        {spent ? (
          `All ${limit} ${period} used`
        ) : (
          <>
            <span className="font-semibold text-ink tabular-nums">
              {usage.used} of {limit}
            </span>{' '}
            {period} used
          </>
        )}
      </p>
      <div
        role="progressbar"
        aria-label="Transcriptions used"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={usage.used}
        className="h-1 w-28 overflow-hidden rounded-full bg-rule"
      >
        <div className={`h-full ${spent ? 'bg-red' : 'bg-ink'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
