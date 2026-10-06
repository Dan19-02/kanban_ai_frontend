import React, { useEffect, useId, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FolderPlus, Plus, Trash2 } from 'lucide-react';
import { Header } from '../components/Header';
import { UsageMeter } from '../components/UsageMeter';
import { useAuth } from '../auth/AuthContext';
import { api, ApiError } from '../api/client';
import type { BoardSummary, ProjectColor, ProjectSummary } from '../types';
import { count } from '../lib/format';
import { SAMPLE_BOARD_NAME } from '../lib/sampleTranscript';
import { timeAgo } from '../lib/time';
import { usePageTitle } from '../lib/title';
import { ColorPicker, EmptyPage, Notice, PageHead, Spine } from '../ui/bits';
import { Button, IconButton } from '../ui/Button';
import { ConfirmDialog, Dialog } from '../ui/Dialog';
import { Field, TextArea, TextInput } from '../ui/Field';

type PendingDelete = { kind: 'project'; item: ProjectSummary } | { kind: 'board'; item: BoardSummary };

const ROLE_LABEL: Record<BoardSummary['role'], string> = { OWNER: 'Owner', EDITOR: 'Can edit', VIEWER: 'Can view' };

function boardMeta(board: BoardSummary): string {
  if (!board.hasAnalysis && board.itemCount === 0) return 'No minutes yet';
  return `${count(board.itemCount, 'task')}, ${count(board.memberCount, 'person', 'people')}`;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [sharedBoards, setSharedBoards] = useState<BoardSummary[]>([]);
  const [unfiledBoards, setUnfiledBoards] = useState<BoardSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  // New project
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<ProjectColor>('indigo');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const projectFormId = useId();

  // New standalone board (no project): the shortest path to a first board.
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [boardName, setBoardName] = useState('');
  const [boardSubmitting, setBoardSubmitting] = useState(false);
  const boardFormId = useId();
  const [startingSample, setStartingSample] = useState(false);

  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);

  usePageTitle('Projects');

  const load = () => {
    Promise.all([api.projects.list(), api.boards.list()])
      .then(([{ projects }, { boards }]) => {
        setProjects(projects);
        // Boards shared with me (where I am not the owner) live outside my projects.
        setSharedBoards(boards.filter((b) => b.role !== 'OWNER'));
        // My own boards that are not filed under any project.
        setUnfiledBoards(boards.filter((b) => b.role === 'OWNER' && b.projectId == null));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Your projects could not be loaded. Reload the page to try again.'));
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const { project } = await api.projects.create({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      navigate(`/project/${project.id}`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'The project was not created. Try again.');
      setSubmitting(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!boardName.trim()) return;
    setBoardSubmitting(true);
    setFormError(null);
    try {
      const { board } = await api.boards.create(boardName.trim()); // no project: standalone
      navigate(`/board/${board.id}`);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'The board was not created. Try again.');
      setBoardSubmitting(false);
    }
  };

  // Makes a board with the sample transcript already pasted, so the product can
  // be tried without a transcript to hand. Nothing is analysed until asked.
  const startSample = async () => {
    setStartingSample(true);
    setError(null);
    try {
      const { board } = await api.boards.create(SAMPLE_BOARD_NAME);
      navigate(`/board/${board.id}`, { state: { sample: true } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The sample board was not created. Try again.');
      setStartingSample(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      if (pendingDelete.kind === 'project') {
        await api.projects.remove(pendingDelete.item.id);
        setProjects((prev) => prev?.filter((p) => p.id !== pendingDelete.item.id) ?? null);
      } else {
        await api.boards.remove(pendingDelete.item.id);
        setUnfiledBoards((prev) => prev.filter((b) => b.id !== pendingDelete.item.id));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'That could not be deleted. Try again.');
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  };

  const openNewProject = () => {
    setFormError(null);
    setName('');
    setDescription('');
    setColor('indigo');
    setCreating(true);
  };
  const openNewBoard = () => {
    setFormError(null);
    setBoardName('');
    setCreatingBoard(true);
  };

  const openTasks = projects?.reduce((sum, p) => sum + p.openTaskCount, 0) ?? 0;
  const nothingYet = projects !== null && projects.length === 0 && unfiledBoards.length === 0;

  return (
    <div className="min-h-dvh bg-paper">
      <Header />

      <main className="mx-auto w-full max-w-5xl px-4 pt-6 pb-20 md:px-8 md:pt-8">
        <PageHead
          title="Projects"
          lead={
            projects && projects.length > 0
              ? `${count(projects.length, 'project')}, ${count(openTasks, 'open task')}`
              : 'One board per meeting. Projects keep related meetings together.'
          }
          actions={
            <>
              <Button icon={<FolderPlus className="h-4 w-4" aria-hidden />} onClick={openNewProject}>
                New project
              </Button>
              <Button variant="primary" icon={<Plus className="h-4 w-4" aria-hidden />} onClick={openNewBoard}>
                New board
              </Button>
            </>
          }
        />

        {user && !user.usage.unlimited && (
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-rule py-3">
            <UsageMeter usage={user.usage} plan={user.plan} />
            <Link to="/billing" className="link text-sm">
              {user.plan === 'FREE' ? 'See plans' : 'Manage plan'}
            </Link>
          </div>
        )}

        {error && <Notice className="mt-4">{error}</Notice>}

        {projects === null ? (
          !error && (
            <p className="py-10 text-sm text-ink-3" role="status">
              Loading your projects
            </p>
          )
        ) : nothingYet ? (
          <div className="mt-6">
            <EmptyPage
              title="Nothing on file yet"
              actions={
                <Button size="sm" loading={startingSample} onClick={startSample}>
                  Try it with a sample meeting
                </Button>
              }
            >
              Paste a meeting transcript and get a board of tasks, each with an owner, a priority and a date. Use New
              board above when you have a transcript, or try it first with a sample meeting.
            </EmptyPage>
          </div>
        ) : (
          projects.length > 0 && (
            <section aria-label="Your projects">
              <div className="hidden border-b border-rule py-2 pr-11 pl-7 text-xs text-ink-3 sm:flex">
                <span className="flex-1">Project</span>
                <span className="w-24 text-right">Boards</span>
                <span className="w-28 text-right">Open tasks</span>
                <span className="w-24 text-right">Updated</span>
              </div>
              <ul>
                {projects.map((project) => (
                  <li key={project.id} className="relative flex items-center gap-4 border-b border-rule py-3.5 pl-1 transition-colors duration-150 hover:bg-wash">
                    <Spine color={project.color} className="h-9 w-2" />
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/project/${project.id}`}
                        className="font-serif text-[1.0625rem] leading-snug font-semibold after:absolute after:inset-0"
                      >
                        {project.name}
                      </Link>
                      {project.description && <p className="mt-0.5 truncate text-sm text-ink-2">{project.description}</p>}
                      <p className="mt-1 text-xs text-ink-3 sm:hidden">
                        {count(project.boardCount, 'board')}, {project.openTaskCount} open, {timeAgo(project.updatedAt)}
                      </p>
                    </div>
                    <span className="hidden w-24 shrink-0 text-right text-sm text-ink-2 tabular-nums sm:block">{project.boardCount}</span>
                    <span className="hidden w-28 shrink-0 text-right text-sm text-ink-2 tabular-nums sm:block">{project.openTaskCount}</span>
                    <span className="hidden w-24 shrink-0 text-right text-sm text-ink-3 sm:block">{timeAgo(project.updatedAt)}</span>
                    {project.role === 'OWNER' ? (
                      <IconButton
                        label={`Delete ${project.name}`}
                        tone="remove"
                        onClick={() => setPendingDelete({ kind: 'project', item: project })}
                        className="relative z-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    ) : (
                      <span className="w-9 shrink-0 text-center text-xs text-ink-3">Shared</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )
        )}

        {unfiledBoards.length > 0 && (
          <BoardList
            title="Boards outside a project"
            lead="Single meetings that are not filed under a project."
            boards={unfiledBoards}
            onDelete={(board) => setPendingDelete({ kind: 'board', item: board })}
          />
        )}

        {sharedBoards.length > 0 && (
          <BoardList title="Shared with you" lead="Boards other people have given you access to." boards={sharedBoards} showRole />
        )}
      </main>

      {creatingBoard && (
        <Dialog
          title="New board"
          onClose={() => !boardSubmitting && setCreatingBoard(false)}
          footer={
            <>
              <Button onClick={() => setCreatingBoard(false)} disabled={boardSubmitting}>
                Cancel
              </Button>
              <Button type="submit" form={boardFormId} variant="primary" loading={boardSubmitting} disabled={!boardName.trim()}>
                Create board
              </Button>
            </>
          }
        >
          <form id={boardFormId} onSubmit={handleCreateBoard} className="flex flex-col gap-4">
            {formError && <Notice>{formError}</Notice>}
            <Field label="Board name" hint="Usually the meeting it comes from. It will sit outside any project.">
              {(id) => (
                <TextInput
                  id={id}
                  data-autofocus=""
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="Monday standup"
                  maxLength={120}
                  disabled={boardSubmitting}
                />
              )}
            </Field>
          </form>
        </Dialog>
      )}

      {creating && (
        <Dialog
          title="New project"
          onClose={() => !submitting && setCreating(false)}
          footer={
            <>
              <Button onClick={() => setCreating(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" form={projectFormId} variant="primary" loading={submitting} disabled={!name.trim()}>
                Create project
              </Button>
            </>
          }
        >
          <form id={projectFormId} onSubmit={handleCreate} className="flex flex-col gap-4">
            {formError && <Notice>{formError}</Notice>}
            <Field label="Project name">
              {(id) => (
                <TextInput
                  id={id}
                  data-autofocus=""
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Acme Q3 rollout"
                  maxLength={120}
                  disabled={submitting}
                />
              )}
            </Field>
            <Field label="Description" optional>
              {(id) => (
                <TextArea
                  id={id}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  maxLength={500}
                  disabled={submitting}
                  className="resize-none"
                />
              )}
            </Field>
            <div>
              <p className="mb-1.5 text-[0.8125rem] font-medium">Colour</p>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </form>
        </Dialog>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={`Delete “${pendingDelete.item.name}”?`}
          confirmLabel={pendingDelete.kind === 'project' ? 'Delete project' : 'Delete board'}
          destructive
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        >
          {pendingDelete.kind === 'project'
            ? 'The project is removed for everyone it is shared with. A project that still has boards cannot be deleted: move or delete those first.'
            : 'The board, its tasks, its minutes and its discussion are removed for everyone. This cannot be undone.'}
        </ConfirmDialog>
      )}
    </div>
  );
}

interface BoardListProps {
  title: string;
  lead: string;
  boards: BoardSummary[];
  showRole?: boolean;
  onDelete?: (board: BoardSummary) => void;
}

function BoardList({ title, lead, boards, showRole = false, onDelete }: BoardListProps) {
  return (
    <section className="mt-12">
      <h2 className="font-serif text-xl font-semibold">{title}</h2>
      <p className="mt-1 border-b border-ink pb-3 text-sm text-ink-2">{lead}</p>
      <ul>
        {boards.map((board) => (
          <li key={board.id} className="relative flex items-center gap-4 border-b border-rule py-3 pl-1 transition-colors duration-150 hover:bg-wash">
            <div className="min-w-0 flex-1">
              <Link to={`/board/${board.id}`} className="text-[0.9375rem] font-medium after:absolute after:inset-0">
                {board.name}
              </Link>
              <p className="mt-0.5 text-[0.8125rem] text-ink-3">
                {boardMeta(board)}
                <span className="sm:hidden">, {timeAgo(board.updatedAt)}</span>
              </p>
            </div>
            {showRole && <span className="shrink-0 text-[0.8125rem] text-ink-2">{ROLE_LABEL[board.role]}</span>}
            <span className="hidden w-24 shrink-0 text-right text-sm text-ink-3 sm:block">{timeAgo(board.updatedAt)}</span>
            {onDelete ? (
              <IconButton label={`Delete ${board.name}`} tone="remove" onClick={() => onDelete(board)} className="relative z-10">
                <Trash2 className="h-4 w-4" />
              </IconButton>
            ) : (
              <span className="w-1 shrink-0" aria-hidden />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
