This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Run with Docker

The app and Postgres run entirely in containers. From the repo root:

```bash
docker compose up --build
```

Open [http://127.0.0.1:3002](http://127.0.0.1:3002). On first boot the web container waits for Postgres, applies Prisma migrations, seeds the first admin, then starts Next.js on port 3002 (host and container). Set `APP_PORT` to change both.

Default local admin (override with `BOOTSTRAP_ADMIN_*` before first seed):

- Email: `admin@goodcode.local`
- Password: `local-admin-change-me`

Optional secrets (OpenAI, Resend, OAuth) can live in `.env` or `.env.local`. Compose already forces `DATABASE_URL` to the `db` service, so a host-only URL in those files is ignored inside the container.

```bash
docker compose down          # stop
docker compose down -v       # stop and wipe the database volume
```

Production / VPS: set `AUTH_SECRET`, `AUTH_URL`, and `NEXT_PUBLIC_SITE_URL`, then rebuild so the public URL is baked into the client bundle.

See `docs/project-blueprint/operations.md` for environment variables, nginx, and TLS.

## Host development (optional)

If you want Next.js on the host instead of the `web` container:

```bash
docker compose up db -d
cp .env.example .env.local
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

For that workflow, publish Postgres to the host (for example `127.0.0.1:5433:5432` on `db`) and keep `DATABASE_URL` on `127.0.0.1:5433`.
