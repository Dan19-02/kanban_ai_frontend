import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { ActionItem, Comment } from '../types';
import { dueInfo, isUnassigned } from '../lib/format';
import { Initials, Segmented, EmptyPage } from '../ui/bits';
import { Button } from '../ui/Button';
import { Select, controlClass } from '../ui/Field';
import { TaskRow, type Waiting } from './TaskRow';
import { TaskSheet } from './TaskSheet';

type GroupBy = 'assignee' | 'priority' | 'dueDate';
export type TaskFilter = 'all' | 'open' | 'completed' | 'high';

interface TaskLanesProps {
  items: ActionItem[];
  canEdit: boolean;
  filter: TaskFilter;
  onFilterChange: (filter: TaskFilter) => void;
  /** The task whose detail is open, if any. */
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** True when the open task was just created, so its title is ready to type over. */
  selectedIsNew?: boolean;
  /** Names for @mention autocomplete in a task's discussion. */
  people: string[];
  loadTaskComments: (itemId: string) => Promise<Comment[]>;
  addTaskComment: (itemId: string, text: string) => Promise<Comment[]>;
  onItemMove: (itemId: string, newAssignee: string) => void;
  onItemUpdate: (itemId: string, updates: Partial<ActionItem>) => void;
  onItemDelete: (itemId: string) => void;
}

const GROUPINGS: { value: GroupBy; label: string }[] = [
  { value: 'assignee', label: 'Person' },
  { value: 'priority', label: 'Priority' },
  { value: 'dueDate', label: 'Due date' },
];

const FILTERS: { value: TaskFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'completed', label: 'Done' },
  { value: 'high', label: 'High priority' },
];

const DUE_LANES = [
  { key: 'overdue', label: 'Overdue' },
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Next 7 days' },
  { key: 'later', label: 'Later' },
  { key: 'none', label: 'No date' },
] as const;

// The margin column and line height of a lane's ruled sheet (see TaskRow).
const SHEET = { '--margin': '3.25rem', '--line': '2.75rem' } as React.CSSProperties;

const norm = (s: string) => s.trim().toLowerCase();

