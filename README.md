This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Run with Docker

The app and Postgres run entirely in containers. From the repo root:

```bash
docker compose up --build
```

Open [http://127.0.0.1:3002](http://127.0.0.1:3002). On first boot the web container waits for Postgres, applies Prisma migrations, upserts the bootstrap admin, then starts Next.js on port 3002 (host and container). Set `APP_PORT` to change both.

Sign in with `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` from `.env`. If those are unset, the Compose defaults are:

- Email: `admin@goodcode.local`
- Password: `local-admin-change-me`

Optional secrets (OpenAI, Resend, OAuth) live in `.env` or `.env.local`. Put the OpenAI key there and leave OAuth IDs blank unless they are real. Compose forces `DATABASE_URL` to the `db` service and points Auth.js at port 3002, even if `.env` still has host-dev `:3000` URLs. Production HTTPS should set `SITE_URL`.

```bash
docker compose down          # stop
docker compose down -v       # stop and wipe the database volume
```

Production / VPS: set `AUTH_SECRET` and `SITE_URL` (https origin), then rebuild so the public URL is baked into the client bundle. `SITE_URL` also becomes `AUTH_URL` inside the container.

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
