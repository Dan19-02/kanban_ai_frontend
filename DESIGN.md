---
name: TranscribeBoard
description: "The Minute Book: a white page, blue-black ink, pale blue ledger rules and one red margin rule, with a carbon copy dark theme."
colors:
  # Primary: the ink
  ink: "#14213d"
  on-ink: "#ffffff"
  # Secondary: the red
  red: "#c8102e"
  red-wash: "#fdeef0"
  on-red: "#ffffff"
  # Tertiary: project binding colours
  pc-indigo: "#2f3f9e"
  pc-emerald: "#1f7a55"
  pc-amber: "#b97a0a"
  pc-rose: "#b83250"
  pc-sky: "#2a7fb3"
  pc-violet: "#6a46a8"
  pc-teal: "#1b7f86"
  pc-slate: "#5b667a"
  # Neutral: page, washes, rules, text
  paper: "#ffffff"
  wash: "#f2f6fb"
  wash-2: "#e3ebf6"
  rule: "#dce6f2"
  rule-2: "#b9c6da"
  edge: "#8090ad"
  ink-2: "#44506b"
  ink-3: "#667189"
  scrim: "rgb(20 33 61 / 0.42)"
  # Dark theme: the same tokens under the .dark class
  ink-dark: "#e9eef7"
  on-ink-dark: "#0f1626"
  red-dark: "#ff6b7d"
  red-wash-dark: "#2b1622"
  on-red-dark: "#0f1626"
  pc-indigo-dark: "#8492ea"
  pc-emerald-dark: "#4fb98d"
  pc-amber-dark: "#e0aa3e"
  pc-rose-dark: "#ea748d"
  pc-sky-dark: "#62b3e0"
  pc-violet-dark: "#a78de2"
  pc-teal-dark: "#55b9c0"
  pc-slate-dark: "#9aa5b8"
  paper-dark: "#0f1626"
  wash-dark: "#172036"
  wash-2-dark: "#202c49"
  rule-dark: "#232f4a"
  rule-2-dark: "#34425f"
  edge-dark: "#5d6c8c"
  ink-2-dark: "#b4bfd3"
  ink-3-dark: "#8c98b0"
  scrim-dark: "rgb(3 7 16 / 0.66)"
typography:
  display:
    fontFamily: '"Besley Variable", Georgia, "Times New Roman", serif'
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  display-sm:
    fontFamily: '"Besley Variable", Georgia, "Times New Roman", serif'
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  headline:
    fontFamily: '"Besley Variable", Georgia, "Times New Roman", serif'
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
  title-lg:
    fontFamily: '"Besley Variable", Georgia, "Times New Roman", serif'
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.375
  title:
    fontFamily: '"Besley Variable", Georgia, "Times New Roman", serif'
    fontSize: "0.9375rem"
    fontWeight: 600
    lineHeight: 1.5
  summary:
    fontFamily: '"Besley Variable", Georgia, "Times New Roman", serif'
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: "1.75rem"
  body:
    fontFamily: '"Public Sans Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: '"Public Sans Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  label-lg:
    fontFamily: '"Public Sans Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
  label:
    fontFamily: '"Public Sans Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.5
  caption:
    fontFamily: '"Public Sans Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: "1rem"
  micro:
    fontFamily: '"Public Sans Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1
  badge:
    fontFamily: '"Public Sans Variable", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1
rounded:
  xs: "0.125rem"
  full: "9999px"
