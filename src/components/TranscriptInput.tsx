import React, { useState } from 'react';
import { Loader2, Sparkles, Send, BrainCircuit, HeartPulse, ShieldCheck, Brain, AlertTriangle, Workflow, OctagonAlert, CircleHelp } from 'lucide-react';
import { MeetingAnalysis } from '../types';

interface TranscriptInputProps {
  onAnalyze: (transcript: string) => Promise<void>;
  isAnalyzing: boolean;
  analysis: MeetingAnalysis | null;
  canEdit: boolean;
}

export function TranscriptInput({ onAnalyze, isAnalyzing, analysis, canEdit }: TranscriptInputProps) {
  const [text, setText] = useState('');

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
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-xl p-4 shrink-0 flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BrainCircuit className="w-3.5 h-3.5" /> Executive Summary
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{analysis.summary}</p>
            </div>
            
            {analysis.sentimentInfo && (
              <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-800/30">
                <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5" /> Sentiment Analysis
                </h3>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${getSentimentColor(analysis.sentimentInfo.score)}`}>
                    {analysis.sentimentInfo.score}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{analysis.sentimentInfo.breakdown}</p>
              </div>
            )}
            
            {analysis.keyDecisions && analysis.keyDecisions.length > 0 && (
              <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-800/30">
                <h3 className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> Key Decisions
                </h3>
                <ul className="list-disc pl-4 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                  {analysis.keyDecisions.map((decision, i) => (
                    <li key={i}>{decision}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.risks && analysis.risks.length > 0 && (
              <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-800/30">
                <h3 className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Risks
                </h3>
                <ul className="list-disc pl-4 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                  {analysis.risks.map((risk, i) => (
                    <li key={i}>{risk}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.blockers && analysis.blockers.length > 0 && (
              <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-800/30">
                <h3 className="text-xs font-bold text-red-700 dark:text-red-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <OctagonAlert className="w-3.5 h-3.5" /> Blockers
                </h3>
                <ul className="list-disc pl-4 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                  {analysis.blockers.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.dependencies && analysis.dependencies.length > 0 && (
              <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-800/30">
                <h3 className="text-xs font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5" /> Dependencies
                </h3>
                <ul className="list-disc pl-4 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                  {analysis.dependencies.map((dep, i) => (
                    <li key={i}>{dep}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.openQuestions && analysis.openQuestions.length > 0 && (
              <div className="pt-3 border-t border-indigo-200/60 dark:border-indigo-800/30">
                <h3 className="text-xs font-bold text-fuchsia-700 dark:text-fuchsia-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <CircleHelp className="w-3.5 h-3.5" /> Open Questions
                </h3>
                <ul className="list-disc pl-4 space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                  {analysis.openQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
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