/** The board: tasks as numbered, ruled entries in lanes by person, priority or due date. */
export function TaskLanes({
  items,
  canEdit,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
  selectedIsNew = false,
  people,
  loadTaskComments,
  addTaskComment,
  onItemMove,
  onItemUpdate,
  onItemDelete,
}: TaskLanesProps) {
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('assignee');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overLane, setOverLane] = useState<string | null>(null);

  // A task's number is its place in the minutes, whatever the lanes are doing.
  const numberOf = useMemo(() => new Map(items.map((it, i) => [it.id, i + 1])), [items]);
  const byTitle = useMemo(() => new Map(items.map((it, i) => [norm(it.title), { number: i + 1, item: it }])), [items]);

  const waitingFor = (item: ActionItem, includeDone = false): Waiting[] =>
    (item.blockedBy ?? []).flatMap((title) => {
      const hit = byTitle.get(norm(title));
      if (hit && hit.item.status === 'completed' && !includeDone) return []; // finished work no longer holds anything up
      return [{ number: hit ? hit.number : null, title }];
    });

  const visible = useMemo(() => {
    const query = norm(search);
    return items.filter((item) => {
      if (filter === 'open' && item.status === 'completed') return false;
      if (filter === 'completed' && item.status !== 'completed') return false;
      if (filter === 'high' && item.priority !== 'High') return false;
      return !query || norm(item.title).includes(query) || norm(item.assignee).includes(query);
    });
  }, [items, search, filter]);

  const lanes = useMemo(() => {
    if (groupBy === 'priority') {
      // Fixed lanes, so each stays a drop target even when it is empty.
      return ['High', 'Medium', 'Low', 'None'].map((key) => ({
        key,
        label: key === 'None' ? 'No priority' : key,
        items: visible.filter((i) => (i.priority ?? 'None') === key),
      }));
    }
    if (groupBy === 'dueDate') {
      return DUE_LANES.map(({ key, label }) => ({
        key,
        label,
        items: visible.filter((i) => dueInfo(i.dueDate).state === key),
      })).filter((lane) => lane.items.length > 0);
    }
    const names = Array.from(new Set(visible.map((i) => i.assignee))).sort((a, b) => {
      if (isUnassigned(a)) return 1;
      if (isUnassigned(b)) return -1;
      return a.localeCompare(b);
    });
    return names.map((key) => ({ key, label: key, items: visible.filter((i) => i.assignee === key) }));
  }, [visible, groupBy]);

  const canDrag = canEdit && groupBy !== 'dueDate';

  // Dropping a task on a lane applies that lane's value: a person reassigns it,
  // a priority sets it. The "No priority" lane is not a target, since a task's
  // priority is set or changed here, never cleared.
  const acceptsDrop = (laneKey: string) => canDrag && !(groupBy === 'priority' && laneKey === 'None');

  const handleDrop = (e: React.DragEvent, laneKey: string) => {
    e.preventDefault();
    setOverLane(null);
    setDraggingId(null);
    if (!acceptsDrop(laneKey)) return;
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;
    if (groupBy === 'assignee') onItemMove(itemId, laneKey);
    else onItemUpdate(itemId, { priority: laneKey as 'High' | 'Medium' | 'Low' });
  };

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const filtering = filter !== 'all' || search.trim() !== '';

  return (
    <div className="flex flex-1 flex-col lg:min-h-0">
      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-8">
        <div className="hidden items-center gap-x-4 gap-y-2 sm:flex sm:flex-wrap">
          <Segmented label="Group tasks by" value={groupBy} onChange={setGroupBy} options={GROUPINGS} />
          <Segmented label="Show" value={filter} onChange={onFilterChange} options={FILTERS} />
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:hidden">
          <Select aria-label="Group tasks by" value={groupBy} onChange={(e) => setGroupBy(e.target.value as GroupBy)}>
            {GROUPINGS.map((g) => (
              <option key={g.value} value={g.value}>
                By {g.label.toLowerCase()}
              </option>
            ))}
          </Select>
          <Select aria-label="Show" value={filter} onChange={(e) => onFilterChange(e.target.value as TaskFilter)}>
            {FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.value === 'all' ? 'All tasks' : f.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="relative w-full sm:ml-auto sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-ink-3" aria-hidden />
          <input
            type="search"
            aria-label="Search tasks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks or people"
            className={`${controlClass} h-9 pr-8 pl-8 sm:h-8 pointer-coarse:h-11`}
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setSearch('')}
              className="absolute top-1/2 right-1 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-[2px] text-ink-3 transition-colors duration-150 hover:bg-wash hover:text-ink"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-4 pb-8 md:px-8">
          <EmptyPage title="No tasks yet">
            {canEdit
              ? 'Paste the meeting transcript and its tasks appear here, each with an owner. You can also add one by hand.'
              : 'Tasks will appear here once this board has minutes.'}
          </EmptyPage>
        </div>
      ) : lanes.every((lane) => lane.items.length === 0) ? (
        <div className="px-4 pb-8 md:px-8">
          <EmptyPage
            title="Nothing matches"
            actions={
              filtering && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    onFilterChange('all');
                  }}
                >
                  Show all tasks
                </Button>
              )
            }
          >
            No task fits this search and filter.
          </EmptyPage>
        </div>
      ) : (
        // `relative` on each scroller keeps visually hidden labels inside it, so
        // lanes that sit off screen never widen the page.
        <div className="relative flex flex-col gap-8 px-4 pb-10 md:px-8 lg:min-h-0 lg:flex-1 lg:flex-row lg:gap-7 lg:overflow-x-auto lg:overflow-y-hidden lg:pb-0">
          {lanes.map((lane) => {
            // While a task is in the air, every lane that would take it says so.
            const target = draggingId !== null && acceptsDrop(lane.key);
            const over = target && overLane === lane.key;
            return (
              <section
                key={lane.key}
                aria-label={`${lane.label}, ${lane.items.length} ${lane.items.length === 1 ? 'task' : 'tasks'}`}
                onDragOver={(e) => {
                  if (!acceptsDrop(lane.key)) return;
                  e.preventDefault();
                  if (overLane !== lane.key) setOverLane(lane.key);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverLane(null);
                }}
                onDrop={(e) => handleDrop(e, lane.key)}
                className={`flex flex-col transition-colors duration-150 lg:min-h-0 lg:max-w-[26rem] lg:min-w-[16rem] lg:flex-1 lg:basis-0 ${
                  over ? 'bg-wash-2' : target ? 'bg-wash' : ''
                }`}
              >
                <header className="flex shrink-0 items-center gap-2 border-b border-ink pb-2">
                  {groupBy === 'assignee' && <Initials name={lane.label} />}
                  <h3 className="min-w-0 truncate font-serif text-[0.9375rem] font-semibold">{lane.label}</h3>
                  <span className="ml-auto shrink-0 text-xs text-ink-3 tabular-nums">
                    {over ? <span className="font-medium text-ink">Drop here</span> : lane.items.length}
                  </span>
                </header>
                <div className="relative flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
                  {lane.items.length === 0 ? (
                    <p className="border-b border-rule py-2.5 pl-[4.0625rem] text-sm text-ink-3">No tasks</p>
                  ) : (
                    <ol>
                      {lane.items.map((item) => (
                        <TaskRow
                          key={item.id}
                          number={numberOf.get(item.id) ?? 0}
                          title={item.title}
                          done={item.status === 'completed'}
                          priority={item.priority}
                          dueDate={item.dueDate}
                          owner={groupBy === 'assignee' ? undefined : item.assignee}
                          waitsOn={waitingFor(item)}
                          canEdit={canEdit}
                          draggable={canDrag}
                          dragging={draggingId === item.id}
                          onToggle={(done) => onItemUpdate(item.id, { status: done ? 'completed' : 'pending' })}
                          onOpen={() => onSelect(item.id)}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', item.id);
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggingId(item.id);
                          }}
                          onDragEnd={() => {
                            setDraggingId(null);
                            setOverLane(null);
                          }}
                        />
                      ))}
                    </ol>
                  )}
                  {/* The sheet stays ruled past the last entry, down to the foot of the lane. */}
                  <div aria-hidden style={SHEET} className="ledger-blank hidden min-h-11 flex-1 lg:block" />
                </div>
              </section>
            );
          })}
        </div>
      )}

      {selected && (
        <TaskSheet
          key={selected.id}
          item={selected}
          number={numberOf.get(selected.id) ?? 0}
          waitsOn={waitingFor(selected, true).map((w) => ({
            ...w,
            done: byTitle.get(norm(w.title))?.item.status === 'completed',
          }))}
          canEdit={canEdit}
          isNew={selectedIsNew}
          people={people}
          loadComments={loadTaskComments}
          addComment={addTaskComment}
          onUpdate={(updates) => onItemUpdate(selected.id, updates)}
          onDelete={() => {
            onItemDelete(selected.id);
            onSelect(null);
          }}
          onClose={() => onSelect(null)}
        />
      )}
    </div>
  );
}
