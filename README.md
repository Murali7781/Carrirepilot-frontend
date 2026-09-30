# CareerPilot

CareerPilot is a career-search workspace with profile management, resume storage and keyword checks, job search, saved roles, an application tracker, skills, interview practice, and a career coach.

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

Without an AI provider configured, the coach gives local, workspace-aware guidance and labels itself as local guidance. To enable live OpenAI responses, configure both values in `server/.env`:

```env
OPENAI_API_KEY=your-server-side-api-key
OPENAI_MODEL=your-enabled-model
```

The API key stays on the server. When live AI is enabled, CareerPilot sends the user’s prompt and selected career context (target role, preferred location, resume title/summary/skills, skill gaps, and application count) to OpenAI. It does not send the raw uploaded PDF or account email. The interface explains the current mode. If the provider is unavailable, the coach labels its local fallback.

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
