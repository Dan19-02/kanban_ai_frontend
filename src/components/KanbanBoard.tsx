import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { ActionItem, Comment } from '../types';
import { MentionInput } from './MentionInput';
import { renderMentions } from '../lib/mentions';
import { GripIcon, SearchIcon } from './icons';
import {
  Button, Checkbox, Dialog, Empty, Monogram, Segmented, Spinner, Tabs, cx, inputClass,
} from './ui';

type GroupBy = 'assignee' | 'priority' | 'dueDate';
export type View = 'list' | 'board';
type ModalTab = 'details' | 'activity';

interface KanbanBoardProps {
  items: ActionItem[];
  canEdit: boolean;
  /** Optional quick filter applied alongside search. Default shows everything. */
  filter?: 'all' | 'completed' | 'high';
  /** Names for @mention autocomplete in task activity. */
  people?: string[];
  /** Names the signed-in person goes by on this board. Their tasks get the highlighter. */
  me?: string[];
  /** List or board. The page owns it so it can give the board view more room. */
  view: View;
  onViewChange: (view: View) => void;
  /** Fetch a task's comments (enables the Activity tab when provided). */
  loadTaskComments?: (itemId: string) => Promise<Comment[]>;
  /** Post a comment to a task; resolves to the updated thread. */
  addTaskComment?: (itemId: string, text: string) => Promise<Comment[]>;
  onItemMove: (itemId: string, newAssignee: string) => void;
  onItemUpdate: (itemId: string, updates: Partial<ActionItem>) => void;
  onItemDelete: (itemId: string) => void;
}

