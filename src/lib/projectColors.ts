import type { ProjectColor } from '../types';

/** Selectable project colours, in the order shown in the colour picker. */
export const PROJECT_COLORS: ProjectColor[] = [
  'indigo',
  'emerald',
  'amber',
  'rose',
  'sky',
  'violet',
  'teal',
  'slate',
];

interface ColorClasses {
  /** Small solid swatch / dot. */
  dot: string;
  /** Left accent bar on a project card. */
  bar: string;
  /** Soft tinted background (icon tiles, badges). */
  soft: string;
  /** Text/icon colour to pair with `soft`. */
  text: string;
  /** Card hover border. */
  ring: string;
}

// Full literal class strings so Tailwind's scanner keeps them in the build.
const CLASSES: Record<ProjectColor, ColorClasses> = {
  indigo: {
    dot: 'bg-indigo-500',
    bar: 'bg-indigo-500',
    soft: 'bg-indigo-50 dark:bg-indigo-900/30',
    text: 'text-indigo-600 dark:text-indigo-300',
    ring: 'hover:border-indigo-300 dark:hover:border-indigo-700',
  },
  emerald: {
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    soft: 'bg-emerald-50 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-300',
    ring: 'hover:border-emerald-300 dark:hover:border-emerald-700',
  },
  amber: {
    dot: 'bg-amber-500',
    bar: 'bg-amber-500',
    soft: 'bg-amber-50 dark:bg-amber-900/30',
    text: 'text-amber-600 dark:text-amber-300',
    ring: 'hover:border-amber-300 dark:hover:border-amber-700',
  },
  rose: {
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
    soft: 'bg-rose-50 dark:bg-rose-900/30',
    text: 'text-rose-600 dark:text-rose-300',
    ring: 'hover:border-rose-300 dark:hover:border-rose-700',
  },
  sky: {
    dot: 'bg-sky-500',
    bar: 'bg-sky-500',
    soft: 'bg-sky-50 dark:bg-sky-900/30',
    text: 'text-sky-600 dark:text-sky-300',
    ring: 'hover:border-sky-300 dark:hover:border-sky-700',
  },
  violet: {
    dot: 'bg-violet-500',
    bar: 'bg-violet-500',
    soft: 'bg-violet-50 dark:bg-violet-900/30',
    text: 'text-violet-600 dark:text-violet-300',
    ring: 'hover:border-violet-300 dark:hover:border-violet-700',
  },
  teal: {
    dot: 'bg-teal-500',
    bar: 'bg-teal-500',
    soft: 'bg-teal-50 dark:bg-teal-900/30',
    text: 'text-teal-600 dark:text-teal-300',
    ring: 'hover:border-teal-300 dark:hover:border-teal-700',
  },
  slate: {
    dot: 'bg-slate-500',
    bar: 'bg-slate-500',
    soft: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
    ring: 'hover:border-slate-300 dark:hover:border-slate-600',
  },
};

/** Resolve a project colour token to its Tailwind classes (falls back safely). */
export function colorClasses(color: ProjectColor): ColorClasses {
  return CLASSES[color] ?? CLASSES.indigo;
}
