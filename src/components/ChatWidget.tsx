import { motion } from 'motion/react';
import { MessageSquare, X } from 'lucide-react';
import type { Comment } from '../types';
import { CommentsSection } from './CommentsSection';

interface ChatWidgetProps {
  comments: Comment[];
  canEdit: boolean;
  onAddComment: (text: string) => void;
  /** Names available for @mention autocomplete + highlighting. */
  people?: string[];
  /** Unread comments from other users (shown on the closed bubble). */
  unread: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Floating "Team Comments" chat: a bubble bottom-right that opens a chat window
 *  above it. Keeps the action-item board full-width when closed. */
export function ChatWidget({ comments, canEdit, onAddComment, people, unread, open, onOpenChange }: ChatWidgetProps) {
  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.15 }}
          className="w-[360px] max-w-[calc(100vw-2.5rem)] h-[70vh] max-h-[calc(100vh-8rem)] rounded-xl shadow-2xl"
        >
          <CommentsSection
            comments={comments}
            canEdit={canEdit}
            onAddComment={onAddComment}
            people={people}
            onCollapse={() => onOpenChange(false)}
          />
        </motion.div>
      )}

      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        title={open ? 'Close team comments' : 'Open team comments'}
        aria-label={unread > 0 ? `Team comments, ${unread} unread` : 'Team comments'}
        className="relative w-14 h-14 rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 active:scale-95 flex items-center justify-center transition-all shrink-0"
      >
        {open ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center border-2 border-white dark:border-slate-900">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
