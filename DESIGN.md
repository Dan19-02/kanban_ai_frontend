# Design: ink and highlighter

TranscribeBoard reads a meeting transcript and marks what matters. The interface is white paper and black ink, with one highlighter yellow that marks what is **yours** or **new**. Nothing else is coloured unless it is a warning.

Mode: operate. The user is a team lead at a laptop, straight out of a call, then back each morning to see who owns what. Scanning speed and calm beat expression.

## Rules that decide most things

1. **Words, not icons.** A control is labelled with a word. An icon appears only where there is no room for one: close, search, a menu chevron, a drag grip, "more". The whole set is in `src/components/icons.tsx`. Do not import `lucide-react` or any icon library. Never put an icon next to a text label, in a button, in a heading, or in an empty state.
2. **Lists, not cards.** Collections are rows separated by a hairline, with aligned columns. No grid of same-sized cards, no card inside a card, no icon tiles, no coloured side stripe.
3. **One highlighter.** `bg-mark text-on-mark` (or the `.mark` class) is for: the wordmark, the signed-in person's own name or monogram, and unread or new counts. It is never a button colour, never a border, never decoration.
4. **Ink does the work.** Primary action is an ink button. Selection is a grey fill plus medium weight. Links are ink with an underline. Focus is a 2px ink outline.
5. **Red means blocked or destructive. Nothing else is red.** Amber is for a limit about to be hit.
6. **No labels above headings.** No small uppercase eyebrow, no tracked-out caps. A heading is a heading.
7. **Flat.** Shadows only on floating layers (menus, dialogs), via `shadow-pop`.

## Tokens

Colours flip automatically in dark theme. Never write a `dark:` variant and never use Tailwind's built-in colour names (`slate`, `indigo`, `red`, `gray`...).

| Class root | Use |
|---|---|
| `paper` | Page and control background |
| `wash` | Sidebar, hover fill, sunken areas |
| `wash-2` | Pressed or selected fill, monogram background |
| `line` | Hairline between rows and regions |
| `line-strong` | Control borders |
| `ink` | Text, primary buttons |
| `ink-2` | Secondary text |
| `ink-3` | Meta text (dates, counts). Smallest readable grey: do not go lighter |
| `mark` / `on-mark` | The highlighter and the text on it |
| `danger` / `danger-wash` | Blocked, errors, destructive actions |
| `warn` / `warn-wash` | Limits and cautions |
| `ok` | Rare: a success confirmation |
| `label-indigo` ... `label-slate` | The eight project colours, as an 8px dot only |

Type is Hanken Grotesk Variable (self-hosted). Sizes: `text-meta` 12, `text-ui` 14 (default), `text-body` 15, `text-lead` 17, `text-title` 20, `text-display` 30. Weights: 400, 500 (`font-medium`), 600 (`font-semibold`). Never 700. Numbers that line up use the `tnum` class. Page titles are `text-display font-semibold tracking-[-0.02em]`. Section headings are `text-title font-semibold tracking-[-0.01em]`.

Shape: `rounded-md` (6px) for controls, `rounded-lg` for menus and trays, `rounded-xl` for dialogs. Control heights: 28 (`sm`), 32 (`md`), 40 (`lg`).

Spacing: page content sits in `mx-auto w-full max-w-[1040px] px-5 py-10 lg:px-8`. A row is `py-3`. Sections are separated by `mt-12`; a heading sits `mb-3` above its content.

## Building blocks (`src/components/ui.tsx`)

Use these. Do not restyle them per page and do not write one-off buttons or inputs.

- `Button` (`variant`: primary, secondary, ghost, danger; `size`: sm, md, lg; `busy`), `buttonClass()` for links that look like buttons, `IconButton` (needs `label`)
- `Field` + `Input` / `Textarea` / `Select`, `Checkbox`
- `Monogram` (`mine` highlights the signed-in person)
- `Alert` (danger, warn, neutral), `Empty`, `Spinner`, `PageLoading`
- `Segmented`, `Tabs`
- `Dialog` (title, footer, Escape and outside click close it), `Menu` + `MenuItem`
- `Wordmark`, `cx`, `initials`

`AppShell` (`src/components/AppShell.tsx`) frames every signed-in page: `<AppShell crumbs={[{label, to}]} actions={...}>`. It owns the sidebar (Home, Inbox, the project list, usage, the account menu with theme and sign out) and the "New project" dialog. Call `notifyProjectsChanged()` after a project is renamed, recoloured or deleted. It also exports `ColorPicker`.

## Copy

Plain and specific. Buttons name their action ("Create board", "Add person", "Delete project"). Errors say what happened and what to do. No exclamation marks, no em or en dashes, no "Oops". Product words: project, board, task, transcription, owner, editor, viewer. Dates read "12 Oct"; recent times use `timeAgo`.

## States

Every list has an empty state made with `Empty`: one plain sentence and the next step. Loading is `PageLoading` or a `busy` button. Destructive actions confirm in a `Dialog` with a `danger` button, never `window.confirm`.

## Fonts for production

Hanken Grotesk is the working face. If the owner licenses a paid family (the intended one is Sohne by Klim), change `--font-sans` in `src/index.css` and add the files; nothing else moves.
