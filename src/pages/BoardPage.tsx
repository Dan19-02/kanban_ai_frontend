import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  DownloadCloud, AlertCircle, Loader2, Share2, Plus, ArrowLeft, Eye, Sparkles,
  Brain, Columns3, MessageSquare, FileText, ChevronLeft,
} from 'lucide-react';
import { Header } from '../components/Header';
import { TranscriptInput, type SectionFocus } from '../components/TranscriptInput';
import { KanbanBoard } from '../components/KanbanBoard';
import { CommentsSection } from '../components/CommentsSection';
import { ShareModal } from '../components/ShareModal';
import { SetNameModal } from '../components/SetNameModal';
import { BoardSummaryBar, type SummaryKey } from '../components/BoardSummaryBar';
import { useBoard } from '../hooks/useBoard';
import { useAuth } from '../auth/AuthContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { api, ApiError } from '../api/client';
import type { ActionItem, ShareInfo } from '../types';

type MobileTab = 'brain' | 'board' | 'comments';

// Summary-bar chips that filter the Kanban board (the rest jump to an AI-Brain section).
const BOARD_FILTERS: Partial<Record<SummaryKey, 'all' | 'completed' | 'high'>> = {
  tasks: 'all',
  done: 'completed',
  high: 'high',
  people: 'all',
};

