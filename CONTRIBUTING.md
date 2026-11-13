# Contributing

Short rules so 4 people can ship fast without stepping on each other.

## Branches

- `main` is always the latest working version.
- Create a branch per task: `feature/<name>` (e.g. `feature/onboarding-screen`).

## Pull requests

- Keep PRs small and focused; open them against `main`.
- Fill in the PR template (what changes, how to test it, optional screenshot).
- Pull `main` often to avoid big merge conflicts.

## Commits: Conventional Commits

Format: `<type>: <short description>`

| Type       | Use for                                  |
| ---------- | ---------------------------------------- |
| `feat`     | New functionality                        |
| `fix`      | Bug fix                                  |
| `chore`    | Tooling, config, dependencies            |
| `docs`     | Documentation only                       |
| `refactor` | Code change without behavior change      |

Example: `feat: add job recommendation endpoint`

## Secrets

- **Never commit secrets**: no API keys, tokens, passwords or `.env` files.
- Add new variables to `.env.example` **without values**.
- If a secret is pushed by mistake, tell the team and rotate it immediately.
