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

- Set `CLIENT_ORIGINS` to the exact comma-separated web origins allowed to call the API in your deployment.
- Set `VITE_API_URL` in the client environment when the API is not at `http://localhost:5000/api`.
- For a public deployment, move resume files to private object storage and use a managed secrets store, HTTPS, database migrations with deployment review, and monitoring/rate limiting at the edge.

## Checks

```powershell
cd client/Client
npm run lint
npm run build
```
