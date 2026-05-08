Run project tests for this Bun/TypeScript project.

Default steps:
1. Run `bun run typecheck`.
2. Run `bun test`.
3. Run `bun run test:e2e` when UI/browser behavior changed or user asks for full test.

DB validation:
- `bun run verify:db` resets seeded test data.
- Do not run unless user explicitly approves and `DATABASE_URL` points to a local/test database.

Keep output terse. Report failures with command, failing file/test, and next fix.
