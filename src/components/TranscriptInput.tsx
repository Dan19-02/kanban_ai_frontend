import React, { useEffect, useRef, useState } from 'react';
import {
  Loader2, Send, BrainCircuit, HeartPulse, ShieldCheck, Brain, AlertTriangle,
  Workflow, OctagonAlert, CircleHelp, ChevronDown, type LucideIcon,
} from 'lucide-react';
import { MeetingAnalysis } from '../types';

/** Which AI-Brain section to expand + scroll to. `nonce` changes per request so
 *  repeated clicks on the same section re-trigger the effect. */
export interface SectionFocus {
  key: string;
  nonce: number;
}

interface TranscriptInputProps {
  onAnalyze: (transcript: string) => Promise<void>;
  isAnalyzing: boolean;
  analysis: MeetingAnalysis | null;
  canEdit: boolean;
  focus?: SectionFocus | null;
}

interface SectionProps {
  icon: LucideIcon;
  title: string;
  titleClass: string;
  count?: number;
  open: boolean;
  onToggle: () => void;
  innerRef?: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}

/** A collapsible block within the AI Brain panel. */
function Section({ icon: Icon, title, titleClass, count, open, onToggle, innerRef, children }: SectionProps) {
  return (
    <div
      ref={innerRef}
      className="border-t border-indigo-200/60 dark:border-indigo-800/30 pt-3 mt-3 first:border-t-0 first:pt-0 first:mt-0 scroll-mt-2"
    >
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between gap-2 text-left">
        <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${titleClass}`}>
          <Icon className="w-3.5 h-3.5 shrink-0" /> {title}
          {count != null && <span className="font-semibold opacity-60">({count})</span>}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

export function TranscriptInput({ onAnalyze, isAnalyzing, analysis, canEdit, focus }: TranscriptInputProps) {
  const [text, setText] = useState('');
  // Summary + sentiment open by default; the lists start collapsed (counts shown).
  const [open, setOpen] = useState<Record<string, boolean>>({ summary: true, sentiment: true });
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const toggle = (k: string) => setOpen((s) => ({ ...s, [k]: !s[k] }));
  const setRef = (k: string) => (el: HTMLDivElement | null) => {
    sectionRefs.current[k] = el;
  };

  // When a summary-bar chip asks to focus a section, expand it and scroll to it.
  useEffect(() => {
    if (!focus) return;
    setOpen((s) => ({ ...s, [focus.key]: true }));
    const id = requestAnimationFrame(() => {
      sectionRefs.current[focus.key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(id);
  }, [focus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isAnalyzing) {
      onAnalyze(text.trim());
    }
  };

  const getSentimentColor = (score: string) => {
    const s = score.toLowerCase();
    if (s.includes('positive')) return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    if (s.includes('negative')) return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800';
    return 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
  };

  const listClass = 'list-disc pl-4 space-y-1.5 text-sm text-slate-700 dark:text-slate-300';

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
          <Brain className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          AI Brain
        </h2>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto bg-white dark:bg-slate-900 min-h-0 transition-colors">
        {analysis?.summary && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-4 shrink-0 flex flex-col">
            <Section
              icon={BrainCircuit}
              title="Executive Summary"
              titleClass="text-indigo-700 dark:text-indigo-300"
              open={!!open.summary}
              onToggle={() => toggle('summary')}
              innerRef={setRef('summary')}
            >
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{analysis.summary}</p>
            </Section>

            {analysis.sentimentInfo && (
              <Section
                icon={HeartPulse}
                title="Sentiment"
                titleClass="text-indigo-700 dark:text-indigo-300"
                open={!!open.sentiment}
                onToggle={() => toggle('sentiment')}
                innerRef={setRef('sentiment')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getSentimentColor(analysis.sentimentInfo.score)}`}>
                    {analysis.sentimentInfo.score}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{analysis.sentimentInfo.breakdown}</p>
              </Section>
            )}

            {!!analysis.keyDecisions?.length && (
              <Section
                icon={ShieldCheck}
                title="Key Decisions"
                titleClass="text-indigo-700 dark:text-indigo-300"
                count={analysis.keyDecisions.length}
                open={!!open.decisions}
                onToggle={() => toggle('decisions')}
                innerRef={setRef('decisions')}
              >
                <ul className={listClass}>
                  {analysis.keyDecisions.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </Section>
            )}

            {!!analysis.risks?.length && (
              <Section
                icon={AlertTriangle}
                title="Risks"
                titleClass="text-amber-700 dark:text-amber-300"
                count={analysis.risks.length}
                open={!!open.risks}
                onToggle={() => toggle('risks')}
                innerRef={setRef('risks')}
              >
                <ul className={listClass}>
                  {analysis.risks.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </Section>
            )}

            {!!analysis.blockers?.length && (
              <Section
                icon={OctagonAlert}
                title="Blockers"
                titleClass="text-red-700 dark:text-red-300"
                count={analysis.blockers.length}
                open={!!open.blockers}
                onToggle={() => toggle('blockers')}
                innerRef={setRef('blockers')}
              >
                <ul className={listClass}>
                  {analysis.blockers.map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </Section>
            )}

            {!!analysis.dependencies?.length && (
              <Section
                icon={Workflow}
                title="Dependencies"
                titleClass="text-sky-700 dark:text-sky-300"
                count={analysis.dependencies.length}
                open={!!open.dependencies}
                onToggle={() => toggle('dependencies')}
                innerRef={setRef('dependencies')}
              >
                <ul className={listClass}>
                  {analysis.dependencies.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </Section>
            )}

            {!!analysis.openQuestions?.length && (
              <Section
                icon={CircleHelp}
                title="Open Questions"
                titleClass="text-fuchsia-700 dark:text-fuchsia-300"
                count={analysis.openQuestions.length}
                open={!!open.questions}
                onToggle={() => toggle('questions')}
                innerRef={setRef('questions')}
              >
                <ul className={listClass}>
                  {analysis.openQuestions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </Section>
            )}
          </div>
        )}

        {canEdit ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 min-h-0 mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isAnalyzing}
              placeholder="Paste your meeting transcript here to extract action items, decisions, and sentiments..."
              className="flex-1 w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none resize-none disabled:bg-slate-50 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-400 transition-colors text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!text.trim() || isAnalyzing}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors flex items-center justify-center gap-2 shrink-0"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Transcript
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Kanban
                </>
              )}
            </button>
          </form>
        ) : (
          !analysis?.summary && (
            <div className="flex-1 flex items-center justify-center text-center mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              <p className="text-sm text-slate-400 dark:text-slate-500">
                This board hasn&apos;t been analyzed yet.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
