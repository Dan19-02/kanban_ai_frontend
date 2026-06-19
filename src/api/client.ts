import type {
  ActionItem,
  Board,
  BoardSummary,
  Member,
  Plan,
  PlanCatalogItem,
  Role,
  ShareInfo,
  SubscriptionInfo,
  User,
  ViewerInfo,
} from '../types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Base URL of the backend API. Empty in development (requests go to the
// same-origin `/api`, which the Vite dev server proxies to the backend).
// In production set VITE_API_URL to the deployed backend's origin.
export const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

// --- Auth token (Bearer) -----------------------------------------------------
// We authenticate with an `Authorization: Bearer` header so the app works
// cross-origin on EVERY device — mobile browsers block third-party cookies,
// which is what the cookie-only flow relied on. The httpOnly cookie still
// works for same-origin deployments.
const TOKEN_KEY = 'kanban_auth_token';

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null; // storage blocked (private mode, etc.)
  }
}

let authToken: string | null = readStoredToken();

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string | null): void {
  authToken = token;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage unavailable — the in-memory token still works this session.
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${API_BASE}/api${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

const body = (data: unknown) => JSON.stringify(data);

export const api = {
  auth: {
    register: async (input: { name: string; email: string; password: string }) => {
      const data = await request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: body(input),
      });
      setAuthToken(data.token);
      return data;
    },
    login: async (input: { email: string; password: string }) => {
      const data = await request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: body(input),
      });
      setAuthToken(data.token);
      return data;
    },
    logout: async () => {
      try {
        return await request<{ ok: true }>('/auth/logout', { method: 'POST' });
      } finally {
        setAuthToken(null); // always drop the local token, even if the call fails
      }
    },
    me: () => request<{ user: User }>('/auth/me'),
  },

  boards: {
    list: () => request<{ boards: BoardSummary[] }>('/boards'),
    create: (name: string) =>
      request<{ board: Board }>('/boards', { method: 'POST', body: body({ name }) }),
    get: (id: string) => request<{ board: Board; viewer: ViewerInfo }>(`/boards/${id}`),
    rename: (id: string, name: string) =>
      request<{ board: Board }>(`/boards/${id}`, { method: 'PATCH', body: body({ name }) }),
    remove: (id: string) => request<{ ok: true }>(`/boards/${id}`, { method: 'DELETE' }),

    setDisplayName: (id: string, displayName: string) =>
      request<{ displayName: string }>(`/boards/${id}/display-name`, {
        method: 'PUT',
        body: body({ displayName }),
      }),

    analyze: (id: string, transcript: string) =>
      request<{ board: Board }>(`/boards/${id}/analyze`, {
        method: 'POST',
        body: body({ transcript }),
      }),

    join: (token: string) =>
      request<{ boardId: string }>('/boards/join', { method: 'POST', body: body({ token }) }),

    share: (id: string, role: 'EDITOR' | 'VIEWER') =>
      request<{ share: ShareInfo }>(`/boards/${id}/share`, {
        method: 'POST',
        body: body({ role }),
      }),
    unshare: (id: string) =>
      request<{ share: ShareInfo }>(`/boards/${id}/share`, { method: 'DELETE' }),

    members: (id: string) => request<{ members: Member[] }>(`/boards/${id}/members`),
    addMember: (id: string, email: string, role: Exclude<Role, 'OWNER'> = 'EDITOR') =>
      request<{ ok: true }>(`/boards/${id}/members`, { method: 'POST', body: body({ email, role }) }),
    removeMember: (id: string, userId: string) =>
      request<{ ok: true }>(`/boards/${id}/members/${userId}`, { method: 'DELETE' }),

    addItem: (id: string, item: Partial<ActionItem>) =>
      request<{ board: Board }>(`/boards/${id}/items`, { method: 'POST', body: body(item) }),
    updateItem: (id: string, itemId: string, updates: Partial<ActionItem>) =>
      request<{ board: Board }>(`/boards/${id}/items/${itemId}`, {
        method: 'PATCH',
        body: body(updates),
      }),
    deleteItem: (id: string, itemId: string) =>
      request<{ ok: true }>(`/boards/${id}/items/${itemId}`, { method: 'DELETE' }),

    addComment: (id: string, text: string) =>
      request<{ board: Board }>(`/boards/${id}/comments`, {
        method: 'POST',
        body: body({ text }),
      }),
  },

  billing: {
    plans: () =>
      request<{ plans: PlanCatalogItem[]; billingEnabled: boolean }>('/billing/plans'),
    subscription: () => request<SubscriptionInfo>('/billing/subscription'),
    checkout: (plan: Exclude<Plan, 'FREE'>) =>
      request<{ url: string }>('/billing/checkout', { method: 'POST', body: body({ plan }) }),
    portal: () => request<{ url: string }>('/billing/portal', { method: 'POST' }),
  },
};
