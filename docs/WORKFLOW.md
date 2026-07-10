# Development workflow

Light Git flow, sized for a solo project that still wants real software
development discipline.

## Branches

- `main` — always releasable. Nothing is committed directly to it once
  development starts; changes arrive via pull requests.
- Feature branches — short-lived, branched off `main`, named
  `<type>/<issue-number>-<slug>`:
  - `feat/12-book-detail-timeline`
  - `fix/23-note-sheet-keyboard`
  - `docs/5-extraction-schema`
- Delete the branch after merge.

> Note: automatic branch protection rules for private repos require a paid
> GitHub plan. Until then the "no direct commits to main" rule is enforced by
> discipline, not by GitHub.

## Commits

Conventional commits:

```
<type>(<optional scope>): <summary in imperative mood>
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`.

Examples:
- `feat(mentions): add chapter timeline grouping`
- `fix(notes): persist note draft when sheet is dismissed`
- `docs: describe seed JSON schema`

Keep commits small and single-purpose; the summary line ≤ 72 chars.

## Issues and milestones

- Every non-trivial piece of work gets a GitHub issue before it gets a branch.
- Issues carry a kind label (`feature`, `bug`, `documentation`, `design`,
  `content`, `infra`) and a milestone.
- Milestones mirror the roadmap: **Phase 1 — MVP**, **Phase 2 — Community**,
  **Phase 3 — Integrations**.

## Pull requests

- One issue per PR where possible; link it with `Closes #<n>` in the body.
- Self-review the diff before merging — read it as if someone else wrote it.
- Merge strategy: **squash merge** (keeps `main` history one-commit-per-change).
- CI (added when app code lands): analyze/lint + tests must pass before merge.

## Releases

- Tag releases on `main` as `v0.x.y` (SemVer). `v0.1.0` = first MVP build that
  runs end-to-end on a phone.
- Keep a short human-written changelog entry per release (GitHub Releases).

## Repository layout conventions

- `docs/` — architecture, workflow, and design docs (versioned with the code).
- App code layout is decided with the stack (see ARCHITECTURE.md "Open
  decisions"); it will follow the layered architecture: UI → state →
  repositories → data sources.
- Seed/content JSON lives in the repo and is reviewed via PRs like code.
