# Truck Tracker – Warehouse Logistics Dashboard

Live demo → https://truck-tracker.pages.dev

[![GitHub stars](https://img.shields.io/github/stars/rhyzo-dev/truck-tracker?style=flat)](https://github.com/rhyzo-dev/truck-tracker/stargazers)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## Features
- **Magic-link login** – passwordless, secure email auth (Supabase Auth)
- **Real-time updates** – Supabase Realtime sync across devices
- **Mobile-first UI** – responsive React + TypeScript, PWA-ready
- **Export to CSV** – one-click reporting for supervisors
- **Extensible** – ready for driver photos, WhatsApp bot, carrier portals, etc.

## Tech Stack
- **Frontend:** React + TypeScript (Vite)
- **Backend / DB:** Supabase (Postgres, Auth, Realtime, Row-Level Security)
- **Hosting:** Cloudflare Pages (static site + edge caching)
- **CI/CD:** GitHub → Cloudflare Pages auto-deploy on push

## Getting Started Locally
```bash
git clone https://github.com/rhyzo-dev/truck-tracker.git
cd truck-tracker/frontend
npm install
npm run dev   # http://localhost:3000
```

## Deploy to Cloudflare Pages
```bash
npm run build
npx wrangler pages deploy dist --project-name=truck-tracker
```

## Database Schema
See `SCHEMA.sql` in the repo root. Run it in Supabase → **SQL Editor** to create tables + RLS policies.

## Documentation
- **SPEC-01:** Database schema & RLS (`SPECS/01-schema.md`)
- **SPEC-02:** Magic-link auth & profile bootstrap (`SPECS/02-auth.md`)
- **hand-off.md:** Step-by-step deployment guide

---

## Why this is in my portfolio
- Built a **full-stack** internal tool from scratch.
- Leveraged **serverless** services (Supabase, Cloudflare) – zero infra cost.
- Implemented **row-level security** for multi-plant data isolation.
- Delivered a **mobile-first PWA** used daily by a logistics team.

---

## Contact / Credits
Created by **Rhyzo** – feel free to open an issue or PR for enhancements!