// CSV/formula-injection-safe cell: neutralize a leading = + - @ / tab / CR, then
// quote-escape per RFC 4180. Used for all CSV exports.
const csvCell = (value: string): string => {
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${guarded.replace(/"/g, '""')}"`;
};

const saveCsv = (filename: string, rows: string[]) => {
  const blob = new Blob([rows.join('\r\n') + '\r\n'], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export function BoardPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialToken = useRef(searchParams.get('token'));
  const [phase, setPhase] = useState<'join' | 'ready' | 'error'>(
    initialToken.current ? 'join' : 'ready',
  );
  const [joinError, setJoinError] = useState<string | null>(null);

  // If we arrived via a share link, redeem the token before loading the board.
  useEffect(() => {
    const token = initialToken.current;
    if (!token || !id) return;
    let cancelled = false;
    api.boards
      .join(token)
      .then(() => {
        if (cancelled) return;
        navigate(`/board/${id}`, { replace: true }); // strip token from URL
        setPhase('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setJoinError(err instanceof ApiError ? err.message : 'Failed to join board');
        setPhase('error');
      });
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (!id) return null;

  if (phase === 'join') {
    return (
      <CenteredMessage>
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3">Joining board…</p>
      </CenteredMessage>
    );
  }

  if (phase === 'error') {
    return (
      <CenteredMessage>
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-3">{joinError}</p>
        <Link to="/" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-2">
          Back to your boards
        </Link>
      </CenteredMessage>
    );
  }

  return <BoardView boardId={id} />;
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 text-center">
      {children}
    </div>
  );
}

function BoardView({ boardId }: { boardId: string }) {
  const {
    board, loading, error, isConnected, presence, canEdit,
    needsDisplayName, setDisplayName,
    patchBoard, analyze, moveItem, updateItem, deleteItem, addItem, addComment,
  } = useBoard(boardId);

  const { user, refreshUser } = useAuth();
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [mobileTab, setMobileTab] = useState<MobileTab>('board');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [boardFilter, setBoardFilter] = useState<'all' | 'completed' | 'high'>('all');
  const [focusSection, setFocusSection] = useState<SectionFocus | null>(null);
  const focusNonce = useRef(0);

  // A summary-bar chip either filters the board or expands/jumps to an AI-Brain
  // section. On mobile we also switch to the relevant tab.
  const handleChip = (key: SummaryKey) => {
    const f = BOARD_FILTERS[key];
    if (f) {
      setBoardFilter((cur) => (cur === f && f !== 'all' ? 'all' : f));
      if (!isDesktop) setMobileTab('board');
    } else {
      focusNonce.current += 1;
      setFocusSection({ key, nonce: focusNonce.current });
      if (!isDesktop) setMobileTab('brain');
    }
  };
  const activeChip: SummaryKey | null =
    boardFilter === 'completed' ? 'done' : boardFilter === 'high' ? 'high' : null;

  // --- Team Comments: collapse (desktop) + unread badge ---
  const [commentsCollapsed, setCommentsCollapsed] = useState(false);
  const [seenComments, setSeenComments] = useState<number | null>(null);
  const commentsInited = useRef(false);

  const commentsVisible = isDesktop ? !commentsCollapsed : mobileTab === 'comments';
  const commentCount = board?.comments?.length ?? 0;

  // Comments present on first load count as already seen.
  useEffect(() => {
    if (board && !commentsInited.current) {
      setSeenComments(board.comments?.length ?? 0);
      commentsInited.current = true;
    }
  }, [board]);

  // Keep comments marked read while they're on screen.
  useEffect(() => {
    if (commentsVisible) setSeenComments(commentCount);
  }, [commentsVisible, commentCount]);

  const unreadComments =
    commentsVisible || seenComments === null ? 0 : Math.max(0, commentCount - seenComments);

  const handleAnalyze = async (transcript: string) => {
    setIsAnalyzing(true);
    setActionError(null);
    setQuotaExceeded(false);
    try {
      await analyze(transcript);
      refreshUser(); // update remaining-transcription count
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setQuotaExceeded(true);
        setActionError(err.message);
      } else {
        setActionError(err instanceof ApiError ? err.message : 'Failed to analyze transcript');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const wrap = (fn: Promise<unknown>) =>
    fn.catch((err) => setActionError(err instanceof ApiError ? err.message : 'Something went wrong'));

  const handleAddTask = () =>
    wrap(addItem({ title: 'New task', assignee: 'Unassigned', priority: 'Medium' }));

  // Task-only exports formatted for direct import into Trello / Jira.
  const downloadCSV = (platform: 'trello' | 'jira') => {
    const items = board?.actionItems ?? [];
    if (items.length === 0) return;
    const rows =
      platform === 'jira'
        ? ['Summary,Assignee,Issue Type', ...items.map((i) => `${csvCell(i.title)},${csvCell(i.assignee)},Task`)]
        : ['Title,List (Assignee)', ...items.map((i) => `${csvCell(i.title)},${csvCell(i.assignee)}`)];
    saveCsv(`${platform}-export.csv`, rows);
  };

  // Full meeting-intelligence report: tasks, decisions, risks, and dependencies.
  const downloadReport = () => {
    if (!board) return;
    const rows = ['Type,Detail,Assignee,Priority'];
    for (const i of board.actionItems) {
      rows.push([csvCell('Task'), csvCell(i.title), csvCell(i.assignee), csvCell(i.priority ?? '')].join(','));
    }
    for (const d of board.keyDecisions ?? []) rows.push([csvCell('Decision'), csvCell(d), '', ''].join(','));
    for (const r of board.risks ?? []) rows.push([csvCell('Risk'), csvCell(r), '', ''].join(','));
    for (const b of board.blockers ?? []) rows.push([csvCell('Blocker'), csvCell(b), '', ''].join(','));
    for (const dep of board.dependencies ?? []) rows.push([csvCell('Dependency'), csvCell(dep), '', ''].join(','));
    for (const q of board.openQuestions ?? []) rows.push([csvCell('Open Question'), csvCell(q), '', ''].join(','));
    const name = (board.name || 'meeting').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
    saveCsv(`${name}-report.csv`, rows);
  };

  if (loading) {
    return (
      <CenteredMessage>
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </CenteredMessage>
    );
  }

  if (error || !board) {
    return (
      <CenteredMessage>
        <AlertCircle className="w-8 h-8 text-red-500" />
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-3">
          {error ?? 'Board not found'}
        </p>
        <Link to="/" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-2">
          Back to your boards
        </Link>
      </CenteredMessage>
    );
  }

  const hasItems = board.actionItems.length > 0;
  const hasReport = !!(
    board.actionItems.length ||
    board.keyDecisions?.length ||
    board.risks?.length ||
    board.dependencies?.length
  );

  // --- Panels (rendered once; placed into the desktop grid or mobile tabs) ---

  const transcriptPanel = (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <div className="flex-1 min-h-0">
        <TranscriptInput
          onAnalyze={handleAnalyze}
          isAnalyzing={isAnalyzing}
          analysis={board}
          canEdit={canEdit}
          focus={focusSection}
        />
      </div>
      {actionError && (
        <div
          className={`shrink-0 p-4 rounded-xl border flex items-start gap-3 ${
            quotaExceeded
              ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50'
              : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50'
          }`}
        >
          <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${quotaExceeded ? 'text-amber-500' : 'text-red-500'}`} />
          <div className="min-w-0">
            <p className={`text-sm ${quotaExceeded ? 'text-amber-800 dark:text-amber-300' : 'text-red-800 dark:text-red-400'}`}>
              {actionError}
            </p>
            {quotaExceeded && (
              <Link
                to="/billing"
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> View plans
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const boardPanel = (
    <div className="flex flex-col h-full min-h-0 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
        <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Action Items Board</h2>
        {canEdit && (
          <button
            onClick={handleAddTask}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 py-1 rounded-md transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add task
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <KanbanBoard
          items={board.actionItems}
          canEdit={canEdit}
          filter={boardFilter}
          onItemMove={(itemId, assignee) => wrap(moveItem(itemId, assignee))}
          onItemUpdate={(itemId, updates: Partial<ActionItem>) => wrap(updateItem(itemId, updates))}
          onItemDelete={(itemId) => wrap(deleteItem(itemId))}
        />
      </div>
    </div>
  );

  const commentsPanel = (
    <div className="h-full min-h-0 flex flex-col">
      <CommentsSection
        comments={board.comments ?? []}
        canEdit={canEdit}
        onAddComment={(text) => wrap(addComment(text))}
      />
    </div>
  );

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans overflow-hidden transition-colors">
      <Header
        center={
          <div className="flex items-center gap-2 min-w-0 ml-1 pl-3 border-l border-slate-200 dark:border-slate-800">
            <Link to="/" aria-label="Back to boards" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[200px] lg:max-w-[260px]">
              {board.name}
            </span>
            {!canEdit && (
              <span className="hidden sm:flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                <Eye className="w-3 h-3" /> View only
              </span>
            )}
            <PresenceBadge isConnected={isConnected} names={presence.map((p) => p.name)} />
          </div>
        }
        actions={
          <>
            {board.role === 'OWNER' && (
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
            )}
            <button
              onClick={downloadReport}
              disabled={!hasReport}
              title="Export full report: tasks, decisions, risks & dependencies (CSV)"
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Report</span>
            </button>
            <button
              onClick={() => downloadCSV('trello')}
              disabled={!hasItems}
              title="Export action items to Trello (CSV)"
              className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <DownloadCloud className="w-4 h-4" /> Trello
            </button>
            <button
              onClick={() => downloadCSV('jira')}
              disabled={!hasItems}
              title="Export action items to Jira (CSV)"
              className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <DownloadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Export to Jira</span>
            </button>
          </>
        }
      />

      <main className="flex-1 min-h-0 p-4 md:p-6 flex flex-col overflow-hidden transition-colors">
        {hasReport && <BoardSummaryBar board={board} onSelect={handleChip} activeKey={activeChip} />}
        {isDesktop ? (
          <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
            <div className="col-span-3 min-h-0">{transcriptPanel}</div>
            <div className={`${commentsCollapsed ? 'col-span-8' : 'col-span-6'} min-h-0`}>{boardPanel}</div>
            {commentsCollapsed ? (
              <div className="col-span-1 min-h-0">
                <CollapsedCommentsRail unread={unreadComments} onExpand={() => setCommentsCollapsed(false)} />
              </div>
            ) : (
              <div className="col-span-3 min-h-0 flex flex-col">
                <CommentsSection
                  comments={board.comments ?? []}
                  canEdit={canEdit}
                  onAddComment={(text) => wrap(addComment(text))}
                  onCollapse={() => setCommentsCollapsed(true)}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="shrink-0 grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <MobileTabButton active={mobileTab === 'brain'} onClick={() => setMobileTab('brain')} icon={<Brain className="w-4 h-4" />} label="AI Brain" />
              <MobileTabButton active={mobileTab === 'board'} onClick={() => setMobileTab('board')} icon={<Columns3 className="w-4 h-4" />} label="Board" />
              <MobileTabButton active={mobileTab === 'comments'} onClick={() => setMobileTab('comments')} icon={<MessageSquare className="w-4 h-4" />} label="Comments" badge={unreadComments} />
            </div>
            <div className="flex-1 min-h-0 mt-4">
              {/* All panels stay mounted (state preserved); only the active one shows. */}
              <div className={mobileTab === 'brain' ? 'h-full' : 'hidden'}>{transcriptPanel}</div>
              <div className={mobileTab === 'board' ? 'h-full' : 'hidden'}>{boardPanel}</div>
              <div className={mobileTab === 'comments' ? 'h-full' : 'hidden'}>{commentsPanel}</div>
            </div>
          </div>
        )}
      </main>

      {showShare && board.role === 'OWNER' && (
        <ShareModal
          boardId={board.id}
          share={board.share}
          onShareChange={(share: ShareInfo) => patchBoard({ share })}
          onClose={() => setShowShare(false)}
        />
      )}

      {needsDisplayName && (
        <SetNameModal
          boardName={board.name}
          defaultName={user?.name ?? ''}
          onSubmit={setDisplayName}
        />
      )}
    </div>
  );
}

function MobileTabButton({
  active, onClick, icon, label, badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-colors ${
        active
          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge ? (
        <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-1.5 rounded-full">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function CollapsedCommentsRail({ unread, onExpand }: { unread: number; onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      title="Expand team comments"
      aria-label={unread > 0 ? `Expand team comments, ${unread} unread` : 'Expand team comments'}
      className="h-full w-full flex flex-col items-center gap-3 py-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
    >
      <ChevronLeft className="w-4 h-4 text-slate-400" />
      <div className="relative">
        <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        {unread > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>
      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 [writing-mode:vertical-rl] rotate-180">
        Team Comments
      </span>
    </button>
  );
}

function PresenceBadge({ isConnected, names }: { isConnected: boolean; names: string[] }) {
  const count = Math.max(names.length, 1);
  return (
    <div
      title={names.length ? `Online: ${names.join(', ')}` : undefined}
      className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium text-slate-600 dark:text-slate-300 cursor-default"
    >
      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      {isConnected ? `${count} online` : 'Offline'}
    </div>
  );
}
