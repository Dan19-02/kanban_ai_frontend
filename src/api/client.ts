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

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
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
    register: (input: { name: string; email: string; password: string }) =>
      request<{ user: User }>('/auth/register', { method: 'POST', body: body(input) }),
    login: (input: { email: string; password: string }) =>
      request<{ user: User }>('/auth/login', { method: 'POST', body: body(input) }),
    logout: () => request<{ ok: true }>('/auth/logout', { method: 'POST' }),
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
