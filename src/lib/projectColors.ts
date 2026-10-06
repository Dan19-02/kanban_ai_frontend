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

/** Names read out for each colour. The stored token stays the API's own word. */
export const COLOR_NAMES: Record<ProjectColor, string> = {
  indigo: 'Indigo',
  emerald: 'Green',
  amber: 'Ochre',
  rose: 'Crimson',
  sky: 'Blue',
  violet: 'Violet',
  teal: 'Teal',
  slate: 'Graphite',
};

/** The CSS colour for a project token (defined per theme in index.css). */
export function projectColor(color: ProjectColor): string {
  return PROJECT_COLORS.includes(color) ? `var(--pc-${color})` : 'var(--pc-indigo)';
}
