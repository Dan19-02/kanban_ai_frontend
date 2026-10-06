import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ChevronDown, Download, MessageSquare, Plus, UserPlus } from 'lucide-react';
import { Header, type Crumb } from '../components/Header';
import { Minutes, type SectionFocus, type SectionKey } from '../components/Minutes';
import { TaskLanes, type TaskFilter } from '../components/TaskLanes';
import { Discussion } from '../components/Discussion';
import { ShareDialog } from '../components/ShareDialog';
import { SetNameDialog } from '../components/SetNameDialog';
import { useBoard } from '../hooks/useBoard';
import { useAuth } from '../auth/AuthContext';
import { api, ApiError } from '../api/client';
import { isUnassigned, longDate } from '../lib/format';
import { usePageTitle } from '../lib/title';
import { FullScreenLoader, Notice, Tabs } from '../ui/bits';
import { Button, buttonClass } from '../ui/Button';
import { Menu, menuItemClass } from '../ui/Menu';

type MobileTab = 'tasks' | 'minutes';

// CSV and formula-injection safe cell: neutralise a leading = + - @ tab or CR,
// then quote-escape per RFC 4180. Used for every export.
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
  return <BoardView key={id} boardId={id} />;
}

function Missing({ message }: { message: string }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <Header />
      <main className="mx-auto w-full max-w-xl px-4 pt-16 md:px-8">
        <h1 className="font-serif text-2xl font-semibold">This board is not available</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-2">{message}</p>
        <Link to="/" className={buttonClass('primary', 'md', 'mt-6')}>
          Back to your projects
        </Link>
      </main>
    </div>
  );
}

function Presence({ connected, names }: { connected: boolean; names: string[] }) {
  const here = Math.max(names.length, 1);
  return (
    <span
      title={connected && names.length ? `Here now: ${names.join(', ')}` : undefined}
      className={`mr-1 hidden items-center gap-1.5 px-2 text-xs sm:inline-flex ${connected ? 'text-ink-2' : 'font-medium text-red'}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-ink' : 'bg-red'}`} />
      {connected ? `${here} here` : 'Offline'}
    </span>
  );
}

