import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { AppShell, type Crumb } from '../components/AppShell';
import { MeetingNotes, TranscriptForm, type SectionFocus } from '../components/TranscriptInput';
import { KanbanBoard, type View } from '../components/KanbanBoard';
import { CommentsSection } from '../components/CommentsSection';
import { ShareModal } from '../components/ShareModal';
import { SetNameModal } from '../components/SetNameModal';
import { BoardDetails, type SummaryKey } from '../components/BoardSummaryBar';
import { Alert, Button, Empty, Menu, MenuItem, PageLoading, Spinner, Tabs, buttonClass } from '../components/ui';
import { ChevronDownIcon } from '../components/icons';
import { useBoard } from '../hooks/useBoard';
import { useAuth } from '../auth/AuthContext';
import { api, ApiError } from '../api/client';
import type { ActionItem } from '../types';

// Rows in the details column that filter the tasks (the rest jump to a section of the notes).
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
  if (!id) return null;
  return <BoardView boardId={id} />;
}

function BoardView({ boardId }: { boardId: string }) {
  const {
    board, loading, error, isConnected, presence, canEdit,
    needsDisplayName, setDisplayName, displayName,
    analyze, moveItem, updateItem, deleteItem, addItem, addComment,
    getTaskComments, addTaskComment,
  } = useBoard(boardId);

  // People who can be @mentioned / are involved on this board: task assignees,
  // anyone who has commented, and whoever is currently present.
  const people = useMemo(() => {
    const set = new Set<string>();
    for (const it of board?.actionItems ?? []) {
      if (it.assignee && it.assignee !== 'Unassigned') set.add(it.assignee);
    }
    for (const c of board?.comments ?? []) set.add(c.author);
    for (const p of presence) set.add(p.name);
    return [...set].sort();
  }, [board, presence]);

  const { user, refreshUser } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [boardFilter, setBoardFilter] = useState<'all' | 'completed' | 'high'>('all');
  const [focusSection, setFocusSection] = useState<SectionFocus | null>(null);
  const focusNonce = useRef(0);

  // A details row either filters the tasks or jumps to a section of the notes.
  const tasksRef = useRef<HTMLElement | null>(null);
  const handleChip = (key: SummaryKey) => {
    const f = BOARD_FILTERS[key];
    if (f) {
      setBoardFilter((cur) => (cur === f && f !== 'all' ? 'all' : f));
      tasksRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      focusNonce.current += 1;
      setFocusSection({ key, nonce: focusNonce.current });
    }
  };
  const activeChip: SummaryKey | null =
    boardFilter === 'completed' ? 'done' : boardFilter === 'high' ? 'high' : null;

  // The side column shows details or the discussion. Comments that arrive
  // while it shows details are counted as unread on the tab.
  const [rail, setRail] = useState<'details' | 'comments'>('details');
  const [seenComments, setSeenComments] = useState<number | null>(null);
  const commentsInited = useRef(false);
  const commentsVisible = rail === 'comments';
  const commentCount = board?.comments?.length ?? 0;

  // Comments present on first load count as already seen.
  useEffect(() => {
    if (board && !commentsInited.current) {
      setSeenComments(board.comments?.length ?? 0);
      commentsInited.current = true;
    }
  }, [board]);

  // Keep comments marked read while they are on screen.
  useEffect(() => {
    if (commentsVisible) setSeenComments(commentCount);
  }, [commentsVisible, commentCount]);

  const unreadComments =
    commentsVisible || seenComments === null ? 0 : Math.max(0, commentCount - seenComments);

  // The project this board belongs to, for the breadcrumb.
  const [projectName, setProjectName] = useState<string | null>(null);
  const projectId = board?.projectId ?? null;
  useEffect(() => {
    setProjectName(null);
    if (!projectId) return;
    let cancelled = false;
    api.projects.get(projectId).then((r) => !cancelled && setProjectName(r.project.name)).catch(() => {});
    return () => { cancelled = true; };
  }, [projectId]);

  // List or board view of the tasks, remembered between visits.
  const [view, setView] = useState<View>(() => (localStorage.getItem('tb-task-view') === 'board' ? 'board' : 'list'));
  const chooseView = (v: View) => {
    setView(v);
    localStorage.setItem('tb-task-view', v);
  };

  // True for a moment after an analysis lands, so the result can be marked.
  const [justAnalysed, setJustAnalysed] = useState(false);

  // Returns true on success so the transcript box can clear and be ready for the
  // next meeting; false on failure so the user keeps their text to retry.
  const handleAnalyze = async (transcript: string): Promise<boolean> => {
    setIsAnalyzing(true);
    setActionError(null);
    setQuotaExceeded(false);
    try {
      await analyze(transcript);
      refreshUser(); // update remaining-transcription count
      setJustAnalysed(true);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setQuotaExceeded(true);
        setActionError(err.message);
      } else {
        setActionError(err instanceof ApiError ? err.message : 'Failed to analyze transcript');
      }
      return false;
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

  // A transcript handed over by the home page composer is analysed once, here.
  const location = useLocation();
  const navigate = useNavigate();
  const handedOver = (location.state as { transcript?: string } | null)?.transcript;
  const startedHandover = useRef(false);
  // Kept so the paste box can offer the text again if the analysis fails.
  const [handoverDraft, setHandoverDraft] = useState('');
  useEffect(() => {
    if (!board || !handedOver || startedHandover.current || !canEdit) return;
    startedHandover.current = true;
    setHandoverDraft(handedOver);
    // Clear the state first so a refresh does not analyse the transcript twice.
    navigate(location.pathname, { replace: true, state: null });
    void handleAnalyze(handedOver);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board, handedOver, canEdit]);

  const me = useMemo(
    () => [user?.name, displayName].filter((n): n is string => !!n),
    [user?.name, displayName],
  );

  if (loading) {
    return <AppShell crumbs={[{ label: 'Home', to: '/' }]}><PageLoading /></AppShell>;
  }

  if (error || !board) {
    return (
      <AppShell crumbs={[{ label: 'Home', to: '/' }]}>
        <div className="mx-auto w-full max-w-[1040px] px-5 py-10 lg:px-8">
          <Empty title={error ?? 'This board could not be found'}>
            <Link to="/" className="underline">Back to your boards</Link>
          </Empty>
        </div>
      </AppShell>
    );
  }

  const hasItems = board.actionItems.length > 0;
  const hasAnalysis = !!board.summary;
  const hasReport = !!(
    board.actionItems.length ||
    board.keyDecisions?.length ||
    board.risks?.length ||
    board.dependencies?.length
  );

  const crumbs: Crumb[] = [
    { label: 'Home', to: '/' },
    ...(board.projectId ? [{ label: projectName ?? 'Project', to: `/project/${board.projectId}` }] : []),
    { label: board.name },
  ];

  const ownerCount = new Set(board.actionItems.map((i) => i.assignee).filter((n) => n !== 'Unassigned')).size;
  const openTasks = board.actionItems.filter((i) => i.status !== 'completed').length;
  const online = Math.max(presence.length, 1);

  const railTabs = (
    <Tabs
      label="Side column"
      value={rail}
      onChange={setRail}
      tabs={[
        { value: 'details', label: 'Details' },
        { value: 'comments', label: 'Comments', count: unreadComments || commentCount || undefined, fresh: unreadComments > 0 },
      ]}
    />
  );
  const railBody =
    rail === 'details' ? (
      <BoardDetails board={board} me={me} onSelect={handleChip} activeKey={activeChip} />
    ) : (
      <CommentsSection
        comments={board.comments ?? []}
        canEdit={canEdit}
        people={people}
        me={me}
        onAddComment={(text) => wrap(addComment(text))}
      />
    );

  const tasksSection = (hasItems || hasAnalysis) && (
    <section ref={tasksRef} aria-labelledby="tasks-heading" className="flex scroll-mt-20 flex-col gap-4 pt-2">
                <div className="flex items-center justify-between gap-4">
                  <h2 id="tasks-heading" className="text-title font-semibold tracking-[-0.01em] text-ink">Tasks</h2>
                  {canEdit && <Button size="sm" onClick={handleAddTask}>Add task</Button>}
                </div>
                {boardFilter !== 'all' && (
                  <p className="-mt-2 text-ui text-ink-2">
                    {boardFilter === 'completed' ? 'Showing done tasks only.' : 'Showing high priority only.'}{' '}
                    <button type="button" onClick={() => setBoardFilter('all')} className="text-ink underline">Show all</button>
                  </p>
                )}
                <KanbanBoard
                  items={board.actionItems}
                  canEdit={canEdit}
                  filter={boardFilter}
                  people={people}
                  me={me}
                  view={view}
                  onViewChange={chooseView}
                  loadTaskComments={getTaskComments}
                  addTaskComment={addTaskComment}
                  onItemMove={(itemId, assignee) => wrap(moveItem(itemId, assignee))}
                  onItemUpdate={(itemId, updates: Partial<ActionItem>) => wrap(updateItem(itemId, updates))}
                  onItemDelete={(itemId) => wrap(deleteItem(itemId))}
                />
              </section>
  );

  const replaceForm = canEdit && hasAnalysis && (
    <div className="border-t border-line pt-6">
      <TranscriptForm onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} hasAnalysis />
    </div>
  );

  return (
    <AppShell
      crumbs={crumbs}
      actions={
        <>
          <span
            title={presence.length ? `Here now: ${presence.map((p) => p.name).join(', ')}` : undefined}
            className="mr-1 hidden items-center gap-1.5 text-meta text-ink-3 sm:flex"
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isConnected ? 'bg-ok' : 'bg-danger'}`} aria-hidden="true" />
            {isConnected ? (online === 1 ? 'Only you here' : `${online} here now`) : 'Offline'}
          </span>
          <Menu
            trigger={(props) => (
              <button type="button" {...props} disabled={!hasReport} className={buttonClass('ghost', 'md')}>
                Export <ChevronDownIcon className="-mr-1" />
              </button>
            )}
          >
            {(close) => (
              <>
                <MenuItem onClick={() => { close(); downloadReport(); }}>Full report, CSV</MenuItem>
                <MenuItem disabled={!hasItems} onClick={() => { close(); downloadCSV('jira'); }}>Tasks for Jira</MenuItem>
                <MenuItem disabled={!hasItems} onClick={() => { close(); downloadCSV('trello'); }}>Tasks for Trello</MenuItem>
              </>
            )}
          </Menu>
          {board.role === 'OWNER' && <Button onClick={() => setShowShare(true)}>Share</Button>}
        </>
      }
    >
      <div className="mx-auto w-full max-w-[1120px] px-5 pb-24 pt-10 lg:px-8">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-14">
          <article className="flex min-w-0 flex-col gap-9">
            <header>
              <h1 className="text-display font-semibold tracking-[-0.02em] text-ink">{board.name}</h1>
              <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-ui text-ink-2">
                <span>{new Date(board.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {hasItems && (
                  <>
                    <span aria-hidden="true" className="text-ink-3">/</span>
                    <span className={justAnalysed ? 'mark-sweep' : undefined}>
                      {openTasks} of {board.actionItems.length} tasks open
                    </span>
                    <span aria-hidden="true" className="text-ink-3">/</span>
                    <span>{ownerCount} {ownerCount === 1 ? 'owner' : 'owners'}</span>
                  </>
                )}
                {!canEdit && <span className="rounded bg-wash-2 px-1.5 py-0.5 text-meta text-ink-2">View only</span>}
              </p>
            </header>

            {actionError && (
              <Alert tone={quotaExceeded ? 'warn' : 'danger'} onDismiss={() => setActionError(null)}>
                {actionError}{' '}
                {quotaExceeded && <Link to="/billing" className="font-medium underline">See the plans</Link>}
              </Alert>
            )}

            {isAnalyzing && !hasAnalysis ? (
              <div className="flex items-center gap-3 rounded-lg bg-wash px-4 py-5 text-ui text-ink-2" role="status">
                <Spinner className="h-4 w-4 text-ink" />
                <span>
                  <span className="font-medium text-ink">Reading the transcript.</span>{' '}
                  This usually takes under a minute. You can leave this page open.
                </span>
              </div>
            ) : (
              canEdit && !hasAnalysis && (
                <TranscriptForm onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} hasAnalysis={false} initialText={handoverDraft} />
              )
            )}
            {!canEdit && !hasAnalysis && !hasItems && (
              <Empty title="Nothing here yet">The owner has not added a transcript to this board.</Empty>
            )}

            <MeetingNotes analysis={board} focus={focusSection} />

            {/* On small screens the side column sits here, between notes and tasks. */}
            {(hasReport || commentCount > 0) && (
              <div className="flex flex-col gap-5 lg:hidden">
                {railTabs}
                {railBody}
              </div>
            )}

            {view === 'list' && tasksSection}

            {view === 'list' && replaceForm}
          </article>

          <aside aria-label="Board details and comments" className="hidden lg:block">
            <div className="sticky top-[4.5rem] flex flex-col gap-5">
              {railTabs}
              {railBody}
            </div>
          </aside>
        </div>

        {/* The board view needs the full width, so it sits under both columns. */}
        {view === 'board' && (
          <div className="mt-9 flex flex-col gap-9">
            {tasksSection}
            {replaceForm}
          </div>
        )}
      </div>

      {showShare && board.role === 'OWNER' && (
        <ShareModal kind="board" id={board.id} onClose={() => setShowShare(false)} />
      )}

      {needsDisplayName && (
        <SetNameModal boardName={board.name} defaultName={user?.name ?? ''} onSubmit={setDisplayName} />
      )}
    </AppShell>
  );
}
