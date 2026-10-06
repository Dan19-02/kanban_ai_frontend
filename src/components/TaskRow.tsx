import React from 'react';
import { dueInfo, duePhrase } from '../lib/format';
import { Checkbox, Initials, PriorityMark } from '../ui/bits';

/** Another task this one waits on: its number on the board when it is there, else its title. */
export interface Waiting {
  number: number | null;
  title: string;
}

interface TaskRowProps {
  /** The task's number in the minutes (its place on the board). */
  number: number;
  title: string;
  done: boolean;
  priority?: string;
  dueDate?: string;
  /** Shown when the lane itself does not already name the owner. */
  owner?: string;
  /** Unfinished tasks this one waits on. */
  waitsOn?: Waiting[];
  canEdit?: boolean;
  draggable?: boolean;
  /** True while this row is the one being dragged. */
  dragging?: boolean;
  onToggle?: (done: boolean) => void;
  onOpen?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

/**
 * One entry in the minutes. The margin, left of the red rule, always holds the
 * task's number with its due date beneath, so dates read straight down a lane.
 * Right of the rule: the tick box, the task, and its priority at the row end,
 * with the owner and what it waits on beneath.
 */
export function TaskRow({
  number,
  title,
  done,
  priority,
  dueDate,
  owner,
  waitsOn = [],
  canEdit = false,
  draggable = false,
  dragging = false,
  onToggle,
  onOpen,
  onDragStart,
  onDragEnd,
}: TaskRowProps) {
  const due = dueInfo(dueDate);
  const overdue = due.state === 'overdue' && !done;
  const numbers = waitsOn.filter((w) => w.number != null).map((w) => w.number);
  const named = waitsOn.filter((w) => w.number == null).map((w) => w.title);

  const titleText = (
    <span className="strike" data-done={done}>
      {title}
    </span>
  );

  return (
    <li
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`grid grid-cols-[3.25rem_minmax(0,1fr)] border-b border-rule transition-opacity duration-150 ${
        draggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${dragging ? 'opacity-40' : ''}`}
    >
      <div className="relative pt-[0.6875rem] pr-2 pb-2 text-right leading-none select-none">
        <span className="block text-xs text-ink-3 tabular-nums">{number}</span>
        {due.short && (
          <span
            className={`mt-1.5 block text-[0.6875rem] whitespace-nowrap tabular-nums ${
              overdue ? 'font-semibold text-red' : 'text-ink-2'
            }`}
          >
            <span aria-hidden title={duePhrase(due, done)}>
              {due.short}
            </span>
            <span className="sr-only">{duePhrase(due, done)}</span>
          </span>
        )}
      </div>

      <div className="min-w-0 border-l border-red py-2.5 pr-1 pl-3">
        <div className="flex items-start gap-2.5">
          <Checkbox
            checked={done}
            disabled={!canEdit || !onToggle}
            label={done ? `Mark "${title}" as not done` : `Mark "${title}" as done`}
            onChange={(next) => onToggle?.(next)}
          />
          {onOpen ? (
            // A span with the button role, not a <button>: a drag can then start
            // from the title in every browser, and it still opens by keyboard.
            <span
              role="button"
              tabIndex={0}
              onClick={onOpen}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpen();
                }
              }}
              className="-my-1 min-w-0 flex-1 cursor-pointer rounded-[2px] py-1 text-sm leading-snug font-medium decoration-rule-2 underline-offset-[3px] hover:underline"
            >
              {titleText}
            </span>
          ) : (
            <span className="min-w-0 flex-1 text-sm leading-snug font-medium">{titleText}</span>
          )}
          <span className="mt-[0.1875rem] shrink-0 text-ink">
            <PriorityMark priority={priority} />
          </span>
        </div>

        {(owner || waitsOn.length > 0) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 pl-[1.875rem] text-xs text-ink-3">
            {owner && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <Initials name={owner} size="sm" />
                <span className="truncate">{owner}</span>
              </span>
            )}
            {waitsOn.length > 0 && (
              <span title={waitsOn.map((w) => w.title).join('\n')}>
                Waits on {numbers.length > 0 && <span className="tabular-nums">{numbers.join(', ')}</span>}
                {numbers.length > 0 && named.length > 0 && ', '}
                {named.join(', ')}
              </span>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