spacing:
  unit: "0.25rem"
  control-gap: "0.5rem"
  row-inset: "0.625rem"
  control-inset: "0.75rem"
  gutter: "1rem"
  overlay-inset: "1.25rem"
  gutter-wide: "2rem"
  ledger-line: "2rem"
  ledger-margin: "2.75rem"
  lane-line: "2.75rem"
  lane-margin: "3.25rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xs}"
    padding: "0 0.875rem"
    height: "2.25rem"
  button-primary-hover:
    backgroundColor: "color-mix(in oklab, var(--ink) 88%, transparent)"
  button-primary-active:
    backgroundColor: "color-mix(in oklab, var(--ink) 78%, transparent)"
  button-secondary:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xs}"
    padding: "0 0.875rem"
    height: "2.25rem"
  button-secondary-hover:
    backgroundColor: "{colors.wash}"
  button-secondary-active:
    backgroundColor: "{colors.wash-2}"
  button-quiet:
    textColor: "{colors.ink-2}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xs}"
    padding: "0 0.875rem"
    height: "2.25rem"
  button-quiet-hover:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
  button-quiet-active:
    backgroundColor: "{colors.wash-2}"
  button-quiet-danger:
    textColor: "{colors.red}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xs}"
    padding: "0 0.875rem"
    height: "2.25rem"
  button-quiet-danger-hover:
    backgroundColor: "{colors.red-wash}"
  button-danger:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.red}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xs}"
    padding: "0 0.875rem"
    height: "2.25rem"
  button-danger-hover:
    backgroundColor: "{colors.red-wash}"
  button-destroy:
    backgroundColor: "{colors.red}"
    textColor: "{colors.on-red}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xs}"
    padding: "0 0.875rem"
    height: "2.25rem"
  button-destroy-hover:
    backgroundColor: "color-mix(in oklab, var(--red) 88%, transparent)"
  button-destroy-active:
    backgroundColor: "color-mix(in oklab, var(--red) 78%, transparent)"
  button-sm:
    typography: "{typography.label}"
    padding: "0 0.75rem"
    height: "2rem"
  icon-button:
    textColor: "{colors.ink-2}"
    rounded: "{rounded.xs}"
    size: "2.25rem"
  icon-button-hover:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
  icon-button-active:
    backgroundColor: "{colors.wash-2}"
  icon-button-remove:
    textColor: "{colors.ink-3}"
    rounded: "{rounded.xs}"
    size: "2.25rem"
  icon-button-remove-hover:
    backgroundColor: "{colors.red-wash}"
    textColor: "{colors.red}"
  icon-button-boxed:
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    size: "2.25rem"
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xs}"
    padding: "0 0.75rem"
    height: "2.25rem"
  input-disabled:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink-3}"
  textarea:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xs}"
    padding: "0.5rem 0.75rem"
  checkbox:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.xs}"
    size: "1rem"
  checkbox-checked:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
  segmented-option:
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    padding: "0 0.75rem"
    height: "2rem"
  segmented-option-hover:
    backgroundColor: "{colors.wash}"
  segmented-option-pressed:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
  tab:
    textColor: "{colors.ink-3}"
    typography: "{typography.label-lg}"
    padding: "0.25rem 0 0.625rem"
  tab-selected:
    textColor: "{colors.ink}"
  notice:
    backgroundColor: "{colors.wash}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.xs}"
    padding: "0.625rem 0.75rem"
  notice-error:
    backgroundColor: "{colors.red-wash}"
    textColor: "{colors.ink}"
  empty-page:
    textColor: "{colors.ink-2}"
    typography: "{typography.body}"
    rounded: "{rounded.xs}"
    padding: "2rem 1.5rem 2rem 3.75rem"
  dialog:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    width: "min(100vw - 2rem, 27rem)"
  dialog-wide:
    width: "min(100vw - 2rem, 34rem)"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    width: "min(100vw, 30rem)"
    height: "100dvh"
  menu:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xs}"
    padding: "0.25rem 0"
    width: "14rem"
  menu-item:
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "0.5rem 0.75rem"
  menu-item-hover:
    backgroundColor: "{colors.wash}"
  top-bar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    padding: "0 0.75rem"
    height: "3.5rem"
  page-head:
    textColor: "{colors.ink}"
    typography: "{typography.display}"
    padding: "0 0 1rem"
  lane-head:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    padding: "0 0 0.5rem"
  task-row:
    textColor: "{colors.ink}"
    typography: "{typography.label-lg}"
    padding: "0.625rem 0.25rem 0.625rem 0.75rem"
  task-row-done:
    textColor: "{colors.ink-3}"
  initials:
    textColor: "{colors.ink-2}"
    typography: "{typography.micro}"
    rounded: "{rounded.xs}"
    height: "1.5rem"
  initials-sm:
    textColor: "{colors.ink-2}"
    typography: "{typography.badge}"
    rounded: "{rounded.xs}"
    height: "1.125rem"
  count-badge:
    backgroundColor: "{colors.red}"
    textColor: "{colors.on-red}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
    height: "1rem"
  count-badge-sm:
    backgroundColor: "{colors.red}"
    textColor: "{colors.on-red}"
    typography: "{typography.badge}"
    rounded: "{rounded.full}"
    height: "0.875rem"
---

# Design System: TranscribeBoard

## Overview

**Creative North Star: "The Minute Book"**

TranscribeBoard is drawn as a bound book of meeting minutes. The page is white, the ink is blue-black, the lines are pale blue, and one red rule marks the margin. A board is a ruled sheet of numbered entries. Each task keeps its number and its due date in the margin, left of the red rule, with its tick box, title and priority mark to the right. The record of the meeting (summary, decisions, blockers, risks, dependencies and open questions) sits beside the tasks as numbered items on the same page.

The system is compact and flat. Body text is 0.875rem, default controls are 2.25rem tall, and lists are rows divided by 1px rules. Nothing in the page casts a shadow: structure comes from rules and two pale washes. Colour is close to monochrome. Ink carries text, filled buttons, selection and focus. Red is kept for the margin rule and for whatever needs attention or cannot be undone. Two typefaces split the work: Besley, a Clarendon serif, names things, and Public Sans runs the controls and the data.

