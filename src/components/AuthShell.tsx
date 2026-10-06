import React from 'react';
import { Brand } from '../ui/bits';
import { TaskRow } from './TaskRow';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/**
 * The sign-in and register layout: the form on the left, and on wide screens a
 * specimen board on the right so a first-time visitor sees what the product
 * makes before they have an account.
 */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-dvh bg-paper lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <main className="flex flex-col px-6 py-6 sm:px-10 lg:px-16">
        <Brand />
        <div className="my-auto w-full max-w-sm py-10">
          <h1 className="font-serif text-[1.75rem] leading-tight font-semibold tracking-[-0.01em]">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-2">{subtitle}</p>
          <div className="mt-7">{children}</div>
          <p className="mt-6 text-sm text-ink-2">{footer}</p>
        </div>
      </main>
      <aside className="hidden border-l border-rule bg-wash lg:flex lg:items-center lg:justify-center lg:p-12" aria-label="Example board">
        <Specimen />
      </aside>
    </div>
  );
}

/** A still, example board built from the same rows the product uses. Not interactive. */
function Specimen() {
  return (
    <figure className="w-full max-w-[30rem]">
      <div inert aria-hidden="true" className="border border-rule-2 bg-paper px-7 pt-6 pb-2">
        <p className="font-serif text-xl leading-tight font-semibold">Weekly product sync</p>
        <p className="mt-1.5 flex gap-x-3 text-[0.8125rem] text-ink-2">
          <span>
            <span className="font-semibold text-ink tabular-nums">6</span> tasks
          </span>
          <span>
            <span className="font-semibold text-ink tabular-nums">1</span> done
          </span>
          <span>
            <span className="font-semibold text-red tabular-nums">1</span> blocker
          </span>
          <span>
            <span className="font-semibold text-ink tabular-nums">2</span> decisions
          </span>
        </p>
        <div className="double-rule mt-4" />

        <p className="mt-4 border-b border-ink pb-2 font-serif text-[0.9375rem] font-semibold">Maya</p>
        <ol>
          <TaskRow number={1} title="Send the privacy wording to legal for sign-off" done priority="High" />
          <TaskRow number={5} title="Draft a holding reply for late login codes" done={false} priority="Medium" dueDate={inDays(0)} />
        </ol>

        <p className="mt-5 border-b border-ink pb-2 font-serif text-[0.9375rem] font-semibold">Dev</p>
        <ol>
          <TaskRow
            number={2}
            title="Submit the build to the App Store"
            done={false}
            priority="High"
            dueDate={inDays(3)}
            waitsOn={[{ number: 1, title: 'Send the privacy wording to legal for sign-off' }]}
          />
          <TaskRow number={4} title="Check the SMS provider logs" done={false} priority="Medium" dueDate={inDays(1)} />
        </ol>
      </div>
      <figcaption className="mt-4 text-[0.8125rem] leading-relaxed text-ink-2">
        An example board. Yours is written from your own meeting transcript, with every task given an owner.
      </figcaption>
    </figure>
  );
}

/** A date `n` days from today as yyyy-mm-dd, so the specimen's dates never go stale. */
function inDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
