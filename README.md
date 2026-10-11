# CareerPilot

CareerPilot is an AI career-intelligence workspace: import or build a resume, compare it with a target job, review skill gaps and resume improvements, then prepare for that role’s interview. It also includes profile management, saved roles, application tracking, and career guidance.

## Run locally

Requirements: Node.js 20.19+ (or 22.12+) and MySQL 8.

1. Create an empty MySQL database, for example `careerpilot`.
2. Create `server/.env` with your local configuration:

   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=replace-with-a-random-secret-at-least-32-characters-long
   DB_HOST=127.0.0.1
   DB_USER=careerpilot_app
   DB_PASSWORD=your-local-database-password
   DB_NAME=careerpilot
   DB_PORT=3306
   CLIENT_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

3. Install and run the API:

   ```powershell
   cd server
   npm install
   npm run dev
   ```

4. In a second terminal, install and run the web client:

   ```powershell
   cd client/Client
   npm install
   npm run dev
   ```

   Open the local URL printed by Vite. The first account must be registered through the app; there are no hard-coded demo credentials.

At startup, the API creates missing tables and adds missing resume/job metadata columns to the existing schema. Back up an existing database before first startup, and make sure the database user can create and alter tables. Existing rows are retained. Uploaded PDFs are stored under `server/uploads/resumes` on the API host.

## Real job listings

Without a job provider configured, Find Jobs shows clearly marked sample listings. For live listings, obtain an Adzuna API ID and key, then add these optional variables to `server/.env`:

```env
ADZUNA_APP_ID=your-app-id
ADZUNA_APP_KEY=your-app-key
ADZUNA_COUNTRY=gb
```

Set `ADZUNA_COUNTRY` to a two-letter market supported by your Adzuna account. The server keeps credentials off the browser, caches searches briefly, and stores a per-user snapshot so saved jobs and applications remain connected to CareerPilot records. Live descriptions can be shortened by the provider. Users must follow the original posting link to submit an application; CareerPilot only tracks that application.

