This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contact form email setup

Contact form submissions are delivered to the Good Code team through Resend. Before running the form locally or deploying it:

1. Create a Resend account, add and verify the domain used for outgoing mail, and create an API key.
2. Copy `.env.example` to `.env.local`.
3. Set the following server-side environment variables locally and in the deployment environment:

```bash
RESEND_API_KEY=re_your_api_key
CONTACT_EMAIL_FROM="Good Code Website <website@your-verified-domain.com>"
CONTACT_EMAIL_TO=team@goodcode.co.za
```

`CONTACT_EMAIL_FROM` must belong to a domain verified in Resend. `CONTACT_EMAIL_TO` is the internal inbox that will receive each lead. These variables are intentionally not prefixed with `NEXT_PUBLIC_`, so they remain server-only.

After changing environment variables, restart the development server. A successful submission emails the lead's name, email address, optional phone number, and project details to the internal inbox. The lead's email address is also set as the message's reply-to address.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
