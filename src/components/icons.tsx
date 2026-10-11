import type { SVGProps } from 'react';

/*
 * The whole icon set. Icons are used only where a control has no room for a
 * word (close, search, a menu chevron). Anything that can be a word is a word.
 * All are drawn on a 16px grid with a 1.5px stroke and round joins.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export const CloseIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 4l8 8M12 4l-8 8" /></Icon>
);
export const SearchIcon = (p: IconProps) => (
  <Icon {...p}><circle cx="7" cy="7" r="4.25" /><path d="M10.25 10.25L13.5 13.5" /></Icon>
);
export const ChevronDownIcon = (p: IconProps) => (
  <Icon {...p}><path d="M4 6l4 4 4-4" /></Icon>
);
export const CheckIcon = (p: IconProps) => (
  <Icon {...p}><path d="M3.5 8.5l3 3 6-7" /></Icon>
);
export const MoreIcon = (p: IconProps) => (
  <Icon {...p} stroke="none" fill="currentColor">
    <circle cx="3.5" cy="8" r="1.25" /><circle cx="8" cy="8" r="1.25" /><circle cx="12.5" cy="8" r="1.25" />
  </Icon>
);
export const GripIcon = (p: IconProps) => (
  <Icon {...p} stroke="none" fill="currentColor">
    <circle cx="6" cy="4" r="1" /><circle cx="10" cy="4" r="1" />
    <circle cx="6" cy="8" r="1" /><circle cx="10" cy="8" r="1" />
    <circle cx="6" cy="12" r="1" /><circle cx="10" cy="12" r="1" />
  </Icon>
);
export const MenuIcon = (p: IconProps) => (
  <Icon {...p}><path d="M2.5 5h11M2.5 11h11" /></Icon>
);
