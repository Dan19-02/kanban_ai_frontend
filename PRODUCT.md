# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Team leads and project managers who run team or client meetings and need every action owned and tracked afterwards (confirmed by the owner, 2026-10-06). They arrive straight after a call with a transcript to paste, then return through the week to check who owns what, what is blocked and what was decided. Teammates join as editors or viewers on boards and projects shared with them.

## Product Purpose

TranscribeBoard turns a pasted meeting transcript into a shared kanban board. The AI extracts a summary, key decisions, sentiment, risks, blockers, dependencies, open questions and action items, each with an owner, a priority and the tasks that block it. Success is a meeting whose follow-ups are owned and visible within a minute of pasting the transcript.

## Positioning

The board is generated from what was actually said: tasks arrive already assigned to the person who committed to them, and the decisions, risks and blockers from the same meeting sit beside them. (Inferred from the product and its AI prompt. Not yet confirmed as marketing language.)

## Operating Context

- Input is a transcript pasted as text (up to 100,000 characters). One board per meeting or call.
- Projects group related boards. A project has a cross-board "All tasks" rollup.
- Boards group tasks by person, priority or due date. Tasks carry status, priority, due date, description, blocked-by and a comment thread.
- Collaboration: share a board or a project by email with edit or view access, live presence, a board chat, @mentions and a notification inbox.
- Exports: full report CSV, Trello CSV, Jira CSV.
- Plans: Free (3 transcriptions, lifetime), Starter $10/mo (30), Pro $30/mo (100), Unlimited $99/mo. A transcription is one AI analysis.

## Capabilities and Constraints

- React 19, Vite 6, Tailwind CSS 4, React Router 7, Socket.IO client. A static site that talks to a separate API.
- Light and dark themes with a manual toggle. Desktop and mobile layouts (the board becomes two tabs on small screens).
- Terminology in the product: project, board, task, transcription, owner, editor, viewer.
- The frontend holds no secrets. All data comes from the API.
- Every existing feature and page stays. The revamp changes presentation, not capability.

## Brand Commitments

- Name: TranscribeBoard. No logo asset exists; the mark before the revamp was a stock icon.
- Owner's standing rules: keep it simple and user friendly, plain language, no em or en dashes anywhere in the application.
- Must not look like a heavy enterprise suite (dense grey tables in the style of Jira or SAP).
- Must not read as generic AI-generated UI. The owner wants a professional finish with considered typography and colour.

## Evidence on Hand

No customers, testimonials, metrics or press exist. Future work must not invent them. Demo content used during design is synthetic.

## Product Principles

1. Ownership first: every task shows who owns it before anything else.
2. The meeting is the source: decisions, risks and blockers stay attached to the board they came from.
3. One minute to value: paste, analyse, see the board.
4. Plain language over jargon.
5. Calm by default: status is information, not decoration.
