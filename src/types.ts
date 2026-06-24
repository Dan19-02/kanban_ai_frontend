export interface ActionItem {
  id: string;
  title: string;
  assignee: string;
  description?: string;
  status?: 'pending' | 'completed';
  priority?: 'High' | 'Medium' | 'Low';
  dueDate?: string;
  /** Titles of other tasks that must finish before this one. */
  blockedBy?: string[];
}

export interface SentimentInfo {
  score: string;
  breakdown: string;
}

export interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

/** The collaborative document state broadcast over the realtime channel. */
export interface MeetingAnalysis {
  summary: string;
  keyDecisions: string[];
  /** Risks, concerns, and blockers raised in the meeting. */
  risks: string[];
  /** Blocking dependencies / required sequencing between work items. */
  dependencies: string[];
  /** Impediments currently stopping progress. */
  blockers: string[];
  /** Questions raised but left unanswered. */
  openQuestions: string[];
  sentimentInfo: SentimentInfo | null;
  actionItems: ActionItem[];
  comments?: Comment[];
}

// --- Auth & boards ---

export type Plan = 'FREE' | 'STARTER' | 'PRO' | 'UNLIMITED';

export interface Usage {
  used: number;
  /** null means unlimited */
  limit: number | null;
  remaining: number | null;
  unlimited: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  plan: Plan;
  usage: Usage;
  subscriptionStatus?: string | null;
  currentPeriodEnd?: string | null;
}

export interface PlanCatalogItem {
  id: Plan;
  name: string;
  priceUsd: number;
  limit: number | null;
  interval: 'lifetime' | 'month';
  tagline: string;
  purchasable: boolean;
}

export interface SubscriptionInfo extends User {
  canManage: boolean;
  billingEnabled: boolean;
}

export type Role = 'OWNER' | 'EDITOR' | 'VIEWER';

// --- Projects ---

/** Colour tokens for a project (mapped to Tailwind classes in the UI). */
export type ProjectColor =
  | 'indigo'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'sky'
  | 'violet'
  | 'teal'
  | 'slate';

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: ProjectColor;
  archived: boolean;
  /** The current viewer's role on this project. */
  role: Role;
  createdAt: string;
  updatedAt: string;
}

/** A project plus the rollup counts shown on the dashboard. */
export interface ProjectSummary extends Project {
  boardCount: number;
  openTaskCount: number;
}

/** A flattened action item with its source-board context (rollup view). */
export interface RollupTask {
  id: string;
  boardId: string;
  boardName: string;
  title: string;
  assignee: string;
  status: 'pending' | 'completed';
  priority?: 'High' | 'Medium' | 'Low';
  dueDate?: string;
  blockedBy: string[];
}

/** A board's metadata plus its current collaborative state. */
export interface Board extends MeetingAnalysis {
  id: string;
  name: string;
  ownerId: string;
  /** Owning project, or null for a standalone/unfiled board. */
  projectId: string | null;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight board entry shown on the dashboard. */
export interface BoardSummary {
  id: string;
  name: string;
  role: Role;
  /** Owning project, or null for a standalone/unfiled board. */
  projectId?: string | null;
  hasAnalysis: boolean;
  itemCount: number;
  memberCount: number;
  updatedAt: string;
}

export interface Member {
  userId: string;
  name: string;
  email: string;
  role: Role;
  /** True until the member has opened the board and chosen a display name. */
  pending?: boolean;
}

/** Per-board info about the current viewer (their chosen name, etc.). */
export interface ViewerInfo {
  displayName: string;
  needsDisplayName: boolean;
}

export interface PresenceUser {
  id: string;
  name: string;
}

/** An in-app notification (named to avoid clashing with the DOM `Notification`). */
export interface AppNotification {
  id: string;
  type: 'mention' | 'assignment';
  boardId: string | null;
  actionItemId: string | null;
  actorName: string;
  text: string;
  read: boolean;
  createdAt: string;
}
