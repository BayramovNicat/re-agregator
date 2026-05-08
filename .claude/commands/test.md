Run fast project validation.

- Run `bun run typecheck`.
- Run `bun test`.
- If UI/browser behavior changed or user asks full, run `bun run test:e2e`.
- Never run `bun run verify:db` without explicit approval and local/test `DATABASE_URL`.

Report only failures and final pass/fail.