The dark theme is a carbon copy of the same page: every colour token has a dark value under the `.dark` class, and no component carries a dark-only style. Motion is brief and tied to a change of state. Colours change in 150ms, a ticked task has a line drawn through its title in 200ms, and overlays rise or slide in over 160ms to 200ms. When the reader asks for reduced motion, every duration drops to 1ms. The owner has ruled out two looks: the dense grey tables of an enterprise suite, and generic generated UI.

Contract difference: the direction contract asks for 150 to 200ms ease-out state changes only; in the build the 150ms colour changes run on the framework's default curve (cubic-bezier(0.4, 0, 0.2, 1)), overlays have short entrance animations, and one loading message fades in over 300ms.

**Key Characteristics:**
- A white page, blue-black ink, pale blue 1px rules and one red margin rule.
- Lists are ruled rows, not cards. Nothing in the page casts a shadow.
- Numbers and dates keep fixed columns and tabular figures.
- Besley names things. Public Sans runs controls and data. Weights are 400, 500 and 600 only.
- 2px corners, 1px borders and one 2px ink focus ring.
- One shadow, used only by overlays.
- The dark theme remaps every token and changes nothing else.
- Ticking a task draws a line through its title.

## Colors

One ink family on a white page, one red, and eight binding colours that only say which project a thing belongs to. Every colour is a CSS custom property in `src/index.css`, with the light value on `:root` and the dark value on `.dark`. In the frontmatter the light value sits under the token's own name and the dark value under the same name with a `-dark` suffix.

