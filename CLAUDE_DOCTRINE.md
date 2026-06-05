# Engineering Doctrine

This project prioritizes:
- simplicity
- maintainability
- operational reliability
- fast iteration
- pragmatic engineering

This is a real-world business tool for a small team.
Do not overengineer the system.

---

# Core Principles

## 1. Simplicity Over Cleverness

Prefer:
- understandable code
- direct logic
- minimal abstractions
- explicit flows

Avoid:
- unnecessary patterns
- premature optimization
- architectural complexity without clear value

Code should be easy to maintain months later.

---

## 2. Mobile-First UX

The majority of users will access the app from phones.

Prioritize:
- responsive layouts
- large tap targets
- fast interactions
- readable schedules
- minimal friction

Every UI decision should consider mobile usability first.

---

## 3. Operational Reliability Matters More Than Novelty

This software supports real business operations.

Prioritize:
- predictable behavior
- stable data handling
- simple debugging
- clear error states

Avoid:
- experimental complexity
- unnecessary dependencies
- fragile systems

---

## 4. Scope Discipline

This project is intentionally constrained.

MVP features only:
- authentication
- scheduling
- clock in/out
- admin management
- time tracking

Do NOT expand into:
- payroll systems
- messaging systems
- AI scheduling
- analytics platforms
- enterprise HR tooling

---

# Technical Preferences

## Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS

## Backend
- Supabase
- Postgres
- Server Actions preferred where appropriate

---

# Architecture Guidelines

## Prefer:
- server-side data fetching
- simple CRUD operations
- reusable UI primitives
- modular components
- straightforward database queries

## Avoid:
- excessive global state
- unnecessary realtime systems
- microservices
- websocket complexity
- deep abstraction hierarchies

---

# Design Language

The UI should feel:
- clean
- modern
- calm
- operational
- uncluttered

Avoid:
- flashy animations
- excessive gradients
- dashboard overload
- visual noise

The product should feel practical and trustworthy.

---

# Code Quality Standards

All code should prioritize:
- readability
- consistency
- maintainability
- explicit naming
- predictable behavior

Prefer clarity over compactness.

---

# Database Philosophy

Database structure should remain:
- simple
- normalized where reasonable
- easy to query
- easy to debug

Avoid unnecessary relational complexity.

---

# Decision Framework

Before implementing any feature, ask:

1. Does this solve a real operational problem?
2. Is the complexity justified?
3. Will this increase maintenance burden?
4. Is there a simpler implementation?
5. Is this necessary for MVP?

If uncertain: choose the simpler solution.

---

# Development Process

Prioritize this order:

1. functional correctness
2. reliability
3. usability
4. maintainability
5. polish

Do not optimize prematurely.

---

# Important Reminder

This project is valuable because:
- it serves real users
- it solves operational problems
- it requires production thinking
- it teaches practical engineering

The goal is not architectural sophistication.
The goal is shipping reliable software.
