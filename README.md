# 🎃 Halloween Kostýmy — hlasovanie

Mobile-first appka na hlasovanie za najlepší halloweenský kostým na párty, v dvoch kategóriách: **Solo** a **Dvojice**.

## Funkcie

- Pridávanie nových kostýmov vrátane fotky (fotka je nepovinná)
- Hlasovanie za kostým v každej kategórii
- Limit **1 hlas na zariadenie na kategóriu** — vynucuje sa cez httpOnly cookie (`device_id`), nie cez IP (viacero hostí na párty zvyčajne zdieľa jednu verejnú IP cez wifi, takže IP limit by blokoval všetkých naraz)
- Responzívny dizajn optimalizovaný na telefóny

## Stack

- Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS v4
- Neon Postgres (`@neondatabase/serverless`) na dáta
- Vercel Blob na fotky kostýmov

## Lokálny vývoj

```bash
npm install
npm run dev
```

Next.js automaticky načíta premenné z `.env.local` (stiahnuté cez `vercel env pull` / `vercel link`).

## Databázová schéma

Schéma je v `schema.sql`. Spustenie migrácie:

```bash
node --env-file=.env.local scripts/migrate.mjs
```

Vyčistenie testovacích dát:

```bash
node --env-file=.env.local scripts/reset-test-data.mjs
```

## Deploy

```bash
vercel --prod
```

Projekt je napojený na Neon Postgres a Vercel Blob storage cez Vercel Storage integrácie.