Adzuna requires API credentials, attribution, and compliance with its current [API terms](https://developer.adzuna.com/docs/terms_of_service). Check account access, licensing, local-market support, and its logo/link requirements before using the feed in a public or commercial deployment.

## Career coach

The server uses the official OpenAI JavaScript SDK (`openai`, installed in the server package). Without an API key, the app gives clearly labeled local guidance and structured mock-interview questions/feedback; that fallback is not generative AI. To enable live OpenAI responses locally, create an API key in the OpenAI developer dashboard, then add it to the ignored `server/.env` file:

```env
OPENAI_API_KEY=your-server-side-api-key
OPENAI_MODEL=gpt-5-mini
```

The OpenAI SDK is installed with npm; an API key is an account credential and cannot be installed or purchased through npm. Never paste it into chat, source control, or a client `VITE_` variable. For cloud deployment, add it as a server-side secret in the hosting provider’s environment settings, then redeploy/restart the API. `AI_API_KEY` and `AI_MODEL` are also accepted aliases; `AI_API_URL` supports a compatible Responses API endpoint. Without a key, chat uses clearly labeled local workspace guidance. If a configured key or model fails, chat reports an actionable error instead of presenting local guidance as an AI answer; the backend logs only sanitized error metadata. The authenticated `/api/ai/status` endpoint reports whether a key is configured, not whether OpenAI has accepted it. Live resume review sends selected resume content and the target job description to OpenAI after contact details are removed from imported text. The original uploaded PDF is not sent.

For OpenAI HTTP 429 errors, check the API project's billing, credits, spend limits, and model-specific RPM/TPM limits. Billing or quota limits must be resolved in the OpenAI platform; temporary rate limits require waiting and reducing request frequency. CareerPilot distinguishes these cases when OpenAI returns a recognized error code.

## Existing resume workflow

The Resumes workspace accepts text-based PDFs up to 8 MB and 20 pages. CareerPilot extracts searchable text, creates editable sections where it can recognize headings, and saves the extracted text and source filename in MySQL for later review. It does not retain the original PDF. Scanned PDFs need OCR before import. Review every imported field; PDF layout and section headings vary.

Compare a saved resume with a saved job to create an ATS-style estimate, required/preferred skill coverage, and a persistent analysis record. The estimate uses job skill coverage and resume section completeness; it is not the result of an employer ATS or a hiring prediction. The same resume and role can seed a mock interview. OpenAI suggestions preserve the candidate’s facts and call out missing evidence instead of claiming new qualifications.

The coach is guidance, not a source of verified job facts. Resume match scores are keyword/structure heuristics, not hiring predictions.

## Configuration notes

- Set `CLIENT_ORIGINS` to the exact comma-separated web origins allowed to call the API. The deployed Vercel origin must be `https://carrirepilot-frontend.vercel.app`.
- Set `VITE_API_URL` to the backend origin in the Vite build environment. Do not put secrets in `VITE_` variables.
- Set `NODE_ENV=production` for the deployed API. Production session cookies use `Secure` and `SameSite=None` for the cross-origin Vercel-to-Render requests; local development retains `SameSite=Lax`.
- Production MySQL connections require TLS certificate verification. Local development does not force TLS, so it also works with a local MySQL instance without TLS.
- Use Node.js 20.19+ or 22.12+ for the API, matching the PDF.js runtime requirement.
- For a public deployment, move resume files to private object storage and use a managed secrets store, HTTPS, database migrations with deployment review, and monitoring/rate limiting at the edge.

## Roles, permissions, and API responses

The database `users.role` value is reloaded during authentication for every request; changing a browser-side role cannot grant API access. The server maps those roles to named permissions in `server/src/middleware/roleMiddleware.js`, and each protected route declares the permission it requires. Unknown roles, unknown permissions, and routes with no permission policy are denied. Frontend route and navigation checks improve the experience only; backend permission checks and user-owned resource queries are the security boundary.

- **Candidate:** personal career workspace, including resumes, saved jobs, applications, interviews, preferences, and AI tools.
- **Recruiter:** the API permits profile and owned job-record management, but the current web client does not yet provide a recruiter-specific job-management screen. Recruiter applicant management and candidate search are not enabled: the current job model stores private per-user workspace roles and does not model published openings or applicant relationships. Candidate-workspace routes are hidden and denied to recruiter accounts.
- **Admin:** all currently implemented API permissions. The application does not yet implement system-wide user, audit-log, or configuration-management endpoints; current data controllers still enforce user ownership.

Mutating requests that use the `careerpilot_session` cookie must include an origin in the API's allowlist. Configure `CLIENT_ORIGINS` with exact frontend origins; this complements CORS and protects cookie-authenticated requests against cross-site request forgery. Login, registration, and bearer-token integrations remain supported. API failures use `{ success: false, message, code, errors }`; internal errors are returned with a generic message.

The current permission map is code-backed and uses the existing database role column, so it requires no schema migration. To add a permission, update the role map and put `requirePermission('domain.action')` on every relevant API route; add negative tests for roles that must be denied. Do not rely on the matching client-side route guard as authorization.

## Deploy to Vercel and Render

The repository contains separate frontend and backend projects. Configure Vercel's **Root Directory** as `client/Client`, use `npm run build`, and set the output directory to `dist`. Add this build-time environment variable in the Vercel project settings, then redeploy:

```env
VITE_API_URL=https://carrierpilot-backend.onrender.com
```

The SPA rewrite in `client/Client/vercel.json` sends direct route visits and refreshes (for example `/login`, `/dashboard`, and `/interviews/6`) to the Vite entry point.

Configure Render's service **Root Directory** as `server`, build command as `npm install`, and start command as `npm start`. Add these server-side environment variables in Render; use the existing MySQL provider's connection values and do not use localhost database settings:

```env
NODE_ENV=production
PORT=<provided by Render>
JWT_SECRET=<random secret of at least 32 characters>
DB_HOST=<MySQL host>
DB_PORT=<MySQL port>
DB_USER=<least-privileged application user>
DB_PASSWORD=<MySQL password>
DB_NAME=<database name>
CLIENT_ORIGINS=https://carrirepilot-frontend.vercel.app
```

For live AI and job-provider functionality, configure `OPENAI_API_KEY` (or `AI_API_KEY`) and `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, and `ADZUNA_COUNTRY` in Render only. Their model/endpoint options are `OPENAI_MODEL`/`AI_MODEL` and `AI_API_URL`. These integrations are optional. The example environment files contain variable names only; never commit real environment files or credentials.

Resume PDF imports use memory and save extracted resume content in MySQL. The separate PDF attachment upload/download routes write files under `server/uploads/resumes`; Render's ordinary filesystem is ephemeral, so those original attachments can be lost on service restart or redeploy. Persistent attachment storage needs a persistent disk or private object storage; no storage provider or database change is configured by this application.

## Startup and performance

The production Vite build keeps route-level code and styles split. In the measured build, the initial application stylesheet fell from 271.41 kB raw (40.57 kB gzip) to 42.20 kB raw (9.87 kB gzip) after removing the unused Bootstrap stylesheet. The initial application JavaScript remained effectively unchanged: 343.69 kB raw (109.12 kB gzip) before and 343.61 kB raw (109.12 kB gzip) after. The largest JavaScript chunk is still the shared application/vendor chunk at 343.61 kB. The login route also loads its own 3.50 kB JavaScript and 5.53 kB CSS chunks.

A local production-preview visit to `/login` loaded five resource entries (application JavaScript/CSS, login JavaScript/CSS, and the external hero image). Local DOMContentLoaded/load readings varied from 106/107 ms to 158/158 ms across runs. This is a local preview result, not a production measurement; it excludes the document and favicon and does not represent a login-to-dashboard flow. The preview had no usable `VITE_API_URL` or authenticated backend session, so login-to-dashboard time and dashboard API duration could not be measured.

The dashboard summary now omits two unused result sets. Application, interview, and saved-job histories are fetched in pages of 20, with pagination metadata and page controls. Find Jobs uses the paginated jobs response to include each role’s saved/application state instead of downloading those complete histories separately. The workspace list is capped at 100 roles per request; live job search is paginated. Find Jobs sends live searches on explicit form submission and filters the local result set while typing, so it does not issue a request per keystroke.

## Checks

```powershell
cd client/Client
npm run lint
npm run build
```
