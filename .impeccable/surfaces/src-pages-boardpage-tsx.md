---
version: 1
slug: "src-pages-boardpage-tsx"
primary_target: "src/pages/BoardPage.tsx"
related_targets: ["src/pages/DashboardPage.tsx","src/pages/ProjectPage.tsx","src/pages/LoginPage.tsx","src/pages/RegisterPage.tsx","src/pages/BillingPage.tsx"]
---

## Scope

Whole app, Operate mode. Primary target: the board page. Related: dashboard, project page, sign-in and register, billing, shared dialogs. Audience: team leads and project managers.

## Direction contract

THESIS: The board is the meeting's minute book: numbered actions, each with its owner and date in a ruled margin, beside the record of what was decided. It refuses the tray of floating cards with pastel pills.

OWN-WORLD: Bond-white paper, blue-black ink (#14213D), pale blue ledger rules (#DCE6F2), one thin red margin rule (#C8102E) that doubles as the attention ink for overdue dates and blockers. No shadows on content, 2px corners, rules instead of boxes, a double rule under page heads. A Clarendon serif for titles, section heads and the summary; a Franklin-lineage sans for everything operable; tabular figures for numbers and dates. Dark theme is the carbon copy: blue-black ground, pale ink.

STORY: The team lead sees the meeting restated as minutes, trusts it because every action has a number, an owner and a date in fixed places, then works the list: ticks, reassigns, opens an item.

FIRST VIEWPORT: Slim top bar with wordmark and breadcrumb. Meeting title in serif at about 30px, one index line of counts that filter or jump, a double rule. Left third: summary paragraph, then Decisions, Risks, Blockers, Dependencies, Open questions. Right two thirds: lanes side by side, each a person's name over ruled rows, item number in a margin left of the red rule, then title, due date and priority mark at the row end. Primary action: Add task; on an empty board, the transcript composer.

FORM: Minute Book, candidate 1 of 7 on the ordered list, chosen by the owner over the roll (seed 1963957d, kind pick). Signature interaction: ticking an action rules a line through it. Motion grammar: 150 to 200ms ease-out state changes only.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

Whether "AI Brain" is renamed "Minutes" in the product for good (done in this build, flagged to the owner).
