import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { api, ApiError, API_BASE, getAuthToken } from '../api/client';
import type { ActionItem, Board, MeetingAnalysis, PresenceUser, ViewerInfo } from '../types';

interface UseBoardResult {
  board: Board | null;
  loading: boolean;
  error: string | null;
  isConnected: boolean;
  presence: PresenceUser[];
  canEdit: boolean;
  needsDisplayName: boolean;
  displayName: string | null;
  patchBoard: (partial: Partial<Board>) => void;
  setDisplayName: (name: string) => Promise<void>;
  analyze: (transcript: string) => Promise<void>;
  moveItem: (itemId: string, assignee: string) => Promise<void>;
  updateItem: (itemId: string, updates: Partial<ActionItem>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  addItem: (item: Partial<ActionItem>) => Promise<void>;
  addComment: (text: string) => Promise<void>;
}

export function useBoard(boardId: string): UseBoardResult {
  const [board, setBoard] = useState<Board | null>(null);
  const [viewer, setViewer] = useState<ViewerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Initial load over REST (gives us metadata + role + share + viewer info).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.boards
      .get(boardId)
      .then(({ board, viewer }) => {
        if (cancelled) return;
        setBoard(board);
        setViewer(viewer);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Failed to load board');
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  // Live updates over the authenticated socket. In production the socket
  // connects to the backend origin (API_BASE); in development API_BASE is
  // empty, so it connects same-origin and the Vite dev server proxies it.
  useEffect(() => {
    const token = getAuthToken();
    const opts = { withCredentials: true, ...(token ? { auth: { token } } : {}) };
    const socket = API_BASE ? io(API_BASE, opts) : io(opts);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-board', boardId);
    });
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('board-state', (state: MeetingAnalysis) => {
      setBoard((prev) => (prev ? { ...prev, ...state } : prev));
    });
    socket.on('presence', (users: PresenceUser[]) => setPresence(users));
    socket.on('board-error', ({ message }: { message: string }) => setError(message));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [boardId]);

  const patchBoard = useCallback((partial: Partial<Board>) => {
    setBoard((prev) => (prev ? { ...prev, ...partial } : prev));
  }, []);

  const setDisplayName = useCallback(
    async (name: string) => {
      const { displayName } = await api.boards.setDisplayName(boardId, name);
      setViewer({ displayName, needsDisplayName: false });
      // Re-announce presence so others see the chosen name immediately.
      socketRef.current?.emit('join-board', boardId);
    },
    [boardId],
  );

  const canEdit = board?.role === 'OWNER' || board?.role === 'EDITOR';

  const analyze = useCallback(
    async (transcript: string) => {
      const { board } = await api.boards.analyze(boardId, transcript);
      setBoard(board);
    },
    [boardId],
  );

  // Optimistic local mutation, reverted from the server on failure.
  const optimisticItem = useCallback(
    async (itemId: string, updates: Partial<ActionItem>) => {
      setBoard((prev) =>
        prev
          ? { ...prev, actionItems: prev.actionItems.map((i) => (i.id === itemId ? { ...i, ...updates } : i)) }
          : prev,
      );
      try {
        const { board } = await api.boards.updateItem(boardId, itemId, updates);
        setBoard(board);
      } catch (err) {
        // Re-sync with the server's truth on failure.
        const { board } = await api.boards.get(boardId);
        setBoard(board);
        throw err;
      }
    },
    [boardId],
  );

  const moveItem = useCallback(
    (itemId: string, assignee: string) => optimisticItem(itemId, { assignee }),
    [optimisticItem],
  );

  const updateItem = useCallback(
    (itemId: string, updates: Partial<ActionItem>) => optimisticItem(itemId, updates),
    [optimisticItem],
  );

  const deleteItem = useCallback(
    async (itemId: string) => {
      await api.boards.deleteItem(boardId, itemId);
      setBoard((prev) =>
        prev ? { ...prev, actionItems: prev.actionItems.filter((i) => i.id !== itemId) } : prev,
      );
    },
    [boardId],
  );

  const addItem = useCallback(
    async (item: Partial<ActionItem>) => {
      const { board } = await api.boards.addItem(boardId, item);
      setBoard(board);
    },
    [boardId],
  );

  const addComment = useCallback(
    async (text: string) => {
      const { board } = await api.boards.addComment(boardId, text);
      setBoard(board);
    },
    [boardId],
  );

  return {
    board,
    loading,
    error,
    isConnected,
    presence,
    canEdit: !!canEdit,
    needsDisplayName: viewer?.needsDisplayName ?? false,
    displayName: viewer?.displayName ?? null,
    patchBoard,
    setDisplayName,
    analyze,
    moveItem,
    updateItem,
    deleteItem,
    addItem,
    addComment,
  };
}
