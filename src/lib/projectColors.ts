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
  /** The 8px dot that marks a project. The only place a project colour shows. */
  dot: string;
}

// Full literal class strings so Tailwind's scanner keeps them in the build.
const CLASSES: Record<ProjectColor, ColorClasses> = {
  indigo: { dot: 'bg-label-indigo' },
  emerald: { dot: 'bg-label-emerald' },
  amber: { dot: 'bg-label-amber' },
  rose: { dot: 'bg-label-rose' },
  sky: { dot: 'bg-label-sky' },
  violet: { dot: 'bg-label-violet' },
  teal: { dot: 'bg-label-teal' },
  slate: { dot: 'bg-label-slate' },
};

/** Resolve a project colour token to its Tailwind classes (falls back safely). */
export function colorClasses(color: ProjectColor): ColorClasses {
  return CLASSES[color] ?? CLASSES.indigo;
}