function BoardView({ boardId }: { boardId: string }) {
  const {
    board, loading, error, isConnected, presence, canEdit,
    needsDisplayName, setDisplayName,
    analyze, moveItem, updateItem, deleteItem, addItem, addComment,
    getTaskComments, addTaskComment,
  } = useBoard(boardId);

  const { user, refreshUser } = useAuth();
  const location = useLocation();
  const startWithSample = (location.state as { sample?: boolean } | null)?.sample === true;

  const [mobileTab, setMobileTab] = useState<MobileTab>('tasks');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [showShare, setShowShare] = useState(false);
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [focusSection, setFocusSection] = useState<SectionFocus | null>(null);
  const focusNonce = useRef(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  const [addingTask, setAddingTask] = useState(false);
  const [nameSkipped, setNameSkipped] = useState(false);
  const [project, setProject] = useState<{ id: string; name: string } | null>(null);

  // People who can be mentioned or are involved here: task owners, anyone who
  // has commented, and whoever is present right now.
  const people = useMemo(() => {
    const set = new Set<string>();
    for (const it of board?.actionItems ?? []) {
      if (it.assignee && !isUnassigned(it.assignee)) set.add(it.assignee);
    }
    for (const c of board?.comments ?? []) set.add(c.author);
    for (const p of presence) set.add(p.name);
    return [...set].sort();
  }, [board, presence]);

  // The project's name for the breadcrumb. Someone with access to this board
  // alone gets no project crumb, rather than a link that leads nowhere.
  const projectId = board?.projectId ?? null;
  useEffect(() => {
    setProject(null);
    if (!projectId) return;
    let cancelled = false;
    api.projects
      .get(projectId)
      .then(({ project }) => !cancelled && setProject({ id: project.id, name: project.name }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // On a phone, an empty board opens on Minutes: that is where the transcript goes.
  const landed = useRef(false);
  useEffect(() => {
    if (!board || landed.current) return;
    landed.current = true;
    if (canEdit && !board.summary && board.actionItems.length === 0) setMobileTab('minutes');
  }, [board, canEdit]);

  // On a phone the page scrolls as one document. Changing section brings the new
  // one up to just under the pinned bars, rather than keeping the old offset.
  const mainRef = useRef<HTMLElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const tabSeen = useRef(false);
  useEffect(() => {
    if (!tabSeen.current) {
      tabSeen.current = true;
      return;
    }
    const main = mainRef.current;
    if (!main || window.matchMedia('(min-width: 1024px)').matches) return;
    const pinned = 56 + (tabBarRef.current?.offsetHeight ?? 0);
    const top = main.getBoundingClientRect().top + window.scrollY - pinned;
    if (window.scrollY > top) window.scrollTo({ top });
  }, [mobileTab]);

  // --- Board discussion: unread count while it is closed ---
  const [discussionOpen, setDiscussionOpen] = useState(false);
  const [seenComments, setSeenComments] = useState<number | null>(null);
  const commentsInited = useRef(false);
  const commentCount = board?.comments?.length ?? 0;

  // Comments already there on first load count as seen.
  useEffect(() => {
    if (board && !commentsInited.current) {
      setSeenComments(board.comments?.length ?? 0);
      commentsInited.current = true;
    }
  }, [board]);

  useEffect(() => {
    if (discussionOpen) setSeenComments(commentCount);
  }, [discussionOpen, commentCount]);

  const unread = discussionOpen || seenComments === null ? 0 : Math.max(0, commentCount - seenComments);

  usePageTitle(board?.name);

  // Resolves true on success so the transcript box can clear; false keeps the
  // text there for another try.
  const handleAnalyze = async (transcript: string): Promise<boolean> => {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    setQuotaExceeded(false);
    try {
      await analyze(transcript);
      refreshUser(); // update the remaining-transcription count
      setFilter('all');
      setMobileTab('tasks');
      return true;
    } catch (err) {
      setQuotaExceeded(err instanceof ApiError && err.status === 402);
      setAnalyzeError(
        err instanceof ApiError ? err.message : 'The transcript could not be read. Check your connection and try again.',
      );
      return false;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const wrap = (work: Promise<unknown>) =>
    work.catch((err) =>
      setActionError(err instanceof ApiError ? err.message : 'That change was not saved. Try again.'),
    );

  const handleAddTask = async () => {
    setAddingTask(true);
    setActionError(null);
    try {
      const created = await addItem({ title: 'New task', assignee: 'Unassigned', priority: 'Medium' });
      setFilter('all');
      setMobileTab('tasks');
      if (created) {
        setNewTaskId(created.id);
        setSelectedId(created.id);
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'The task could not be added. Try again.');
    } finally {
      setAddingTask(false);
    }
  };

  // Task-only exports, shaped for direct import into Trello or Jira.
  const downloadTasks = (platform: 'trello' | 'jira') => {
    const items = board?.actionItems ?? [];
    if (items.length === 0) return;
    const rows =
      platform === 'jira'
        ? ['Summary,Assignee,Issue Type', ...items.map((i) => `${csvCell(i.title)},${csvCell(i.assignee)},Task`)]
        : ['Title,List (Assignee)', ...items.map((i) => `${csvCell(i.title)},${csvCell(i.assignee)}`)];
    saveCsv(`${platform}-export.csv`, rows);
  };

  // The whole record: tasks, decisions, risks, blockers, dependencies, open questions.
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

  if (loading) return <FullScreenLoader />;
  if (error || !board) {
    return <Missing message={error ?? 'It may have been deleted, or it has not been shared with you.'} />;
  }

  const items = board.actionItems;
  const hasItems = items.length > 0;
  const hasRecord = Boolean(
    hasItems ||
      board.keyDecisions?.length ||
      board.risks?.length ||
      board.blockers?.length ||
      board.dependencies?.length ||
      board.openQuestions?.length,
  );

  const jump = (key: SectionKey) => {
    focusNonce.current += 1;
    setFocusSection({ key, nonce: focusNonce.current });
    setMobileTab('minutes');
  };
  const show = (next: TaskFilter) => {
    setFilter((current) => (current === next ? 'all' : next));
    setMobileTab('tasks');
  };

  // The index line under the title: every count is a way in. Task counts filter
  // the lanes; the rest jump to that part of the minutes.
  const index: { n: number; label: string; onClick: () => void; pressed?: boolean; alert?: boolean }[] = [
    { n: items.length, label: items.length === 1 ? 'task' : 'tasks', onClick: () => show('all') },
    { n: items.filter((i) => i.status === 'completed').length, label: 'done', onClick: () => show('completed'), pressed: filter === 'completed' },
    { n: items.filter((i) => i.priority === 'High').length, label: 'high priority', onClick: () => show('high'), pressed: filter === 'high' },
    { n: board.blockers?.length ?? 0, label: (board.blockers?.length ?? 0) === 1 ? 'blocker' : 'blockers', onClick: () => jump('blockers'), alert: true },
    { n: board.keyDecisions?.length ?? 0, label: (board.keyDecisions?.length ?? 0) === 1 ? 'decision' : 'decisions', onClick: () => jump('decisions') },
    { n: board.risks?.length ?? 0, label: (board.risks?.length ?? 0) === 1 ? 'risk' : 'risks', onClick: () => jump('risks') },
    { n: board.dependencies?.length ?? 0, label: (board.dependencies?.length ?? 0) === 1 ? 'dependency' : 'dependencies', onClick: () => jump('dependencies') },
    { n: board.openQuestions?.length ?? 0, label: (board.openQuestions?.length ?? 0) === 1 ? 'open question' : 'open questions', onClick: () => jump('questions') },
  ].filter((entry, i) => i === 0 || entry.n > 0);

  const crumbs: Crumb[] = [
    ...(project ? [{ label: project.name, to: `/project/${project.id}` }] : []),
    { label: board.name },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-paper lg:h-dvh lg:overflow-hidden">
      <Header crumbs={crumbs} aside={<Presence connected={isConnected} names={presence.map((p) => p.name)} />} />

      <div className="shrink-0 px-4 pt-5 md:px-8 md:pt-6">
        <div className="double-rule pb-4">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0 flex-1 basis-72">
              <h1 className="font-serif text-[1.75rem] leading-tight font-semibold tracking-[-0.01em] md:text-[2rem]">
                {board.name}
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {board.role === 'OWNER' && (
                <Button icon={<UserPlus className="h-4 w-4" aria-hidden />} onClick={() => setShowShare(true)} aria-label="Share">
                  <span className="hidden sm:inline">Share</span>
                </Button>
              )}
              <Button
                icon={<MessageSquare className="h-4 w-4" aria-hidden />}
                onClick={() => setDiscussionOpen(true)}
                aria-label={unread > 0 ? `Discussion, ${unread} unread` : 'Discussion'}
              >
                <span className="hidden sm:inline">Discussion</span>
                {unread > 0 ? (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-red px-1 text-[0.625rem] leading-none font-semibold text-on-red tabular-nums">
                    {unread > 9 ? '9+' : unread}
                  </span>
                ) : (
                  commentCount > 0 && <span className="text-xs font-normal text-ink-3 tabular-nums">{commentCount}</span>
                )}
              </Button>
              <Menu
                button={(trigger) => (
                  <Button {...trigger} icon={<Download className="h-4 w-4" aria-hidden />} disabled={!hasRecord} aria-label="Export">
                    <span className="hidden sm:inline">Export</span>
                    <ChevronDown className="hidden h-3.5 w-3.5 text-ink-3 sm:block" aria-hidden />
                  </Button>
                )}
              >
                {(close) => (
                  <>
                    <button type="button" role="menuitem" className={menuItemClass} onClick={() => { close(); downloadReport(); }}>
                      Full report (CSV)
                    </button>
                    <button type="button" role="menuitem" className={menuItemClass} disabled={!hasItems} onClick={() => { close(); downloadTasks('trello'); }}>
                      Tasks for Trello (CSV)
                    </button>
                    <button type="button" role="menuitem" className={menuItemClass} disabled={!hasItems} onClick={() => { close(); downloadTasks('jira'); }}>
                      Tasks for Jira (CSV)
                    </button>
                  </>
                )}
              </Menu>
              {canEdit && (
                <Button
                  variant={hasRecord ? 'primary' : 'secondary'}
                  icon={<Plus className="h-4 w-4" aria-hidden />}
                  loading={addingTask}
                  onClick={handleAddTask}
                >
                  Add task
                </Button>
              )}
            </div>
          </div>
          {hasRecord ? (
            <p className="mt-1.5 -mx-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[0.8125rem] text-ink-2">
              <span className="mx-1 text-ink-3">Filed {longDate(board.createdAt)}</span>
              {!canEdit && <span className="mx-1 font-medium text-ink">View only</span>}
              {index.map((entry) => (
                <button
                  key={entry.label}
                  type="button"
                  onClick={entry.onClick}
                  aria-pressed={entry.pressed}
                  className="shrink-0 rounded-[2px] px-1 py-1 transition-colors duration-150 hover:bg-wash hover:text-ink aria-pressed:bg-ink aria-pressed:text-on-ink"
                >
                  <span className={`font-semibold tabular-nums ${entry.pressed ? '' : entry.alert ? 'text-red' : 'text-ink'}`}>
                    {entry.n}
                  </span>{' '}
                  {entry.label}
                </button>
              ))}
            </p>
          ) : (
            <p className="mt-2 text-sm text-ink-2">
              <span className="text-ink-3">Filed {longDate(board.createdAt)}.</span>{' '}
              {canEdit ? 'No minutes yet. Paste the meeting transcript to fill this board.' : 'View only. No minutes yet.'}
            </p>
          )}
        </div>

        {actionError && (
          <Notice className="mt-3">
            {actionError}{' '}
            <button type="button" className="link" onClick={() => setActionError(null)}>
              Dismiss
            </button>
          </Notice>
        )}

      </div>

      {/* The section tabs stay within reach while a phone scrolls the page. */}
      <div ref={tabBarRef} className="sticky top-14 z-20 bg-paper px-4 pt-3 md:px-8 lg:hidden">
        <Tabs
          label="Board sections"
          value={mobileTab}
          onChange={setMobileTab}
          tabs={[
            { value: 'tasks', label: 'Tasks' },
            { value: 'minutes', label: 'Minutes' },
          ]}
        />
      </div>

      <main ref={mainRef} className="flex-1 lg:grid lg:min-h-0 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)] 2xl:grid-cols-[26rem_minmax(0,1fr)]">
        {/* Both stay mounted so a half-written transcript survives a tab switch. */}
        <aside
          aria-label="Minutes"
          className={`relative pt-3 lg:block lg:h-full lg:min-h-0 lg:overflow-y-auto lg:border-r lg:border-rule ${mobileTab === 'minutes' ? 'block' : 'hidden'}`}
        >
          <h2 className="sr-only">Minutes</h2>
          <Minutes
            analysis={board}
            canEdit={canEdit}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
            focus={focusSection}
            remaining={user && !user.usage.unlimited ? user.usage.remaining : null}
            startWithSample={startWithSample}
            error={
              analyzeError && (
                <Notice tone={quotaExceeded ? 'info' : 'error'}>
                  {analyzeError}
                  {quotaExceeded && (
                    <>
                      {' '}
                      <Link to="/billing" className="link">
                        See plans
                      </Link>
                    </>
                  )}
                </Notice>
              )
            }
          />
        </aside>

        <section
          aria-label="Tasks"
          className={`min-w-0 flex-col lg:flex lg:h-full lg:min-h-0 ${mobileTab === 'tasks' ? 'flex' : 'hidden'}`}
        >
          <h2 className="sr-only">Tasks</h2>
          <TaskLanes
            items={items}
            canEdit={canEdit}
            filter={filter}
            onFilterChange={setFilter}
            selectedId={selectedId}
            onSelect={(next) => {
              setSelectedId(next);
              if (next !== newTaskId) setNewTaskId(null);
            }}
            selectedIsNew={selectedId !== null && selectedId === newTaskId}
            people={people}
            loadTaskComments={getTaskComments}
            addTaskComment={addTaskComment}
            onItemMove={(itemId, assignee) => wrap(moveItem(itemId, assignee))}
            onItemUpdate={(itemId, updates) => wrap(updateItem(itemId, updates))}
            onItemDelete={(itemId) => wrap(deleteItem(itemId))}
          />
        </section>
      </main>

      {showShare && board.role === 'OWNER' && (
        <ShareDialog kind="board" id={board.id} name={board.name} onClose={() => setShowShare(false)} />
      )}

      {discussionOpen && (
        <Discussion
          comments={board.comments ?? []}
          canEdit={canEdit}
          people={people}
          onAdd={(text) => wrap(addComment(text))}
          onClose={() => setDiscussionOpen(false)}
        />
      )}

      {needsDisplayName && !nameSkipped && (
        <SetNameDialog
          boardName={board.name}
          defaultName={user?.name ?? ''}
          onSubmit={setDisplayName}
          onSkip={() => setNameSkipped(true)}
        />
      )}
    </div>
  );
}
