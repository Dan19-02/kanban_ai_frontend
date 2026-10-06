import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, FilePlus2 } from 'lucide-react';
import type { MeetingAnalysis } from '../types';
import { count } from '../lib/format';
import { SAMPLE_TRANSCRIPT } from '../lib/sampleTranscript';
import { Notice } from '../ui/bits';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/Dialog';
import { TextArea } from '../ui/Field';

export type SectionKey = 'summary' | 'decisions' | 'risks' | 'blockers' | 'dependencies' | 'questions';

/** Which section to open and scroll to. `nonce` changes per request so a repeat click still lands. */
export interface SectionFocus {
  key: SectionKey;
  nonce: number;
}

interface MinutesProps {
  analysis: MeetingAnalysis;
  canEdit: boolean;
  isAnalyzing: boolean;
  /** Resolves true when the analysis succeeded, so the transcript box can be cleared. */
  onAnalyze: (transcript: string) => Promise<boolean>;
  focus?: SectionFocus | null;
  /** The last analysis failure, shown beside the transcript box. */
  error?: React.ReactNode;
  /** Transcriptions left on the plan; null when the plan is unlimited or unknown. */
  remaining: number | null;
  /** Open with the sample transcript already pasted. */
  startWithSample?: boolean;
}

interface SectionProps {
  title: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  innerRef: (el: HTMLElement | null) => void;
  children: React.ReactNode;
}

