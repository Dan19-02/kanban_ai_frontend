import {
  ListTodo, CheckCircle2, Flame, Users, ShieldCheck, AlertTriangle, Workflow,
  OctagonAlert, CircleHelp, type LucideIcon,
} from 'lucide-react';
import type { Board } from '../types';

export type SummaryKey =
  | 'tasks' | 'done' | 'high' | 'people'
  | 'decisions' | 'risks' | 'blockers' | 'dependencies' | 'questions';

interface Stat {
  key: SummaryKey;
  icon: LucideIcon;
  label: string;
  value: number;
  color: string;
}

interface BoardSummaryBarProps {
  board: Board;
  /** Currently-active board filter chip, highlighted. */
  activeKey?: SummaryKey | null;
  /** Called when a chip is clicked. */
  onSelect?: (key: SummaryKey) => void;
}

/** Compact at-a-glance stats for a board. Each chip is clickable: board chips
 *  filter the Kanban; AI-Brain chips jump to that section of the analysis. */
export function BoardSummaryBar({ board, activeKey, onSelect }: BoardSummaryBarProps) {
  const items = board.actionItems ?? [];

  const stats: Stat[] = [
    { key: 'tasks', icon: ListTodo, label: 'Tasks', value: items.length, color: 'text-slate-500 dark:text-slate-400' },
    { key: 'done', icon: CheckCircle2, label: 'Done', value: items.filter((i) => i.status === 'completed').length, color: 'text-emerald-500' },
    { key: 'high', icon: Flame, label: 'High', value: items.filter((i) => i.priority === 'High').length, color: 'text-red-500' },
    { key: 'blockers', icon: OctagonAlert, label: 'Blockers', value: board.blockers?.length ?? 0, color: 'text-red-600' },
    { key: 'people', icon: Users, label: 'People', value: new Set(items.map((i) => i.assignee)).size, color: 'text-indigo-500' },
    { key: 'decisions', icon: ShieldCheck, label: 'Decisions', value: board.keyDecisions?.length ?? 0, color: 'text-sky-500' },
    { key: 'risks', icon: AlertTriangle, label: 'Risks', value: board.risks?.length ?? 0, color: 'text-amber-500' },
    { key: 'dependencies', icon: Workflow, label: 'Dependencies', value: board.dependencies?.length ?? 0, color: 'text-violet-500' },
    { key: 'questions', icon: CircleHelp, label: 'Questions', value: board.openQuestions?.length ?? 0, color: 'text-fuchsia-500' },
  ];

  return (
    <div className="flex items-center justify-between gap-2 w-full overflow-x-auto pb-2 shrink-0">
      {stats.map(({ key, icon: Icon, label, value, color }) => {
        const active = activeKey === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect?.(key)}
            title={`Show ${label}`}
            className={`flex items-center gap-2 shrink-0 px-3 py-1.5 rounded-lg border shadow-sm transition-colors ${
              active
                ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-600 ring-1 ring-indigo-300 dark:ring-indigo-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <Icon className={`w-4 h-4 ${color}`} />
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">{value}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
