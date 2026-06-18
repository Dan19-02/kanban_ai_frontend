import React, { useState } from 'react';
import { Send, MessageSquare, ChevronRight } from 'lucide-react';
import { Comment } from '../types';

interface CommentsSectionProps {
  comments: Comment[];
  canEdit: boolean;
  onAddComment: (text: string) => void;
  /** When provided, shows a collapse button in the header (desktop). */
  onCollapse?: () => void;
}

const AVATAR_COLORS = [
  'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300',
  'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300',
  'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
];

/** Stable color + initials per author so each person is visually distinct. */
function authorColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

export function CommentsSection({ comments, canEdit, onAddComment, onCollapse }: CommentsSectionProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddComment(trimmed);
    setText('');
  };

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
          <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          Team Comments
        </h2>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
            {comments?.length || 0}
          </span>
          {onCollapse && (
            <button
              onClick={onCollapse}
              title="Collapse comments"
              aria-label="Collapse comments"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto bg-white dark:bg-slate-900 min-h-0 transition-colors">
        {(!comments || comments.length === 0) ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 min-h-[100px]">
            <MessageSquare className="w-8 h-8 opacity-20" />
            <p className="text-sm font-medium">No comments yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-2.5">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${authorColor(c.author)}`}
                  title={c.author}
                >
                  {initials(c.author)}
                </div>
                <div className="flex-1 min-w-0 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg rounded-tl-sm transition-colors">
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{c.author}</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                      {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap break-words mt-0.5">{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center gap-2 shrink-0 transition-colors">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={!canEdit}
          placeholder={canEdit ? 'Type a comment...' : 'View-only access'}
          className="flex-1 px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!canEdit || !text.trim()}
          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
