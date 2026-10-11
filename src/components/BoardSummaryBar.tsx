import type { Board } from '../types';
import { Monogram, cx } from './ui';

export type SummaryKey =
  | 'tasks' | 'done' | 'high' | 'people'
  | 'decisions' | 'risks' | 'blockers' | 'dependencies' | 'questions';

interface BoardDetailsProps {
  board: Board;
  /** Names the signed-in person goes by on this board. */
  me?: string[];
  /** Currently active task filter, highlighted. */
  activeKey?: SummaryKey | null;
  /** Called when a row is clicked. */
  onSelect?: (key: SummaryKey) => void;
}

interface Row {
  key: SummaryKey;
  label: string;
  value: number;
  danger?: boolean;
}

/** The side column of a board: counts that filter the tasks or jump to a
 *  section of the notes, and who owns what. */
export function BoardDetails({ board, me, activeKey, onSelect }: BoardDetailsProps) {
  const items = board.actionItems ?? [];
  const done = items.filter((i) => i.status === 'completed').length;

  const taskRows: Row[] = [
    { key: 'tasks', label: 'All tasks', value: items.length },
    { key: 'done', label: 'Done', value: done },
    { key: 'high', label: 'High priority', value: items.filter((i) => i.priority === 'High').length },
  ];
  const noteRows = ([
    { key: 'blockers', label: 'Blockers', value: board.blockers?.length ?? 0, danger: true },
    { key: 'decisions', label: 'Decisions', value: board.keyDecisions?.length ?? 0 },
    { key: 'risks', label: 'Risks', value: board.risks?.length ?? 0 },
    { key: 'dependencies', label: 'Dependencies', value: board.dependencies?.length ?? 0 },
    { key: 'questions', label: 'Open questions', value: board.openQuestions?.length ?? 0 },
  ] as Row[]).filter((r) => r.value > 0);

  const people = Array.from(new Set(items.map((i) => i.assignee)))
    .sort((a, b) => (a === 'Unassigned' ? 1 : b === 'Unassigned' ? -1 : a.localeCompare(b)))
    .map((name) => {
      const theirs = items.filter((i) => i.assignee === name);
      return { name, open: theirs.filter((i) => i.status !== 'completed').length };
    });

  const row = ({ key, label, value, danger }: Row) => {
    const active = activeKey === key;
    return (
      <li key={key}>
        <button
          type="button"
          onClick={() => onSelect?.(key)}
          aria-pressed={active}
          className={cx(
            '-mx-2 flex h-8 w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-md px-2 text-left text-ui transition-colors',
            active ? 'bg-wash-2 font-medium text-ink' : 'text-ink-2 hover:bg-wash hover:text-ink',
          )}
        >
          <span className={cx(danger && 'text-danger')}>{label}</span>
          <span className="tnum text-ink">{value}</span>
        </button>
      </li>
    );
  };

  const heading = 'text-ui font-semibold text-ink';

  return (
    <div className="flex flex-col gap-7">
      <section aria-label="Tasks">
        <h2 className={heading}>Tasks</h2>
        <ul className="mt-1">{taskRows.map(row)}</ul>
        {items.length > 0 && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" role="img" aria-label={`${done} of ${items.length} done`}>
            <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${Math.round((done / items.length) * 100)}%` }} />
          </div>
        )}
      </section>

      {noteRows.length > 0 && (
        <section aria-label="From the meeting">
          <h2 className={heading}>From the meeting</h2>
          <ul className="mt-1">{noteRows.map(row)}</ul>
        </section>
      )}

      {people.length > 0 && (
        <section aria-label="People">
          <h2 className={heading}>People</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {people.map((p) => {
              const mine = !!me?.includes(p.name);
              return (
                <li key={p.name} className="flex items-center gap-2.5 text-ui">
                  <Monogram name={p.name} mine={mine} />
                  <span className="min-w-0 flex-1 truncate text-ink">{p.name}{mine && <span className="text-ink-3"> (you)</span>}</span>
                  <span className="tnum text-meta text-ink-3">{p.open === 0 ? 'done' : `${p.open} open`}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
