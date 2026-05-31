---
name: bftc-worktree-qa
description: "Use when starting BFTC for in-game QA from a worktree: launch backend/frontend with cloned DB, dedicated ports, Vite env, health check, and URLs."
---

# BFTC Worktree QA

Start the BFTC game from the current checkout for QA without reusing the main frontend port or sharing worker queues with another backend.

## Source of Truth

Read `docs/architecture/worktree-dev.md` before launching servers. This skill is a concise operator flow, not a replacement for that document.

## Workflow

1. Confirm the current directory is the intended BFTC worktree and inspect `rtk git status --short`.
2. Choose dedicated ports. Default to backend `15002` and frontend `5174`; if occupied, increment both and keep every URL aligned.
3. Prefer an isolated temporary DB cloned from `battleforthecrown`, named with the worktree suffix, for example `battleforthecrown_c299`.
4. Start Postgres from `battleforthecrown-backend` if needed, then clone and migrate the DB:

```bash
cd battleforthecrown-backend && docker compose up -d
cd ..

export WORKTREE_DB="battleforthecrown_<suffix>"
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/$WORKTREE_DB"

docker exec battleforthecrown-postgres dropdb -U postgres --if-exists "$WORKTREE_DB" --force
docker exec battleforthecrown-postgres createdb -U postgres "$WORKTREE_DB"
docker exec battleforthecrown-postgres pg_dump -U postgres battleforthecrown \
  | docker exec -i battleforthecrown-postgres psql -U postgres -d "$WORKTREE_DB"

DATABASE_URL="$DATABASE_URL" yarn workspace battleforthecrown-backend prisma migrate deploy
DATABASE_URL="$DATABASE_URL" yarn workspace battleforthecrown-backend prisma generate
```

5. Launch the backend from the worktree root in a long-running session:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/battleforthecrown_<suffix>" \
JWT_ACCESS_SECRET="dev-local-jwt-access-secret-32-bytes" \
FRONTEND_URL="http://localhost:<front-port>" \
NODE_ENV=development \
PORT=<backend-port> \
  yarn workspace battleforthecrown-backend start:dev
```

6. Launch the Pixi frontend from the worktree root in a second long-running session:

```bash
VITE_API_BASE_URL="http://localhost:<backend-port>" \
VITE_WS_URL="http://localhost:<backend-port>" \
  yarn workspace battleforthecrown-pixi dev --port <front-port> --strictPort
```

7. Verify before handing off:

```bash
curl -fsS "http://localhost:<backend-port>/health"
```

Do not perform in-game QA in the browser. After the healthcheck, report:

- App URL: `http://localhost:<front-port>/`
- Design system URL: `http://localhost:<front-port>/design-system`
- Backend health URL: `http://localhost:<backend-port>/health`
- Temp DB name and cleanup command:

```bash
docker exec battleforthecrown-postgres dropdb -U postgres --if-exists "battleforthecrown_<suffix>" --force
```

## Guardrails

- Do not use root `yarn dev` for worktree QA.
- Do not default to frontend port `5173`; it may belong to the main checkout.
- Do not set `WORKTREE_DB` to `battleforthecrown`; destructive DB commands are only for the temporary clone.
- Keep `FRONTEND_URL`, `VITE_API_BASE_URL`, `VITE_WS_URL`, backend `PORT`, and browser URL consistent.
- Do not share one DB between two running backends when testing workers, realtime, combat, returns, or notifications.
- If `@battleforthecrown/shared/*` fails after install, run `yarn workspace @battleforthecrown/shared clean && yarn workspace @battleforthecrown/shared build`.
