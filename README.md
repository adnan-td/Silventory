# Silventory

Silventory is an inventory and order-tracking workspace for a tailoring shop. It uses Next.js App Router and Sanity for contacts, stitching requests, and cloth photos.

## Features

- Dashboard with recent order activity, pending work hours, and a first-come-first-served order queue.
- Stitching requests with customer details, camera or gallery cloth photos, request and delivery dates, comments, and an estimate of 1–24 hours. HEIC/HEIF photos are converted to JPEG in the browser before upload.
- Contact book with one-time VCF or CSV import and duplicate detection.
- Order status tracking and delivered-order timestamps.
- Sanity Studio at `/studio` for maintenance.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the Sanity project ID, dataset, and API version.
3. Create a Sanity API token with read and write access to the dataset, then set it as `SANITY_SILVENTORY_API_TOKEN` in `.env.local`.
4. Start Next.js with `npm run dev` and open [http://localhost:3000](http://localhost:3000).

Keep `.env.local` and all API tokens out of Git. The token is only used by server-side code.

## Commands

```bash
npm run dev
npm run lint
npx tsc --noEmit
npm run build
```
