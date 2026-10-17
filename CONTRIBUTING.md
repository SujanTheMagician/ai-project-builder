# Contributing

## Branches

`main` is always deployable — Vercel deploys it on every push. Never commit to it directly.

| Prefix | Use for | Example |
|---|---|---|
| `feat/` | New features | `feat/blueprint-versions` |
| `fix/` | Bug fixes | `fix/chat-scroll` |
| `refactor/` | Code changes with no behaviour change | `refactor/api-handler` |
| `chore/` | Tooling, deps, CI | `chore/ci-typecheck` |
| `docs/` | Documentation only | `docs/hld` |

## Flow

```bash
git checkout main && git pull
git checkout -b feat/my-feature
# …work, committing in small steps…
git push -u origin feat/my-feature
gh pr create --fill          # CI runs lint, typecheck and build
# squash-merge once CI is green, then delete the branch
```

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat(chat): stream replies token by token
fix(api): refund credits when generation times out
refactor(db): move credit logic into lib/credits
```

Keep the subject under 72 characters and use the body to explain *why*.

## Secrets

- Never commit `.env*` files except `.env.example`.
- Every variable is declared and validated in `src/lib/env.ts`; the server refuses to start if one is missing or malformed.
- Only `NEXT_PUBLIC_*` variables reach the browser — never put a secret in one.
- Production values live in the Vercel project settings; CI uses placeholders.