function Section({ title, count: n, open, onToggle, innerRef, children }: SectionProps) {
  const bodyId = useId();
  return (
    <section ref={innerRef} className="scroll-mt-32 lg:scroll-mt-4 border-t border-rule py-3.5">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={bodyId}
          className="flex w-full items-baseline gap-2 rounded-[2px] text-left"
        >
          <span className="font-serif text-[0.9375rem] font-semibold">{title}</span>
          {n != null && <span className="text-xs text-ink-3 tabular-nums">{n}</span>}
          <ChevronDown
            aria-hidden
            className={`ml-auto h-4 w-4 self-center text-ink-3 transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
          />
        </button>
      </h3>
      <div id={bodyId} hidden={!open} className="mt-2">
        {children}
      </div>
    </section>
  );
}

/** A numbered list, set like the items of a minute. `alert` writes the numbers in the red ink. */
function Items({ items, alert = false }: { items: string[]; alert?: boolean }) {
  return (
    <ol>
      {items.map((text, i) => (
        <li key={i} className="grid grid-cols-[1.5rem_minmax(0,1fr)] py-1 text-sm leading-relaxed">
          <span className={`tabular-nums ${alert ? 'font-semibold text-red' : 'text-ink-3'}`}>{i + 1}</span>
          <span className="text-ink-2">{text}</span>
        </li>
      ))}
    </ol>
  );
}

/**
 * The record of the meeting: summary, tone, decisions, risks, blockers,
 * dependencies and open questions, then the box where a transcript goes in.
 */
export function Minutes({
  analysis,
  canEdit,
  isAnalyzing,
  onAnalyze,
  focus,
  error,
  remaining,
  startWithSample = false,
}: MinutesProps) {
  const hasMinutes = Boolean(analysis.summary);
  const taskCount = analysis.actionItems.length;
  const [open, setOpen] = useState<Record<string, boolean>>({
    summary: true,
    decisions: true,
    risks: true,
    blockers: true,
    dependencies: true,
    questions: true,
  });
  const [composing, setComposing] = useState(!hasMinutes);
  const [text, setText] = useState(startWithSample && !hasMinutes ? SAMPLE_TRANSCRIPT : '');
  const [confirming, setConfirming] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const boxRef = useRef<HTMLTextAreaElement>(null);

  const toggle = (key: SectionKey) => setOpen((s) => ({ ...s, [key]: !s[key] }));
  const setRef = (key: SectionKey) => (el: HTMLElement | null) => {
    sectionRefs.current[key] = el;
  };

  // A count in the page head asks for a section: open it, then scroll to it.
  useEffect(() => {
    if (!focus) return;
    setOpen((s) => ({ ...s, [focus.key]: true }));
    const id = requestAnimationFrame(() => {
      sectionRefs.current[focus.key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [focus]);

  // A board with no minutes always shows the transcript box.
  useEffect(() => {
    if (!hasMinutes) setComposing(true);
  }, [hasMinutes]);

  const run = async () => {
    setConfirming(false);
    // Keep the text on failure so it can be retried without pasting again.
    const ok = await onAnalyze(text.trim());
    if (ok) {
      setText('');
      setComposing(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isAnalyzing) return;
    if (taskCount > 0) setConfirming(true);
    else run();
  };

  const outOfQuota = remaining === 0;

  return (
    <div className="px-4 pt-1 pb-10 md:px-8 lg:pt-2 lg:pr-6">
      {hasMinutes && (
        <>
          <section ref={setRef('summary')} className="scroll-mt-32 lg:scroll-mt-4 pb-3.5">
            <h3 className="font-serif text-[0.9375rem] font-semibold">Summary</h3>
            <p className="mt-2 font-serif text-[0.9375rem] leading-7 text-ink">{analysis.summary}</p>
            {analysis.sentimentInfo && (
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                <span className="font-semibold text-ink">Tone: {analysis.sentimentInfo.score}.</span>{' '}
                {analysis.sentimentInfo.breakdown}
              </p>
            )}
          </section>

          {analysis.keyDecisions.length > 0 && (
            <Section title="Decisions" count={analysis.keyDecisions.length} open={open.decisions} onToggle={() => toggle('decisions')} innerRef={setRef('decisions')}>
              <Items items={analysis.keyDecisions} />
            </Section>
          )}
          {analysis.blockers.length > 0 && (
            <Section title="Blockers" count={analysis.blockers.length} open={open.blockers} onToggle={() => toggle('blockers')} innerRef={setRef('blockers')}>
              <Items items={analysis.blockers} alert />
            </Section>
          )}
          {analysis.risks.length > 0 && (
            <Section title="Risks" count={analysis.risks.length} open={open.risks} onToggle={() => toggle('risks')} innerRef={setRef('risks')}>
              <Items items={analysis.risks} />
            </Section>
          )}
          {analysis.dependencies.length > 0 && (
            <Section title="Dependencies" count={analysis.dependencies.length} open={open.dependencies} onToggle={() => toggle('dependencies')} innerRef={setRef('dependencies')}>
              <Items items={analysis.dependencies} />
            </Section>
          )}
          {analysis.openQuestions.length > 0 && (
            <Section title="Open questions" count={analysis.openQuestions.length} open={open.questions} onToggle={() => toggle('questions')} innerRef={setRef('questions')}>
              <Items items={analysis.openQuestions} />
            </Section>
          )}

          <p className="border-t border-rule pt-3.5 text-xs leading-relaxed text-ink-3">
            Written by AI from the transcript. Check names, owners and dates before relying on them.
          </p>
        </>
      )}

      {!hasMinutes && !canEdit && (
        <p className="text-sm leading-relaxed text-ink-2">
          This board has no minutes yet. They appear here once someone with edit access pastes a transcript.
        </p>
      )}

      {canEdit && (
        <div className={hasMinutes ? 'mt-5' : ''}>
          {!composing ? (
            <Button
              icon={<FilePlus2 className="h-4 w-4" aria-hidden />}
              onClick={() => {
                setComposing(true);
                requestAnimationFrame(() => boxRef.current?.focus());
              }}
            >
              Paste a new transcript
            </Button>
          ) : (
            <form onSubmit={submit}>
              <h3 className="font-serif text-[0.9375rem] font-semibold">
                {hasMinutes ? 'New transcript' : 'Paste the meeting transcript'}
              </h3>
              <p className="mt-1 mb-2.5 text-sm leading-relaxed text-ink-2">
                {hasMinutes
                  ? `This replaces the ${count(taskCount, 'task')} on this board with the tasks from the new meeting.`
                  : 'Any plain text works: a Zoom, Meet or Teams transcript, or your own notes with names in them.'}
              </p>
              <TextArea
                ref={boxRef}
                aria-label="Meeting transcript"
                value={text}
                onChange={(e) => setText(e.target.value)}
                disabled={isAnalyzing}
                maxLength={100_000}
                placeholder="Sarah: Thanks everyone. Three things today…"
                className={`resize-y ${hasMinutes ? 'min-h-40' : 'min-h-64'}`}
              />

              {error && <div className="mt-2.5">{error}</div>}
              {outOfQuota && !error && (
                <Notice tone="info" className="mt-2.5">
                  You have used every transcription on your plan.{' '}
                  <Link to="/billing" className="link">
                    See plans
                  </Link>
                </Notice>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button type="submit" variant="primary" loading={isAnalyzing} disabled={!text.trim() || outOfQuota}>
                  {isAnalyzing ? 'Reading the transcript' : 'Generate board'}
                </Button>
                {!text && !isAnalyzing && (
                  <Button variant="quiet" onClick={() => setText(SAMPLE_TRANSCRIPT)}>
                    Use a sample transcript
                  </Button>
                )}
                {hasMinutes && !isAnalyzing && (
                  <Button
                    variant="quiet"
                    onClick={() => {
                      setComposing(false);
                      setText('');
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
              <p className="mt-2.5 text-xs leading-relaxed text-ink-3" role="status">
                {isAnalyzing
                  ? 'Keep this page open until the board appears.'
                  : remaining != null && !outOfQuota
                    ? `Uses 1 of your ${count(remaining, 'remaining transcription')}. Up to 100,000 characters.`
                    : 'Up to 100,000 characters.'}
              </p>
            </form>
          )}
        </div>
      )}

      {confirming && (
        <ConfirmDialog
          title="Replace this board's tasks?"
          confirmLabel={`Replace ${count(taskCount, 'task')}`}
          destructive
          onConfirm={run}
          onCancel={() => setConfirming(false)}
        >
          The new transcript replaces all {count(taskCount, 'task')} here, including edits, ticks, due dates and each
          task's discussion. The board discussion is kept. For a different meeting, a new board keeps both.
        </ConfirmDialog>
      )}
    </div>
  );
}
