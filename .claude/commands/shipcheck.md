Check branch ship readiness.

- Run `git status --short` and `git diff --stat`.
- Inspect changed tracked/untracked files.
- Run `bun run verify`.
- If DB/data-seed code changed, mention `bun run verify:db` as optional approval-gated check.
- Do not commit or push.

Output: blockers, warnings, ready items.
