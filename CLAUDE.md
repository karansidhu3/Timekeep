# CLAUDE.md

This file is the entry point for all Claude Code sessions.

Read the following files in order before writing any code:

1. `docs/CLAUDE_DOCTRINE.md` — engineering principles, scope rules, decision framework
2. `docs/CLAUDE_TECHNICAL.md` — schema, file structure, auth strategy, patterns, dev sequence

Both documents are required reading. Doctrine establishes *why*. Technical establishes *how*.

When the two conflict, Doctrine takes precedence.

## When Uncertain

If a decision is ambiguous — scope, architecture, dependency choice, data model change —
stop and surface the question rather than making an assumption.

Small decisions compound. It is better to ask once than to refactor later.