// "2026-10-15" becomes "15 Oct". Anything unparseable is shown as stored.
export function formatDue(dueDate: string): string {
  const d = new Date(`${dueDate}T00:00:00`);
  if (isNaN(d.getTime())) return dueDate;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function isOverdue(item: ActionItem): boolean {
  if (!item.dueDate || item.status === 'completed') return false;
  const d = new Date(`${item.dueDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return !isNaN(d.getTime()) && d.getTime() < today.getTime();
}

function priorityClass(priority?: string): string {
  const p = (priority || '').toLowerCase();
  if (p.includes('high') || p.includes('urgent')) return 'font-medium text-danger';
  if (p.includes('medium')) return 'text-ink-2';
  return 'text-ink-3';
}

const GROUPINGS: { key: GroupBy; label: string }[] = [
  { key: 'assignee', label: 'Person' },
  { key: 'priority', label: 'Priority' },
  { key: 'dueDate', label: 'Due date' },
];

// Bucket a due date into a coarse time band for the "Due date" grouping.
function dueBucket(dueDate?: string): { key: string; label: string } {
  if (!dueDate) return { key: 'none', label: 'No date' };
  const d = new Date(dueDate);
  if (isNaN(d.getTime())) return { key: 'none', label: 'No date' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return { key: 'overdue', label: 'Overdue' };
  if (days === 0) return { key: 'today', label: 'Today' };
  if (days <= 7) return { key: 'week', label: 'This week' };
  return { key: 'later', label: 'Later' };
}

const DUE_ORDER = ['overdue', 'today', 'week', 'later', 'none'] as const;

export function KanbanBoard({
  items, canEdit, filter = 'all', people, me, view, onViewChange, loadTaskComments, addTaskComment,
  onItemMove, onItemUpdate, onItemDelete,
}: KanbanBoardProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('assignee');
  const isMine = (name: string) => !!me?.includes(name);

  // Task detail modal: tabs + per-task comment thread (the "Activity" tab).
  const [modalTab, setModalTab] = useState<ModalTab>('details');
  const [taskComments, setTaskComments] = useState<Comment[] | null>(null);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);

  // The actual selected item derived from the items array
  const selectedItem = items.find((i) => i.id === selectedItemId) || null;

  // Load the thread whenever a task is opened; reset on close.
  useEffect(() => {
    setModalTab('details');
    setTaskComments(null);
    setCommentText('');
    if (!selectedItemId || !loadTaskComments) return;
    let cancelled = false;
    loadTaskComments(selectedItemId)
      .then((c) => !cancelled && setTaskComments(c))
      .catch(() => !cancelled && setTaskComments([]));
    return () => { cancelled = true; };
  }, [selectedItemId, loadTaskComments]);

  const postComment = async () => {
    const t = commentText.trim();
    if (!t || !selectedItem || !addTaskComment) return;
    setPosting(true);
    try {
      const updated = await addTaskComment(selectedItem.id, t);
      setTaskComments(updated);
      setCommentText('');
    } catch {
      /* surfaced by the board-level error handler via the thrown ApiError */
    } finally {
      setPosting(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Dropping a card onto a column applies that column's grouping field:
  // Person -> reassign, Priority -> set priority. Disabled in Due-date view,
  // and dropping onto the "None" priority column is a no-op (we never clear a
  // priority, which would PATCH an empty body).
  const handleDrop = (e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    if (!canEdit || groupBy === 'dueDate') return;
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;
    if (groupBy === 'assignee') {
      onItemMove(itemId, columnKey);
    } else if (groupBy === 'priority' && columnKey !== 'None') {
      onItemUpdate(itemId, { priority: columnKey as 'High' | 'Medium' | 'Low' });
    }
  };

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return items.filter((item) => {
      if (filter === 'completed' && item.status !== 'completed') return false;
      if (filter === 'high' && item.priority !== 'High') return false;
      return item.title.toLowerCase().includes(query) || item.assignee.toLowerCase().includes(query);
    });
  }, [items, searchQuery, filter]);

  // Columns for the active grouping. Keys come from ALL items (so columns stay
  // stable while searching); each column's cards come from the filtered set.
  const columns = useMemo(() => {
    const cardsWhere = (pred: (i: ActionItem) => boolean) => filteredItems.filter(pred);

    if (groupBy === 'priority') {
      // Fixed columns so they remain valid drop targets even when empty.
      return ['High', 'Medium', 'Low', 'None'].map((key) => ({
        key,
        label: key,
        items: cardsWhere((i) => (i.priority ?? 'None') === key),
      }));
    }

    if (groupBy === 'dueDate') {
      const present = new Set(filteredItems.map((i) => dueBucket(i.dueDate).key));
      return DUE_ORDER.filter((k) => present.has(k)).map((k) => ({
        key: k,
        label: dueBucket(filteredItems.find((i) => dueBucket(i.dueDate).key === k)?.dueDate).label,
        items: cardsWhere((i) => dueBucket(i.dueDate).key === k),
      }));
    }

    // assignee (default) — keep Unassigned last, then alphabetical
    const names = Array.from(new Set(filteredItems.map((i) => i.assignee))).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    });
    return names.map((key) => ({ key, label: key, items: cardsWhere((i) => i.assignee === key) }));
  }, [filteredItems, groupBy]);

  const draggable = canEdit && groupBy !== 'dueDate';

  const openCount = (list: ActionItem[]) => list.filter((i) => i.status !== 'completed').length;
  const groupNote = (list: ActionItem[]) =>
    list.length === 0 ? 'none' : openCount(list) === 0 ? 'all done' : `${openCount(list)} of ${list.length} open`;

  const groupHeading = (label: string) => (
    <span className="flex min-w-0 items-center gap-2">
      {groupBy === 'assignee' && <Monogram name={label} mine={isMine(label)} />}
      <span className={cx('truncate', groupBy === 'assignee' && isMine(label) && 'mark')}>{label}</span>
    </span>
  );

  // The small facts under or beside a task title, shared by both views.
  const blockedLine = (item: ActionItem) =>
    item.status !== 'completed' && item.blockedBy && item.blockedBy.length > 0 ? (
      <p className="mt-1 text-meta text-danger">Blocked by: {item.blockedBy.join(', ')}</p>
    ) : null;

  const dueText = (item: ActionItem) =>
    item.dueDate ? (
      <span className={cx('tnum', isOverdue(item) ? 'font-medium text-danger' : 'text-ink-3')}>
        {isOverdue(item) ? `Overdue, ${formatDue(item.dueDate)}` : formatDue(item.dueDate)}
      </span>
    ) : null;

  const titleButton = (item: ActionItem) => (
    <button
      type="button"
      onClick={() => setSelectedItemId(item.id)}
      className={cx(
        'text-left text-body leading-snug decoration-line-strong underline-offset-4 hover:underline',
        item.status === 'completed' ? 'text-ink-3 line-through' : 'text-ink',
      )}
    >
      {item.title}
    </button>
  );

  const dragProps = (item: ActionItem) => ({
    layoutId: item.id,
    draggable,
    // motion types onDragStart as a pan-gesture handler, but with `draggable`
    // the browser fires a native HTML5 DragEvent at runtime.
    onDragStart: (e: unknown) => {
      if (draggable) handleDragStart(e as React.DragEvent, item.id);
    },
  });

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="relative min-w-[12rem] flex-1">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            aria-label="Search tasks"
            placeholder="Search tasks or people"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cx(inputClass, 'h-8 pl-8')}
          />
        </div>
        <Segmented label="Group tasks by" value={groupBy} onChange={setGroupBy} options={GROUPINGS.map((g) => ({ value: g.key, label: g.label }))} />
        <Segmented label="View" value={view} onChange={onViewChange} options={[{ value: 'list', label: 'List' }, { value: 'board', label: 'Board' }]} />
      </div>

      {items.length === 0 ? (
        <Empty title="No tasks yet">{canEdit ? 'Paste a transcript above, or choose Add task.' : 'Tasks appear here once the owner adds a transcript.'}</Empty>
      ) : columns.length === 0 || filteredItems.length === 0 ? (
        <Empty title="Nothing matches">Try a different search, or clear the filter.</Empty>
      ) : view === 'list' ? (
        <div className="flex flex-col gap-9">
          {columns.map((column) => (
            <section key={column.key} aria-label={column.label} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, column.key)}>
              <header className="flex items-center justify-between gap-3 border-b border-line-strong pb-2">
                <h3 className="min-w-0 text-body font-semibold text-ink">{groupHeading(column.label)}</h3>
                <span className="tnum shrink-0 text-meta text-ink-3">{groupNote(column.items)}</span>
              </header>
              {column.items.length === 0 ? (
                <p className="py-3 text-ui text-ink-3">Nothing here.</p>
              ) : (
                <ul>
                  {column.items.map((item) => (
                    <motion.li
                      key={item.id}
                      {...dragProps(item)}
                      className={cx('group relative flex items-start gap-3 border-b border-line py-3', draggable && 'cursor-grab active:cursor-grabbing')}
                    >
                      {draggable && (
                        <GripIcon className="absolute -left-5 top-3.5 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100 max-lg:hidden" />
                      )}
                      <span className="mt-[3px]">
                        <Checkbox
                          checked={item.status === 'completed'}
                          disabled={!canEdit}
                          onChange={(done) => onItemUpdate(item.id, { status: done ? 'completed' : 'pending' })}
                          label={`Mark "${item.title}" as done`}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        {titleButton(item)}
                        {/* In non-person groupings, show who owns the task. */}
                        {groupBy !== 'assignee' && (
                          <p className="mt-0.5 text-meta text-ink-2">
                            <span className={cx(isMine(item.assignee) && 'mark')}>{item.assignee}</span>
                          </p>
                        )}
                        {blockedLine(item)}
                      </div>
                      {item.status !== 'completed' && item.priority && (
                        <span className={cx('mt-0.5 w-14 shrink-0 text-meta max-sm:hidden', priorityClass(item.priority))}>
                          {item.priority}
                        </span>
                      )}
                      <span className="mt-0.5 min-w-[3.5rem] shrink-0 text-right text-meta">{dueText(item)}</span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="-mx-5 flex items-start gap-3 overflow-x-auto px-5 pb-4 lg:-mx-8 lg:px-8">
          {columns.map((column) => (
            <section
              key={column.key}
              aria-label={column.label}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.key)}
              className="flex min-w-[14rem] flex-1 basis-0 flex-col rounded-lg bg-wash p-2"
            >
              <header className="flex items-center justify-between gap-2 px-1.5 pb-2 pt-1">
                <h3 className="min-w-0 text-ui font-semibold text-ink">{groupHeading(column.label)}</h3>
                <span className="tnum shrink-0 text-meta text-ink-3">{groupNote(column.items)}</span>
              </header>
              <ul className="flex min-h-[2.5rem] flex-col gap-1.5">
                {column.items.map((item) => (
                  <motion.li
                    key={item.id}
                    {...dragProps(item)}
                    className={cx(
                      'rounded-md border border-line bg-paper p-3 transition-colors hover:border-line-strong',
                      draggable && 'cursor-grab active:cursor-grabbing',
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="mt-[3px]">
                        <Checkbox
                          checked={item.status === 'completed'}
                          disabled={!canEdit}
                          onChange={(done) => onItemUpdate(item.id, { status: done ? 'completed' : 'pending' })}
                          label={`Mark "${item.title}" as done`}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        {titleButton(item)}
                        {blockedLine(item)}
                        {(groupBy !== 'assignee' || item.priority || item.dueDate) && item.status !== 'completed' && (
                          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-meta">
                            {groupBy !== 'assignee' && (
                              <span className={cx('text-ink-2', isMine(item.assignee) && 'mark')}>{item.assignee}</span>
                            )}
                            {item.priority && <span className={priorityClass(item.priority)}>{item.priority}</span>}
                            {dueText(item)}
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {selectedItem && (
        <Dialog
          title={canEdit ? 'Task' : selectedItem.title}
          width="max-w-lg"
          onClose={() => setSelectedItemId(null)}
          footer={
            <>
              {canEdit && (
                <Button
                  variant="danger"
                  className="mr-auto"
                  onClick={() => {
                    onItemDelete(selectedItem.id);
                    setSelectedItemId(null);
                  }}
                >
                  Delete task
                </Button>
              )}
              <Button variant="primary" onClick={() => setSelectedItemId(null)}>Done</Button>
            </>
          }
        >
          {loadTaskComments && (
            <div className="mb-4">
              <Tabs
                label="Task"
                value={modalTab}
                onChange={setModalTab}
                tabs={[
                  { value: 'details', label: 'Details' },
                  { value: 'activity', label: 'Activity', count: taskComments?.length || undefined },
                ]}
              />
            </div>
          )}

          {modalTab === 'activity' ? (
            <div className="flex min-h-[15rem] flex-col gap-4 pb-2">
              {taskComments === null ? (
                <div className="flex justify-center py-10 text-ink-3"><Spinner className="h-4 w-4" /></div>
              ) : taskComments.length === 0 ? (
                <p className="py-6 text-ui text-ink-2">No comments on this task yet.</p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {taskComments.map((c) => (
                    <li key={c.id} className="flex gap-2.5">
                      <Monogram name={c.author} mine={isMine(c.author)} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-baseline gap-2 text-ui">
                          <span className="font-medium text-ink">{c.author}</span>
                          <span className="tnum text-meta text-ink-3">
                            {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </p>
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-ui leading-relaxed text-ink-2">
                          {renderMentions(c.text, people ?? [])}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {canEdit && (
                <form onSubmit={(e) => { e.preventDefault(); postComment(); }} className="mt-auto flex items-center gap-2">
                  <MentionInput
                    value={commentText}
                    onChange={setCommentText}
                    onSubmit={postComment}
                    people={people ?? []}
                    disabled={posting}
                    placeholder="Add a comment. Type @ to mention someone"
                    className={cx(inputClass, 'h-9')}
                  />
                  <Button type="submit" variant="primary" size="lg" className="h-9" busy={posting} disabled={!commentText.trim()}>
                    Send
                  </Button>
                </form>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-5 pb-2">
              {canEdit && (
                <input
                  key={selectedItem.id}
                  aria-label="Task title"
                  defaultValue={selectedItem.title}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== selectedItem.title) onItemUpdate(selectedItem.id, { title: v });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  }}
                  className="-mx-2 w-[calc(100%+1rem)] rounded-md border border-transparent bg-transparent px-2 py-1 text-title font-semibold tracking-[-0.01em] text-ink outline-none transition-colors hover:border-line focus:border-ink"
                />
              )}

              <label className="flex items-center gap-2.5 text-ui text-ink">
                <Checkbox
                  checked={selectedItem.status === 'completed'}
                  disabled={!canEdit}
                  onChange={(done) => onItemUpdate(selectedItem.id, { status: done ? 'completed' : 'pending' })}
                  label="Done"
                />
                {selectedItem.status === 'completed' ? 'Done' : 'Mark as done'}
              </label>

              <dl className="grid grid-cols-[6rem_1fr] items-center gap-x-3 gap-y-2.5 text-ui">
                <dt className="text-ink-2">Owner</dt>
                <dd className="flex items-center gap-2">
                  <Monogram name={selectedItem.assignee} mine={isMine(selectedItem.assignee)} />
                  {canEdit ? (
                    <input
                      key={selectedItem.id}
                      aria-label="Owner"
                      defaultValue={selectedItem.assignee}
                      onBlur={(e) => {
                        // An owner cannot be empty: the grouping and the backend
                        // both need a name, so fall back to "Unassigned".
                        const next = e.target.value.trim() || 'Unassigned';
                        if (next !== selectedItem.assignee) onItemUpdate(selectedItem.id, { assignee: next });
                        else e.target.value = selectedItem.assignee;
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                      placeholder="Unassigned"
                      className={cx(inputClass, 'h-8 max-w-[15rem]')}
                    />
                  ) : (
                    <span className="text-ink">{selectedItem.assignee}</span>
                  )}
                </dd>

                <dt className="text-ink-2">Priority</dt>
                <dd>
                  {canEdit ? (
                    <Segmented
                      label="Priority"
                      value={(selectedItem.priority ?? 'Medium') as 'High' | 'Medium' | 'Low'}
                      onChange={(p) => onItemUpdate(selectedItem.id, { priority: p })}
                      options={[{ value: 'High', label: 'High' }, { value: 'Medium', label: 'Medium' }, { value: 'Low', label: 'Low' }]}
                    />
                  ) : (
                    <span className={priorityClass(selectedItem.priority)}>{selectedItem.priority ?? 'None'}</span>
                  )}
                </dd>

                <dt className="text-ink-2">Due</dt>
                <dd>
                  <input
                    type="date"
                    aria-label="Due date"
                    value={selectedItem.dueDate || ''}
                    disabled={!canEdit}
                    onChange={(e) => onItemUpdate(selectedItem.id, { dueDate: e.target.value })}
                    className={cx(inputClass, 'tnum h-8 w-auto')}
                  />
                </dd>
              </dl>

              {selectedItem.blockedBy && selectedItem.blockedBy.length > 0 && (
                <div className="rounded-md bg-danger-wash px-3 py-2.5 text-ui text-danger">
                  <p className="font-medium">Blocked by</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-4">
                    {selectedItem.blockedBy.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="task-notes" className="text-ui font-medium text-ink">Notes</label>
                {canEdit ? (
                  <textarea
                    id="task-notes"
                    key={selectedItem.id}
                    defaultValue={selectedItem.description ?? ''}
                    onBlur={(e) => {
                      const v = e.target.value;
                      if (v !== (selectedItem.description ?? '')) onItemUpdate(selectedItem.id, { description: v });
                    }}
                    rows={4}
                    placeholder="Context from the meeting, links, anything the owner needs"
                    className={cx(inputClass, 'min-h-[5.5rem] resize-y py-2 leading-relaxed')}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-ui leading-relaxed text-ink-2">
                    {selectedItem.description || 'No notes were taken from the transcript for this task.'}
                  </p>
                )}
              </div>
            </div>
          )}
        </Dialog>
      )}
    </div>
  );
}
