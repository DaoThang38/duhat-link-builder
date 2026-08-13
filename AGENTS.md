<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Duhat Link Builder — Core Agent Instructions & Guidelines

## 🚀 Git Auto-Deploy Rule (CRITICAL)
Whenever code changes are made and verified in this workspace, **ALWAYS** commit and push them immediately to GitHub (`git push origin main`) to trigger Netlify auto-deployment.
- *Note for Windows PowerShell*: Use `;` instead of `&&` as the command separator (e.g. `git add . ; git commit -m "..." ; git push origin main`).

---

## 🛠️ Project Stack & Architecture
- **Framework**: Next.js 15 (App Router, Server Actions / API Routes).
- **Language**: TypeScript (`@/types/index.ts` for domain models).
- **Styling**: Tailwind CSS + Custom Global CSS (`src/app/globals.css`).
- **Database & Persistence**:
  - Dual storage engine in `src/lib/db.ts`: PostgreSQL (`pg` pool) when `DATABASE_URL` is configured.
  - Automatic fallback to Local JSON DB (`local-db.json` locally or `/tmp/local-db.json` in serverless environments).
  - **Rule**: Any schema or query modifications must support BOTH PostgreSQL and Local JSON DB fallback.
- **Authentication**: JWT session via HTTP-only cookie (`duhat_session`), jose, bcryptjs (`src/lib/auth.ts`). Roles: `ADMIN`, `MEMBER`.

---

## 📌 Main Functional Modules

1. **Google UTM Builder (`LinkType: 'UTM'`)**:
   - Generates web tracking links using `utm_source`, `utm_medium`, `utm_campaign`, `utm_id`, `utm_content`, `utm_term`.

2. **AppsFlyer OneLink Builder (`LinkType: 'ONELINK'`)**:
   - Generates mobile app deep link requests with standard AppsFlyer parameters: `pid` (media_source), `af_channel` (channel), `c` (campaign_name), `af_c_id` (campaign_id), `af_adset` (ad_group), `af_ad` (ad_name), `af_keywords` (keywords), `deep_link_value`, `target_user` (`NEW_USER` | `EXISTING_USER` | `BOTH`), `desired_slug`, `social_preview`, `note`, `is_retargeting`.

3. **Standard Taxonomy Catalog (`src/app/dashboard/catalog`)**:
   - Manages standardized values for 8 marketing taxonomy categories (Source, Medium, Deep Link Screen, Campaign, Content, Ad Set, Campaign ID, Keyword).
   - Dynamic field mode toggle per category: `STRICT` (forced dropdown choice) vs `FREE` (free text input or autocomplete suggestion).

4. **Link History & SharePoint Sync (`src/app/dashboard/history`)**:
   - Stores all generated link records, deduplicates identical requests, provides search & filter, export to Excel/CSV, and handles automated / manual retry sync with SharePoint.

---

## 🎨 UI & UX Design Language
- **Brand Palette**: Dark Navy (`#0e2a38`), Accent Gold (`#ffcc00`), Clean Crisp Card Backgrounds (`#ffffff`), Subtle Off-White Containers (`#f9f9f6`).
- **Typography**: Modern font stack, bold uppercase badges, clean pill tags, intuitive icon usage (`lucide-react`).
- **Form Controls**: Dynamic autocomplete, validation warnings, duplicate detection dialogs, live real-time link previews.

---

## ✅ Quality & Deployment Workflow
1. **Verify Builds**: Always run `npm run build` locally before pushing to confirm zero TypeScript errors and successful static page generation.
2. **Preserve Code Contracts**: Keep types in `src/types/index.ts` synchronized across API routes, DB helpers, and frontend components.
3. **Commit & Push**: Immediately push code changes to `main` to trigger Netlify CI/CD.
