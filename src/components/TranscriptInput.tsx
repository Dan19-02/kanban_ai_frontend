import React, { useEffect, useRef, useState } from 'react';
import { MeetingAnalysis } from '../types';
import { Button, Textarea } from './ui';

/** Which section of the meeting notes to scroll to. `nonce` changes per request
 *  so repeated clicks on the same section re-trigger the effect. */
export interface SectionFocus {
  key: string;
  nonce: number;
}

interface MeetingNotesProps {
  analysis: MeetingAnalysis | null;
  focus?: SectionFocus | null;
}

function NoteList({
  id, title, items, innerRef, ordered = false, danger = false,
}: {
  id: string;
  title: string;
  items?: string[];
  innerRef: (el: HTMLElement | null) => void;
  ordered?: boolean;
  danger?: boolean;
}) {
  if (!items?.length) return null;
  const List = ordered ? 'ol' : 'ul';
  return (
    <section ref={innerRef} id={`notes-${id}`} className="scroll-mt-20">
      <h2 className={`text-body font-semibold ${danger ? 'text-danger' : 'text-ink'}`}>{title}</h2>
      <List className={`mt-1.5 space-y-1 pl-5 text-body text-ink-2 marker:text-ink-3 ${ordered ? 'list-decimal' : 'list-disc'}`}>
        {items.map((text, i) => <li key={i} className="pl-0.5">{text}</li>)}
      </List>
    </section>
  );
}

/** The written part of a meeting: summary, decisions and the things to watch. */
export function MeetingNotes({ analysis, focus }: MeetingNotesProps) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const setRef = (k: string) => (el: HTMLElement | null) => {
    sectionRefs.current[k] = el;
  };

  // When the details column asks for a section, scroll to it.
  useEffect(() => {
    if (!focus) return;
    const id = requestAnimationFrame(() => {
      sectionRefs.current[focus.key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [focus]);

  if (!analysis?.summary) return null;

  const hasWatchList = !!(
    analysis.blockers?.length ||
    analysis.risks?.length ||
    analysis.dependencies?.length ||
    analysis.openQuestions?.length
  );

  return (
    <div className="flex flex-col gap-7">
      <section ref={setRef('summary')} id="notes-summary" className="scroll-mt-20">
        <p className="max-w-[68ch] text-lead text-ink">{analysis.summary}</p>
        {analysis.sentimentInfo && (
          <p ref={setRef('sentiment')} className="mt-3 max-w-[68ch] text-ui text-ink-2">
            <span className="font-medium text-ink">Mood: {analysis.sentimentInfo.score.toLowerCase()}.</span>{' '}
            {analysis.sentimentInfo.breakdown}
          </p>
        )}
      </section>

      <NoteList id="decisions" title="Decisions" items={analysis.keyDecisions} innerRef={setRef('decisions')} ordered />

      {hasWatchList && (
        <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          <NoteList id="blockers" title="Blockers" items={analysis.blockers} innerRef={setRef('blockers')} danger />
          <NoteList id="risks" title="Risks" items={analysis.risks} innerRef={setRef('risks')} />
          <NoteList id="dependencies" title="Dependencies" items={analysis.dependencies} innerRef={setRef('dependencies')} />
          <NoteList id="questions" title="Open questions" items={analysis.openQuestions} innerRef={setRef('questions')} />
        </div>
      )}
    </div>
  );
}

interface TranscriptFormProps {
  /** Resolves true when analysis succeeded (so we can clear the box for the next one). */
  onAnalyze: (transcript: string) => Promise<boolean>;
  isAnalyzing: boolean;
  /** True when the board already holds an analysed meeting. */
  hasAnalysis: boolean;
  /** Text to start with, such as a transcript whose analysis just failed. */
  initialText?: string;
}

/** Paste box for a transcript. On an empty board it is the page's main action;
 *  on an analysed board it sits behind a link because it replaces the tasks. */
export function TranscriptForm({ onAnalyze, isAnalyzing, hasAnalysis, initialText = '' }: TranscriptFormProps) {
  const [text, setText] = useState(initialText);
  const [open, setOpen] = useState(!hasAnalysis);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || isAnalyzing) return;
    // Clear the box only on success; on failure keep the text so the user can
    // retry without pasting again.
    const ok = await onAnalyze(trimmed);
    if (ok) {
      setText('');
      setOpen(false);
    }
  };

  if (hasAnalysis && !open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="self-start text-ui text-ink-2 underline hover:text-ink">
        Replace with a new transcript
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <h2 className="text-title font-semibold tracking-[-0.01em] text-ink">
          {hasAnalysis ? 'Replace with a new transcript' : 'Paste the meeting transcript'}
        </h2>
        <p className="mt-1 text-ui text-ink-2">
          {hasAnalysis
            ? 'This replaces the summary and every task on this board.'
            : 'You get a summary, the decisions, and every task with its owner.'}
        </p>
      </div>
      <Textarea
        aria-label="Meeting transcript"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={isAnalyzing}
        rows={hasAnalysis ? 6 : 10}
        placeholder="Priya: Thanks everyone. Three weeks to launch, so let's go through blockers first."
        className="resize-y"
      />
      <div className="flex items-center gap-2">
        <Button type="submit" variant="primary" busy={isAnalyzing} disabled={!text.trim()}>
          {isAnalyzing ? 'Reading the transcript' : hasAnalysis ? 'Replace board' : 'Create the board'}
        </Button>
        {hasAnalysis && <Button variant="ghost" onClick={() => setOpen(false)} disabled={isAnalyzing}>Cancel</Button>}
      </div>
    </form>
  );
}
