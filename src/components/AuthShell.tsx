import React from 'react';
import { Field, Input, Monogram, Wordmark } from './ui';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

/** Two-column frame shared by the sign in and register screens. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="min-h-screen bg-paper text-ink lg:grid lg:grid-cols-2">
      <div className="flex min-h-screen flex-col px-5 py-5 lg:px-8">
        <Wordmark />
        <main className="flex flex-1 items-center py-10">
          <div className="mx-auto w-full max-w-sm">
            <h1 className="text-display font-semibold tracking-[-0.02em] text-ink">{title}</h1>
            <p className="mt-2 text-body text-ink-2">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-6 text-ui text-ink-2">{footer}</p>
          </div>
        </main>
      </div>

      <aside
        aria-hidden="true"
        className="hidden min-h-screen items-center justify-center border-l border-line bg-wash px-10 py-10 lg:flex"
      >
        <BoardPreview />
      </aside>
    </div>
  );
}

export function AuthField({
  label,
  className,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label}>
      {(p) => <Input {...props} {...p} className={className ?? 'h-10'} />}
    </Field>
  );
}

// ─── Preview ────────────────────────────────────────────────────────────────

// Synthetic sample content. It shows the shape of a real board, nothing more.
const PREVIEW_TASKS: { title: string; owner: string; person: string; due: string; mine?: boolean; blockedBy?: string }[] = [
  { title: 'Confirm the pricing page copy', owner: 'You', person: 'Dana Whitfield', due: '14 Oct', mine: true },
  { title: 'Legal approval of the wording', owner: 'Marcus Lee', person: 'Marcus Lee', due: '13 Oct' },
  { title: 'Publish the release notes', owner: 'Priya Nair', person: 'Priya Nair', due: '15 Oct', blockedBy: 'Legal approval of the wording' },
  { title: 'Brief the support team', owner: 'Aisha Khan', person: 'Aisha Khan', due: '16 Oct' },
];

/** A static picture of what the product produces, drawn with the real primitives. */
function BoardPreview() {
  return (
    <div className="w-full max-w-[30rem]">
      <p className="text-title font-semibold tracking-[-0.01em] text-ink">
        Paste a transcript. Get a board where every task has an owner.
      </p>

      <div className="mt-8 rounded-lg border border-line bg-paper px-5 pb-2 pt-5">
        <p className="text-lead font-semibold tracking-[-0.01em] text-ink">Launch readiness review</p>
        <p className="mt-1.5 text-ui leading-relaxed text-ink-2">
          Launch moves to 21 Oct so legal can approve the release wording.
          Pricing copy and the support brief are due this week.
        </p>

        <ul className="mt-4 border-t border-line">
          {PREVIEW_TASKS.map((t) => (
            <li key={t.title} className="flex items-start gap-3 border-b border-line py-3 last:border-b-0">
              <span className="mt-px h-[18px] w-[18px] shrink-0 rounded-[5px] border border-line-strong bg-paper" />
              <div className="min-w-0 flex-1">
                <p className="text-ui font-medium text-ink">{t.title}</p>
                {t.blockedBy && <p className="mt-0.5 text-meta text-danger">Blocked by: {t.blockedBy}</p>}
                <p className="mt-1 flex items-center gap-1.5 text-meta text-ink-2">
                  <Monogram name={t.person} mine={t.mine} size="sm" />
                  <span className={t.mine ? 'font-medium text-ink' : undefined}>{t.owner}</span>
                </p>
              </div>
              <span className="tnum shrink-0 text-meta text-ink-3">{t.due}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
