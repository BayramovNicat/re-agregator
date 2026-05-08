Run a ship-readiness check for this Bun/TypeScript project.

Steps:
1. Run `git status --short`.
2. Run `git diff --stat`.
3. Inspect tracked and untracked changed files, including `tests/`, `scripts/`, `playwright.config.ts`, and `tsconfig.tests.json` when present.
4. Run `bun run typecheck`.
5. Run `bun test`.
6. If browser/UI files or Playwright tests changed, run `bun run test:e2e` unless user asks for fast check only.
7. Mention `bun run verify:db` only as optional/destructive-seed validation, and do not run it without explicit user approval and safe test `DATABASE_URL`.
8. Summarize blockers first, then warnings, then ready items.

Keep output terse. Do not commit or push.