### Primary
- **Blue-Black Ink** (`ink`: #14213d, dark #e9eef7): Body text and headings, the fill of primary buttons, pressed segments and ticked boxes, the focus ring, the caret, the ground of selected text, the 1px rule that opens a list and the double rule that closes a page head.
- **On Ink** (`on-ink`: #ffffff, dark #0f1626): Text and tick marks on an ink fill. In the dark theme the ink fill is pale, so this turns dark.

### Secondary
- **Margin Red** (`red`: #c8102e, dark #ff6b7d): The 1px margin rule of every task entry and every blank ruled page, and the margin line in the brand mark. As an ink it writes overdue dates, blocker numbers and the blocker count, unread counts and dots, the offline notice, a used-up allowance, the icon and border of an error notice, and destructive buttons.
- **Red Wash** (`red-wash`: #fdeef0, dark #2b1622): The ground of an error notice, and the hover fill of red-ink buttons and remove controls.
- **On Red** (`on-red`: #ffffff, dark #0f1626): Text on a red fill: the destroy button and unread count badges.

### Tertiary
- **Binding colours** (`pc-indigo` #2f3f9e, `pc-emerald` #1f7a55, `pc-amber` #b97a0a, `pc-rose` #b83250, `pc-sky` #2a7fb3, `pc-violet` #6a46a8, `pc-teal` #1b7f86, `pc-slate` #5b667a; dark #8492ea, #4fb98d, #e0aa3e, #ea748d, #62b3e0, #a78de2, #55b9c0, #9aa5b8): A project's colour, shown as the spine beside its name and as a swatch in the colour picker. The API stores only the token name. The picker reads them out as Indigo, Green, Ochre, Crimson, Blue, Violet, Teal and Graphite. Indigo is the default, and an unknown name falls back to it.

### Neutral
- **Bond White** (`paper`: #ffffff, dark #0f1626): The page, the top bar, dialogs, menus and the inside of every control.
- **Pale Wash** (`wash`: #f2f6fb, dark #172036): The hover fill for rows, quiet buttons and menu items, the ground of info and success notices, a disabled field, the panel behind the example board on the sign-in pages, and a lane that can take the task being dragged.
- **Deep Wash** (`wash-2`: #e3ebf6, dark #202c49): The pressed fill for buttons, the lane under the pointer during a drag, the highlighted option in the mention list, and the ground behind an @mention in a comment.
- **Ledger Rule** (`rule`: #dce6f2, dark #232f4a): The 1px line between rows and sections, under the top bar, across dialog heads and feet, the lines of a blank ruled page, and the track of the usage meter.
- **Heavy Rule** (`rule-2`: #b9c6da, dark #34425f): The border of overlays (dialog, sheet, menu, mention list), the box around initials, the border of info notices, link underlines at rest, empty priority bars, the breadcrumb slash and the scrollbar thumb.
- **Control Edge** (`edge`: #8090ad, dark #5d6c8c): The border of things you operate: fields, selects, secondary buttons, the segmented control, an unticked box, and the dashed box that stands for an unassigned task.
- **Second Ink** (`ink-2`: #44506b, dark #b4bfd3): Secondary text: lead lines, the items in the minutes, due dates, descriptions, and quiet button labels with their icons.
- **Faint Ink** (`ink-3`: #667189, dark #8c98b0): The quietest text: item numbers, counts, timestamps, hints, placeholders, resting tabs and parent breadcrumbs.
- **Ink Scrim** (`scrim`: rgb(20 33 61 / 0.42), dark rgb(3 7 16 / 0.66)): The backdrop behind a dialog or a sheet.

### Named Rules
**The Red Ink Rule.** Red has two jobs and no others. It draws the margin rule, and it writes what needs attention or cannot be undone: an overdue date, a blocker, an unread count, an error, the offline notice, a destructive action. A red element that is neither is wrong.

**The Token Rule.** Components never name a colour by value. The framework's default palette is switched off, so the only colours that exist are the theme tokens, and both themes follow from them. The one dark-only declaration in the build sits in the base styles and inverts the browser's date picker icon.

**The Binding Colour Rule.** The eight binding colours identify a project and do nothing else. They never colour text, controls or status.

Contract difference: the direction contract names red as the ink for overdue dates and blockers; the build also uses it for errors, destructive actions, unread counts, the offline notice and a used-up allowance.

## Typography

**Display Font:** Besley Variable (with Georgia, "Times New Roman", serif)

**Body Font:** Public Sans Variable (with ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif)

**Character:** A Clarendon serif with sturdy slabs gives names the weight of a printed record, and a plain sans keeps controls and figures quiet. Both are self-hosted variable fonts, upright only, and the build uses three weights of them: 400, 500 and 600.

### Hierarchy
- **Display** (600, 2rem, line height 1.25, tracking -0.01em): The page title in Besley, one per page. Below 48rem, and on the sign-in and register pages at every width, it is 1.75rem (`display-sm`).
- **Headline** (600, 1.25rem, line height 1.4): Besley. The titles of list sections on the home page, the title of an empty page (line height 2rem there, so it sits on the ruled lines) and the title of the example board.
- **Title Large** (600, 1.0625rem, line height 1.375): Besley. Dialog and sheet titles, project names in the project list, and the wordmark, which adds -0.01em tracking.
- **Title** (600, 0.9375rem, line height 1.5): Besley. Section heads in the minutes and the task sheet, lane heads, and the head of the notification list and the people list.
- **Summary** (400, 0.9375rem, line height 1.75rem): Besley at regular weight, for the meeting summary only. It is the one piece of running text set in the serif.
- **Body** (400, 0.875rem, line height 1.5): Public Sans. The default for everything. Running paragraphs open up to a line height of 1.625. Paragraph width is capped by its column: 28rem for empty page text and 42rem for a project description.
- **Body Small** (400, 0.8125rem, line height 1.5): Second lines: the index line under a board title, row details, role labels and captions.
- **Label Large** (500, 0.875rem, line height 1.25rem): Button labels, tab labels, task titles (line height 1.375), names in lists and text links.
- **Label** (500, 0.8125rem, line height 1.5): Field labels, small buttons and segmented options.
- **Caption** (400, 0.75rem, line height 1rem): Hints, counts, timestamps and item numbers.
- **Micro** (400, 0.6875rem, line height 1): The due date in a task's margin, which turns 600 and red when overdue, and the letters in the standard initials box at 600.
- **Badge** (600, 0.625rem, line height 1): The smallest step. The digits in a count badge and the letters in the small initials box.

A few sizes belong to one component and are not roles: plan prices (Besley 600, 2rem, line height 1), plan names (Besley 600, 1.125rem), the title of a "not available" page (Besley 600, 1.5rem), the task title inside the task sheet (Public Sans 600, 1.125rem, line height 1.375), board names in lists (Public Sans 500, 0.9375rem), and field text on touch screens (1rem, so iOS does not zoom the page on focus).

Headings from level one to three wrap balanced, paragraphs wrap pretty, and body text asks for lining figures.

### Named Rules
**The Two Voices Rule.** Besley is for names: of a page, a section, a lane, a project, a plan and a dialog, and for the summary. Public Sans is for controls, data and interface text. A name stays in Besley even when it is also a link or a toggle.

**The Three Weights Rule.** Only 400, 500 and 600 are used. Besley is always 600, except the summary at 400. There is no 700 and no italic.

**The Tabular Figures Rule.** Numbers that line up or change in place are set in tabular figures: item numbers, due dates, counts, clock times and prices.

Contract difference: the direction contract gives the page title as about 30px; the build sets 1.75rem, rising to 2rem at 48rem.

Contract difference: the direction contract keeps the sans for everything operable; in the build a name that is also a link or a toggle (project names, section heads in the minutes) stays in Besley.

Contract difference: the direction contract asks for tabular figures for numbers and dates; the build sets them on item numbers, due dates, counts, clock times and prices, and not on the filed date or on relative times such as "1h ago".

## Layout

Spacing steps are multiples of 0.25rem. Pages keep a 1rem side gutter that widens to 2rem at 48rem. Sibling controls sit 0.5rem apart. Fields, small buttons and menu items are inset 0.75rem, and dialogs and sheets are inset 1.25rem. Ruled rows are padded 0.625rem above and below (0.75rem for board rows and 0.875rem for project rows).

The top bar is sticky and 3.5rem tall on every signed-in page. List pages (projects, a project, plans and billing) are one centred column up to 64rem wide, with 1.5rem above the title (2rem from 48rem) and 5rem below the content. List sections on the home page sit 3rem apart. A "not available" page uses a 36rem column that starts 4rem down.

The board page is the exception. From 64rem it fills the window exactly and scrolls inside its two columns. The minutes take a fixed column on the left (19rem, then 22rem from 80rem and 26rem from 96rem) with a 1px Ledger Rule on its right edge, and the lanes take the rest. Lanes sit side by side 1.75rem apart, each between 16rem and 26rem wide, and the row of lanes scrolls sideways when there are more than fit. Each lane scrolls on its own and stays ruled down to its foot. Below 64rem the board is one scrolling page with two tabs, Tasks and Minutes, pinned under the top bar, and lanes stack 2rem apart. Below 40rem the two segmented controls become two selects side by side, with the search field full width beneath.

Sign-in and register split into two columns from 64rem: the form on the left in a 24rem column, and an example board on a Pale Wash panel on the right, behind a 1px Ledger Rule and slightly wider (1fr to 1.15fr). Below 64rem only the form shows.

Where a list stands as its own section (a lane, a titled list on the home page, the people list, the task rollup, the plan grid) it opens with a 1px ink rule. Lists inside the minutes and the task sheet open with a Ledger Rule.

Breakpoints are the framework defaults: 40rem, 48rem, 64rem, 80rem and 96rem. Touch is read from the pointer, not the width: on a coarse pointer buttons, icon buttons, fields, selects and segmented options grow to 2.75rem (44px).

Stacking is shallow: a row's own controls sit above its row link (10), then the board tabs (20), the top bar (30), menus (40) and the mention list (50). Dialogs and sheets use the browser's top layer.

### Named Rules
**The Ruled Row Rule.** Collections are divided by rules, never boxed into cards. A list is a column of rows, each closed by a 1px Ledger Rule, and a row that leads somewhere washes as a whole on hover.

**The Fixed Places Rule.** What is compared down a list keeps one column. The 3.25rem margin of a task row holds its number and due date, the task rollup gives the date a 3.5rem column, and the project list gives boards, open tasks and last update their own right-aligned columns (6rem, 7rem and 6rem).

Contract difference: the direction contract divides the board into a left third and a right two thirds; the build gives the minutes a fixed column and the lanes the rest.

## Elevation & Depth

The system is flat. Rows, lanes, notices, the empty page and the top bar have no shadow, at rest or on hover. Depth is told by 1px rules and by the two washes (hover, pressed, drop target). The build has exactly one shadow, and it belongs to surfaces that float above the page: centred dialogs, sheets, menus and the mention list. Each of these also has a 1px Heavy Rule border, and dialogs and sheets dim the page behind them with the Ink Scrim.

### Shadow Vocabulary
- **Overlay** (`box-shadow: 0 18px 44px -14px rgb(8 15 34 / 0.32), 0 3px 10px -3px rgb(8 15 34 / 0.14)`): Dialogs, sheets, menus and the mention list. The value is the same in both themes.

The only other box shadow in the build is the 1px ink ring a text field gains on focus. It is a focus mark, not depth.

### Named Rules
**The Flat Page Rule.** Nothing that sits in the page casts a shadow. Only a surface that floats above the page takes the overlay shadow, and it always takes the Heavy Rule border with it.

## Shapes

Corners are barely turned. Every boxed thing has a 2px radius: buttons, fields, the segmented control, notices, the empty page, centred dialogs, menus, the initials box, the tick box and colour swatches. The code writes this two ways, as the framework's 0.125rem step and as a literal 2px on the smaller marks. A sheet is square because it is docked to the edge of the window, and the example board on the sign-in pages is a square sheet of paper. The project spine has a 1px radius. Full rounding is kept for three small things: status and unread dots, count badges, and the track of the usage meter.

Borders are 1px throughout. Three lines are heavier on purpose: the double rule that closes a page head (3px double, in ink), the 2px ink underline of the selected tab, and the 2px focus ring. The only dashed line is the empty initials box of an unassigned task.

Icons come from Lucide, drawn at 1rem with a 1.75 stroke so they sit with the hairline rules (0.875rem for small chevrons and the clear control). The brand mark and the tick are drawn by hand. The mark is a ruled page with its red margin, stroked at 1.5.

### Named Rules
**The Two Pixel Rule.** Controls and containers turn their corners by 2px and no more. A fully round shape means a dot, a count or a meter track, never a button or a tag.

Contract difference: the direction contract says 2px corners; the build also uses a 1px radius on the spine and full rounding on dots, count badges and the meter track.

## Components

Shared primitives live in `src/ui` (Button, Field, Dialog, Menu and the small parts in bits). Feature components in `src/components` are built from them.

### Buttons
Plain rectangles of ink or rule. They change colour when touched and do nothing else: no lift, no scale, no shadow.
- **Shape:** 2px corners (0.125rem). 2.25rem tall with 0.875rem side padding and a 0.875rem label at 500. The small size is 2rem tall with 0.75rem padding and a 0.8125rem label. An icon is 1rem and sits 0.5rem before the label. An icon-only button is square.
- **Primary:** Ink fill with On Ink text. The main action of a page head, a form or a dialog foot.
- **Hover / Focus:** Primary drops to ink at 88% on hover and 78% when pressed. Colour changes take 150ms. Focus shows the shared ring, a 2px ink outline 2px clear of the button. A disabled button sits at 50% opacity. A busy button swaps its icon for a spinner and stops taking clicks.
- **Secondary:** The default. Paper fill, 1px Control Edge border and ink text. Pale Wash on hover, Deep Wash when pressed.
- **Quiet:** No border and no fill, Second Ink text. Pale Wash and ink text on hover, Deep Wash when pressed. For a low-weight action beside a primary one.
- **Red ink:** Quiet danger (red text, Red Wash on hover) opens a destructive flow from the foot of a sheet. Danger (Paper fill, red text, a border of red at 60%) does the same inside a settings dialog. Destroy (red fill, On Red text, 88% on hover and 78% when pressed) is the confirming button of a destructive dialog, where focus starts on Cancel.
- **Icon buttons:** 2.25rem square (2rem small) with 2px corners and a 1rem icon. Plain is Second Ink and washes on hover. Remove is Faint Ink that turns red on Red Wash, for delete controls in a list. Boxed has a Control Edge border so it can sit beside a secondary button. Each carries its label as its accessible name and its tooltip.
- **Touch:** On a coarse pointer every button and icon button is 2.75rem.

### Inputs / Fields
- **Style:** Paper fill, 1px Control Edge border, 2px corners, 0.75rem side padding and 0.875rem text, 2.25rem tall (2rem small). Placeholders are Faint Ink. Text areas add 0.5rem above and below and a line height of 1.625. Selects drop the browser's arrow for a 0.875rem chevron in Second Ink, 0.625rem from the right edge.
- **Label and hint:** The label sits 0.375rem above the field in 0.8125rem at 500. An optional field says so in Faint Ink at 400. A hint sits 0.375rem below in 0.75rem Faint Ink.
- **Focus:** The border turns Faint Ink on hover. On focus it turns ink and gains a 1px ink ring, so the edge reads as 2px. Text fields do not use the outline ring.
- **Error / Disabled:** A disabled field has a Pale Wash fill and Faint Ink text. A field has no error style of its own: the form shows an error notice.
- **Touch:** 2.75rem tall with 1rem text.
- **Mention field:** A text field whose list of people rises above it, 15rem wide with the overlay shadow. The highlighted name sits on Deep Wash.

### Checkbox, Segmented Control and Tabs
- **Checkbox:** A 1rem box with 2px corners, a Paper fill and a Control Edge border, inside a 1.25rem label whose hit area reaches 2.5rem. Hover darkens the border to ink. Ticked, it fills with ink and shows a hand-drawn tick in On Ink at stroke 2. Disabled, it sits at 60% opacity.
- **Segmented control:** A row of choices in one Control Edge box with 1px dividers. Each is 2rem tall with 0.75rem padding and a 0.8125rem label at 500 in Second Ink. The current choice is filled with ink. Hover washes the others. Focus draws the ring inside the segment.
- **Tabs:** Text tabs 1.5rem apart on a 1px Ledger Rule. A resting tab is Faint Ink at 500. The selected tab is ink with a 2px ink underline that sits on the rule.

### Cards / Containers
There are no cards. Content is held by rules, and the few boxed containers are these.
- **Notice:** An inline message with 2px corners, 0.625rem of padding above and below and 0.75rem at the sides, 0.875rem text at a line height of 1.625 and a 1rem icon at the start. An error has a Red Wash ground, a border of red at 40% and a red icon. Info and success share one look: Pale Wash ground, Heavy Rule border and a Second Ink icon, an info mark or a tick. The text is ink in all three.
- **Empty page:** A blank ruled sheet with a 1px Ledger Rule border and 2px corners: lines every 2rem and the red margin rule 2.75rem in. The title (Headline), one sentence in Second Ink and an optional small button all sit on the 2rem lines, 3.75rem from the left edge (4.25rem from 40rem).
- **Dialog:** A native modal dialog on Paper with a 1px Heavy Rule border, 2px corners and the overlay shadow, 27rem wide (34rem for the wide form) and never closer than 1rem to the window edge. The head has the title in Title Large and a close button, over a 1px Ledger Rule. The body is inset 1.25rem at the sides and 1rem above and below, and it scrolls. The foot has its buttons at the right, 0.5rem apart, under a 1px Ledger Rule. It rises 6px while fading in over 160ms (cubic-bezier(0.16, 1, 0.3, 1)).
- **Sheet:** The same dialog docked to the right edge at full height, 30rem wide, square, with a Heavy Rule on its left edge. It slides in 14px from the right over 200ms on the same curve. Task detail and the board discussion open in it. Like every dialog it is modal: the scrim sits behind it and focus stays inside.
- **Menu:** A small panel 0.375rem under its trigger: Paper, 1px Heavy Rule border, 2px corners, the overlay shadow, 14rem wide (20rem for notifications). Items are 0.875rem ink text, padded 0.5rem above and below and 0.75rem at the sides, and they wash on hover. It rises in like a dialog.
- **Plan columns:** The plans page compares plans in columns, not cards: four from 64rem, two from 40rem and one below, under a 1px ink rule. Each column closes with a 1px Ledger Rule beneath and, from 64rem, one at its side. It holds the plan name (Besley 600, 1.125rem), the price (Besley 600, 2rem, tabular), one sentence and a full-width button at its foot.
- **Shadow Strategy:** See Elevation & Depth. Only the dialog, the sheet, the menu and the mention list have one.

### Navigation
- **Top bar:** Sticky, 3.5rem tall, Paper with a 1px Ledger Rule beneath. On the left, the mark and the wordmark link home. Then the breadcrumb in 0.875rem: crumbs divided by a slash in Heavy Rule, parent crumbs in Faint Ink that darken on hover, and the current page in ink at 500. On the right sit the page's status (who is here), notifications, the theme switch and the account button, 0.125rem apart.
- **Small screens:** Below 40rem the breadcrumb gives way to one back link, a chevron and the name of the level above. When there are crumbs the wordmark hides below 48rem and the mark hides below 40rem.
- **Links:** A text link is ink at 500 with a 1px underline in Heavy Rule, 3px below the text, that darkens to ink over 150ms on hover.

### Task Lanes and Rows
The signature component: one entry in the minutes.
- **Lane head:** The owner's initials box (when lanes are grouped by person), the lane name in Title, and the task count at the right in Caption. A 1px ink rule sits 0.5rem beneath.
- **Row:** A 3.25rem margin, then the entry, over a 1px Ledger Rule. The margin is right-aligned: the task's number in 0.75rem Faint Ink, and 0.375rem beneath it the due date in Micro, Second Ink, written as "Today" or as a day and short month.
- **Entry:** A 1px red left border, which is the margin rule, with 0.625rem above and below, 0.75rem to the left and 0.25rem to the right. It holds the tick box, the title in Label Large at a line height of 1.375, and the priority mark at the row end.
- **Second line:** In Caption, Faint Ink, lined up under the title: the owner with a small initials box when the lane does not already name them, and "Waits on" with the numbers of the unfinished tasks it depends on, or their titles when they are not on the board.
- **States:** The title opens the task sheet and underlines in Heavy Rule on hover. A ticked task has a 1px line drawn through its title from the left over 200ms (cubic-bezier(0.16, 1, 0.3, 1)) while the text fades to Faint Ink over 160ms. The line follows wrapped text. An overdue, unfinished date is 600 and red.
- **Dragging:** The dragged row drops to 40% opacity. Every lane that can take it turns Pale Wash, the one under the pointer turns Deep Wash, and its count reads "Drop here".
- **Blank sheet:** From 64rem a lane stays ruled below its last task: lines every 2.75rem and the red margin rule 3.25rem in. An empty lane says "No tasks" in Faint Ink, lined up with the start of the entries.

Contract difference: the direction contract places the due date at the row end beside the priority mark; the build keeps it in the margin under the task number.

### Page Head
- **Style:** The page title in Display, an optional lead line in 0.875rem Second Ink 0.5rem below, and the page's actions at the right, 0.5rem apart, wrapping below the title when space runs out. The block closes with the double rule (3px double, in ink) 1rem below.
- **Index line:** On a board the lead is an index in Body Small: the date it was filed in Faint Ink, then one count for each part of the record. Each count is a button with its number at 600 in ink (red for blockers). Hover washes it. A count that filters the lanes is filled with ink while its filter is on, and the others jump to that part of the minutes. Counts of zero are left out, apart from the task count.
- **Below the rule:** On the projects page and the billing page a strip follows the double rule: 0.75rem of padding, the usage meter and a link or a button, closed by a Ledger Rule.

### Minutes Record
- **Summary:** A Title head, then the paragraph in the Summary style, then a tone line in 0.875rem whose opening words are ink at 600.
- **Sections:** Decisions, Blockers, Risks, Dependencies and Open questions, in that order. Each starts with a 1px Ledger Rule and 0.875rem of padding. Its head is a full-width toggle: the name in Title, its count in Caption, and a 1rem chevron at the end that turns a quarter turn over 150ms when the section closes. All start open.
- **Items:** A numbered list with the number in a 1.5rem column (Faint Ink, tabular) and the text in 0.875rem Second Ink at a line height of 1.625. Blocker numbers are 600 and red.
- **Transcript box:** A Title head, one sentence, a text area at least 16rem tall (10rem when replacing a board), a primary button with quiet actions beside it, and a line in Caption beneath.

Contract difference: the direction contract lists Risks before Blockers; the build puts Blockers second, straight after Decisions.

### Marks
- **Initials:** A person as two letters in a box 1.5rem tall, with a 1px Heavy Rule border, 2px corners and Micro letters at 600 in Second Ink. The small size is 1.125rem tall with Badge letters. Unassigned is an empty box with a dashed Control Edge border.
- **Priority mark:** Three rising bars, 0.875rem by 0.75rem. High fills three in ink, medium two, low one, and unfilled bars are Heavy Rule. Priority never uses colour.
- **Spine:** A project's binding colour as a small upright block with a 1px radius: 0.5rem by 2.25rem in the project list, and 0.5rem wide beside the title of a project's own page.
- **Count badge:** A fully round red badge with On Red digits in Badge, reading "9+" above nine. It is 1rem tall on the Discussion button and 0.875rem tall on the bell, with the same digits on both.
- **Dots:** 0.375rem and round. Ink for who is here, red for offline and for an unread notification.
- **Usage meter:** A sentence, then a track 0.25rem by 7rem in Ledger Rule, fully round, filled with ink. When the allowance is used up, the fill and the sentence turn red.
- **Mention:** An @name in a comment sits on Deep Wash with 2px corners, in ink at 500.

### Loading and Empty States
- **Loading:** A whole page waits behind a centred 1.25rem spinner in Faint Ink that turns once a second. After 3.5 seconds a sentence fades in beneath it over 300ms. Part of a page waits as one sentence in Faint Ink. There are no skeleton screens.
- **Empty:** A part of a page with nothing in it (no projects, no boards, no tasks, no match) becomes the empty page described above, with the next step in its sentence. Inside a menu or a sheet, an empty list is one sentence.

### Focus, Selection and Scrollbars
- **Focus:** One treatment everywhere: a 2px ink outline, 2px clear of the control. Inside a bordered group (a segment, a menu item, a notification) the ring is drawn 2px inward instead. Text fields use the ink border and 1px ring described above.
- **Selection and caret:** Selected text is On Ink on an ink ground. The caret is ink.
- **Scrollbars:** Thin, with a Heavy Rule thumb on a clear track.
- **Reduced motion:** When the reader asks for it, every animation and transition runs in 1ms and smooth scrolling is off.

## Do's and Don'ts

### Do:
- **Do** take every colour from the theme tokens in `src/index.css`, so the light page and its dark carbon copy change together.
- **Do** close a page head (title, lead and actions) with the double rule: 3px double, in ink, 1rem below the block.
- **Do** build lists as rows closed by a 1px Ledger Rule, and open a list that stands as its own section with a 1px ink rule.
- **Do** give numbers and dates a fixed column and tabular figures, as the 3.25rem task margin does.
- **Do** set names in Besley at 600, and everything operated, counted or dated in Public Sans.
- **Do** keep controls to the shared heights: 2.25rem, 2rem for the small size, and 2.75rem on a coarse pointer.
- **Do** show focus with the one ring: a 2px ink outline 2px clear of the control, drawn inward inside a bordered group.
- **Do** mark a finished task by drawing the 1px line through its title and dropping it to Faint Ink.
- **Do** keep state changes quick: 150ms for colour, 200ms for the line through a ticked task, and the 160ms rise or the 200ms slide for an overlay.

### Don't:
- **Don't** put a shadow on anything that sits in the page. The overlay shadow is for dialogs, sheets, menus and the mention list only.
- **Don't** use red for emphasis or decoration. It is the margin rule, and the ink of attention and of actions that cannot be undone.
- **Don't** use a binding colour for text, controls or status. It only says which project a thing belongs to.
- **Don't** add a second status hue. Success and information share the Pale Wash notice and differ by icon; only attention is red.
- **Don't** name a colour by value in a component, and don't add dark-only overrides.
- **Don't** wrap list items in cards or give rows their own boxes.
- **Don't** round a control or a container by more than 2px. Full rounding is for dots, count badges and the meter track.
- **Don't** use weight 700, italics, capitals or letter spacing for emphasis. Emphasis is weight 600, or ink against Second Ink.
- **Don't** animate layout, and don't stage rows, sections or pages with entrance animation. The rise and the slide belong to overlays, and nothing lifts, scales or glows on hover.
