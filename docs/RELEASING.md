# Releasing the frontend

The full procedure (client notice, maintenance windows, rollback, restore) is in the backend repo:
`docs/RELEASE_RUNBOOK.md`. The server side (Caddy, blue-green scripts) lives in the backend's `deploy/` folder.

For this repo:

1. Add the version to `src/features/changelog/releases.ts`, newest first, in English **and** Arabic, written for
   clients. The release workflow refuses a tag that has no entry.
2. Merge to main. Every push to main publishes `ghcr.io/arjunsambyal997/carta-new-frontend:main` and `:sha-<commit>`.
3. `git tag v1.4.0 && git push origin v1.4.0`, then approve the deploy in Actions > Release.
4. The server starts the new image beside the old one, switches when `/login` answers, and keeps the old one for
   `./rollback.sh frontend`. To redeploy an older version: Actions > Release > Run workflow with its tag.

The image uses Next.js standalone output (`node server.js`, no dev dependencies, runs as `node`). In production,
Caddy sends `/api/*` straight to the backend, so `BACKEND_URL` only matters for the local docker compose stack.
