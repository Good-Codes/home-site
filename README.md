This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font).

## Deploy on the TruServ VPS (Docker)

Production is a single Next.js container. Host nginx already serves other apps on this machine (Antler on `127.0.0.1:3000`, stag-hunt on `127.0.0.1:3001`), so this site publishes **localhost-only** on **port 3002**.

The Project Blueprint estimator needs the same secrets as local/Vercel (see `docs/project-blueprint/operations.md`). Pass them at build and runtime with:

```bash
docker compose --env-file .env.local up --build -d
curl -sI http://127.0.0.1:3002
```

If 3002 is already taken, change only the left-hand port in `docker-compose.yml` (`127.0.0.1:HOST_PORT:3000`) and the `proxy_pass` port in the nginx sample.

### nginx

Copy the sample vhost, then reload nginx. This does not replace the Antler site (`server_name 156.38.220.234`).

```bash
sudo cp deploy/nginx/goodcode.co.za.conf /etc/nginx/sites-available/goodcode.co.za
sudo ln -s /etc/nginx/sites-available/goodcode.co.za /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Point DNS A records for `goodcode.co.za` and `www.goodcode.co.za` at `156.38.220.234`.

Optional TLS after DNS is live. Certbot is not installed on the VPS by default:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d goodcode.co.za -d www.goodcode.co.za
```

### Useful Compose commands

```bash
docker compose --env-file .env.local up --build -d
docker compose logs -f web
docker compose down
```
