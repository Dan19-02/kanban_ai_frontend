import {
  ListTodo, CheckCircle2, Flame, Users, ShieldCheck, AlertTriangle, Workflow,
  type LucideIcon,
} from 'lucide-react';
import type { Board } from '../types';

interface Stat {
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
}

/** Compact at-a-glance stats for a board: counts of tasks, people, and the
 *  extracted meeting intelligence. Pure derived data — no side effects. */
export function BoardSummaryBar({ board }: { board: Board }) {
  const items = board.actionItems ?? [];

  const stats: Stat[] = [
    { icon: ListTodo, label: 'Tasks', value: items.length, color: 'text-slate-500 dark:text-slate-400' },
    { icon: CheckCircle2, label: 'Done', value: items.filter((i) => i.status === 'completed').length, color: 'text-emerald-500' },
    { icon: Flame, label: 'High', value: items.filter((i) => i.priority === 'High').length, color: 'text-red-500' },
    { icon: Users, label: 'People', value: new Set(items.map((i) => i.assignee)).size, color: 'text-indigo-500' },
    { icon: ShieldCheck, label: 'Decisions', value: board.keyDecisions?.length ?? 0, color: 'text-sky-500' },
    { icon: AlertTriangle, label: 'Risks', value: board.risks?.length ?? 0, color: 'text-amber-500' },
    { icon: Workflow, label: 'Dependencies', value: board.dependencies?.length ?? 0, color: 'text-violet-500' },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 shrink-0">
      {stats.map(({ icon: Icon, label, value, color }) => (
        <div
          key={label}
          className="flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          title={`${value} ${label}`}
        >
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{value}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{label}</span>
        </div>
      ))}
    </div>
  );
}
