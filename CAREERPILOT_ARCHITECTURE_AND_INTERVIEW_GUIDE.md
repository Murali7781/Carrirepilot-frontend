# CareerPilot: Architecture and Interview Guide

This document explains the current CareerPilot application as a full-stack project: what each layer is responsible for, how a request moves through it, why the main technologies are used, and how to describe the design in an interview.

It is an architecture and important-code-path guide, not a literal annotation of every physical line in every source file. The repository contains many UI details and implementation lines; those are best read in their owning files using the responsibilities and flows below.

## 1. Product overview

CareerPilot is a career-search workspace. A user can:

- Create an account and maintain a career profile.
- Create resumes manually or import a searchable PDF into editable resume fields.
- Add job descriptions, optionally use an external Adzuna job feed, and save roles.
- Compare a resume with a job, see skill gaps and an estimated match, and review recommendations.
- Track applications and follow-up dates.
- Create mock interview sessions using a role and optional resume context.
- Ask a career coach for workspace-aware guidance, using local guidance when no AI provider is configured.

CareerPilot does not submit job applications to employers. Match scores are heuristic estimates, not employer ATS results or hiring predictions. AI guidance is advisory and should be verified by the user.

## 2. Repository map

The project is split into a browser client and an API server:

```text
CareerPilot/
|-- client/
|   `-- Client/
|       |-- index.html
|       |-- package.json
|       |-- public/
|       `-- src/
|           |-- App.jsx
|           |-- main.jsx
|           |-- components/
|           |-- context/
|           |-- pages/
|           |-- routes/
|           |-- services/
|           `-- styles/
|-- server/
|   |-- package.json
|   |-- server.js
|   |-- .env.example
|   |-- src/
|   |   |-- app.js
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middleware/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- utils/
|   `-- test/
`-- README.md
```

The client and server each have their own `package.json` and lockfile. Install dependencies from the matching project directory; do not use the server lockfile to install the client or vice versa.

## 3. High-level architecture

```text
User / Browser
    |
    | React pages, components, client-side routes
    v
Axios API client (base URL, cookies, error handling)
    |
    | HTTP / JSON or multipart PDF
    v
Express app
    |
    | CORS, body parsing, security headers, route mounting
    v
Express routes
    |
    | authentication, rate limits, upload middleware
    v
Controllers
    |
    | request validation, application use cases, response shape
    v
Services --------------------------> OpenAI / Adzuna (optional)
    |
    | SQL queries and transactions
    v
MySQL
```

The browser owns presentation and navigation. The server owns authentication decisions, validation, provider credentials, business rules, and persistence. MySQL stores account, resume, job, application, match, and interview data. External-provider keys stay on the server.

## 4. Frontend architecture

### 4.1 Startup and routing

- `client/Client/index.html` is Vite's HTML shell. It defines the root element, document metadata, title, and favicon.
- `client/Client/src/main.jsx` imports Bootstrap CSS and the main Sass entry point, creates the React root, and renders the application inside `StrictMode`.
- `client/Client/src/App.jsx` wraps the app in `AuthProvider` and `BrowserRouter`, uses `Suspense` and an error boundary for lazy page loading, and defines the route tree. Feature Sass is loaded with its lazy page chunk rather than the initial shell.
- `client/Client/src/routes/ProtectedRoute.jsx` waits for session initialization and redirects unauthenticated visitors to login. `RoleRoute` provides a client-side 403 for roles outside the candidate workspace; backend checks remain authoritative. `PublicRoute` redirects already signed-in users away from login/register.

Active page routes are:

- `/login`, `/register`
- `/dashboard`, `/profile`, `/resumes`
- `/jobs`, `/jobs/:id`
- `/applications`, `/saved-jobs`, `/skills`
- `/interviews`, `/interviews/:id`

The root route redirects to `/dashboard`. `/ai` currently redirects to the dashboard; the `AiPage.jsx` source remains in the repository but the persistent career coach is surfaced through `CoachWidget` in the main layout.

### 4.2 Shared components

- `components/Layout.jsx`: authenticated application shell, navigation, page headings, account link, sign-out control, responsive sidebar, and `Outlet` for the active page.
- `components/CoachWidget.jsx`: floating assistant panel. It checks `/ai/status`, posts chat requests, sends the current page as context, and renders provider notices and errors.
- `components/dashboard/DashboardStats.jsx`: reusable dashboard metrics.
- `components/dashboard/CareerOverview.jsx`, `DashboardListPanel.jsx`, and `ProfileSnapshot.jsx`: dashboard presentation components. `DashboardPage.jsx` is the routed dashboard entry point and composes the dashboard view.
- `components/jobs/JobCard.jsx`: reusable role card used in job browsing.

### 4.3 Pages and responsibilities

- `pages/LoginPage.jsx` and `RegisterPage.jsx`: authentication forms that call the shared auth context.
- `pages/DashboardPage.jsx`: obtains `/dashboard/summary` and presents progress, applications, next steps, and skill information.
- `pages/ProfilePage.jsx`: reads and updates account career-profile details and related profile context.
- `pages/ResumesPage.jsx`: resume editor/list, PDF import, role selection, match analysis, AI review, and resume management UI.
- `pages/JobsPage.jsx`: searches available roles, saves/unsaves roles, records applications, and creates private manual job postings.
- `pages/JobDetailPage.jsx`: role-specific detail, save/apply-tracking actions, resume comparison, and role context.
- `pages/SavedJobsPage.jsx`: saved-role list.
- `pages/ApplicationsPage.jsx`: application status, notes, and next follow-up tracking.
- `pages/SkillsPage.jsx`: displays missing skills from saved resume/job comparisons.
- `pages/InterviewsPage.jsx`: creates practice sessions and lists previous sessions.
- `pages/InterviewPracticePage.jsx`: generates questions, records answers, shows feedback, and changes session status.
- `pages/AiPage.jsx`: standalone chat implementation retained in source; it is not currently linked as an active page route.

### 4.4 Frontend services and state

- `services/api.js` creates the single Axios instance. It uses `VITE_API_URL` or defaults to `http://localhost:5000/api`; `withCredentials: true` is important because authentication uses a server-managed cookie. The request interceptor removes the default JSON content type for `FormData`, allowing the browser to set the multipart boundary for PDF upload. A 401 response dispatches an unauthorized event except for expected login/register/logout responses.
- `services/authService.js` contains small API functions for register, login, profile read/update, and logout.
- `services/jobsService.js` centralizes job, saved-job, and application operations so components do not reimplement endpoint details.
- `context/AuthContext.jsx` is the shared authentication state. It restores the current user from `/users/profile`, exposes login/register/logout/profile actions, and clears the UI session on unauthorized events. The old local bearer token values are removed for compatibility; new sessions use an HTTP-only cookie.
- `context/useAuth.js` is the hook used by components/routes. `context/contextValue.js` re-exports the shared context so imports continue to resolve to the same provider instance.

Most page-local data is managed with React state and effects. Shared identity/session state lives in `AuthContext`; reusable HTTP configuration lives in the Axios client.

### 4.5 Styling

- `styles/main.scss` is the Sass entry point imported by `main.jsx`.
- Sass partials such as `_tokens.scss` and `_enhancements.scss` supply shared variables/mixins and design enhancements.
- Feature-level Sass files organize auth, base, dashboard, interview, job, layout, and resume styling.
- Several legacy `.css` files remain alongside the newer Sass files. `main.scss` determines the active Sass import graph; a file's presence alone does not mean it is loaded. When changing styles, check imports to avoid maintaining duplicate rules in both CSS and Sass.
- `public/favicon.svg` is the browser-tab icon; `index.html` links to it.

## 5. Backend architecture

### 5.1 Process startup

`server/server.js` is the Node entry point:

1. Load local environment configuration with `dotenv`.
2. Import the Express app.
3. Validate required configuration.
4. Check the MySQL connection.
5. Initialize/upgrade the schema.
6. Start listening only after the required startup checks succeed.

This fail-fast startup avoids serving requests with a missing database or invalid core secrets.

### 5.2 Express application and request lifecycle

`server/src/app.js` creates the Express app and:

1. Configures CORS for the configured client origins, with credentials enabled for the session cookie.
2. Requires an allowlisted `Origin` for unsafe requests carrying the session cookie, preventing cross-site request forgery.
3. Parses JSON and URL-encoded request bodies with size limits.
4. Disables the Express identifying header and applies basic security headers.
5. Mounts route modules under `/api/...`.
6. Returns a consistent JSON 404 for unknown routes.
7. Sends failures through centralized `errorMiddleware`.

The normal request sequence is:

```text
request -> CORS/CSRF/body/security middleware -> route -> auth/permission/rate-limit/upload middleware
         -> controller -> service/database/provider -> JSON response or error middleware
```

### 5.3 Routes and API surface

All feature API paths below are under `/api`:

- `/health`: health check.
- `/auth/register`, `/auth/login`, `/auth/logout`: account/session lifecycle.
- `/users/profile`: read and update the signed-in user's profile.
- `/dashboard/summary`: dashboard aggregates.
- `/resumes`: list, create, get, update, and delete resumes; `POST /resumes/import` imports a PDF; `GET /resumes/:id/file` downloads an attached PDF; `POST /resumes/:id/analyze` performs the resume analysis flow.
- `/jobs`: list, create, get, update, and delete job records. Optional external-provider results are supported when Adzuna is configured and requested.
- `/saved-jobs`: list, save, and remove saved roles.
- `/applications`: list, create, update, and delete application tracker records.
- `/matches`: analyze a resume against a job and retrieve match records.
- `/skills/gaps`: retrieve skill gaps produced by saved comparisons.
- `/interviews`: create/list/get sessions; add/generate questions; submit answers; update session status.
- `/ai/status`, `/ai/chat`, `/ai/resume-review`: report AI mode, chat, and review a resume against a role.
- `/preferences`: read/update career preferences.

Route files bind HTTP methods and paths to controllers. Authentication/rate-limit middleware is applied at the route boundary, before the controller.

### 5.4 Controllers, services, middleware, and utilities

- `controllers/`: translate HTTP requests into operations, validate path/body values, call services/SQL, and format responses. Controllers should not contain shared provider parsing or duplicate domain logic.
- `services/`: business and integration logic. Examples include `resumeService.js`, `resumeImportService.js`, `jobMatchService.js`, `skillGapService.js`, `jobBoardService.js`, `resumeAnalysisService.js`, and `ai/aiService.js`.
- `middleware/authMiddleware.js`: reads the `careerpilot_session` cookie (and supports a bearer token for compatibility), verifies JWT signature/issuer/audience, checks the user's current role and token version in MySQL, and attaches the current user to `req`.
- `middleware/roleMiddleware.js`: maps the current database role to named API permissions; route handlers must declare `requirePermission('domain.action')`. Unconfigured roles or permission names are denied.
- `middleware/csrfProtection.js` and `config/originPolicy.js`: share the exact-origin policy with CORS and require an allowed origin for unsafe cookie-authenticated requests.
- `middleware/authRateLimit.js`: route-specific request limiting for operations such as authentication, AI, and resume imports.
- `middleware/resumeUpload.js`: validates PDF file type and runs Multer upload. The existing create/update upload path stores files on disk; the import path uses bounded in-memory upload to parse the PDF and stores extracted content rather than retaining the source PDF.
- `middleware/errorMiddleware.js`: converts thrown/forwarded errors into the common API error response without exposing internal stack details to clients.
- `utils/response.js`: standard success/error response helpers.
- `utils/validation.js`: common input-validation functions.
- `utils/resumeFiles.js`: manages paths and removal for disk-stored resume attachments.
- `config/environment.js`: validates core environment variables and provides the JWT secret.
- `config/db.js`: creates the MySQL pool, checks connectivity, and initializes/upgrades tables/columns/indexes.

### 5.5 Authentication and session security

The API signs a JWT and sends it as an HTTP-only session cookie. The browser's JavaScript does not need to read the token; Axios sends the cookie because `withCredentials` is enabled. `authMiddleware` verifies the token and re-reads the user/token version from MySQL. Incrementing token version can invalidate previously issued sessions.

The frontend loads the current profile at startup. If a protected request later receives a 401, the API client notifies `AuthContext`, which clears user state and sends the browser to login. Login and registration failures are not misinterpreted as expired sessions.

The browser route guard and sidebar are UX controls, not a security boundary. The backend reads the current role from MySQL and checks permissions on every protected endpoint; controllers must still scope private records to the signed-in user's ID. Candidate accounts have the personal career workspace. Recruiters currently have API access only to their own job records and profile; there is no recruiter applicant-management data model or web screen. Admin permissions cover the endpoints currently implemented, not system-wide user administration.

Production configuration must use a strong private `JWT_SECRET`, a least-privilege database user, HTTPS, and exact allowed browser origins. Production MySQL TLS verifies server certificates. Never expose AI, database, Adzuna, or JWT secrets through a `VITE_` variable or source control.

### 5.6 Data model

The schema in `config/db.js` uses MySQL/InnoDB tables including:

- `users`: account identity and password hash, plus token version.
- `resumes`: structured resume sections, target role, imported text metadata, and optional attached-file metadata.
- `resume_analyses`: saved ATS-style analysis history.
- `resume_skills`: normalized skill rows associated with resumes.
- `job_descriptions`: manual or external roles, descriptions, skills, URLs, and provider metadata.
- `job_matches`: saved resume/job match results, matched/missing skills, recommendations, and score details.
- `skill_gaps`: legacy/manual skill-gap records used by related parts of the application.
- `saved_jobs`: per-user saved-role relation.
- `applications`: per-user job application state, notes, and follow-up dates.
- `interview_sessions`, `interview_questions`, `interview_answers`: practice session, generated/manual questions, and candidate answers/feedback.
- `candidate_preferences`: structured career preferences.
- `chat_conversations`, `chat_messages`: chat-related persistence where used by the application.

Foreign keys generally scope child data to its owning user or parent record and use cascade/set-null behavior where appropriate. Unique keys prevent duplicate saved jobs and duplicate application tracker rows for the same user and job.

The current startup schema logic creates missing tables and adds missing columns/indexes. It is not a versioned migration framework. Before deploying a schema change to an existing production database, back up the database and review every `ALTER TABLE` for compatibility and locking impact.

## 6. Important end-to-end workflows

### 6.1 Sign in and load the workspace

1. The user submits credentials in `LoginPage`.
2. `AuthContext.login` calls `authService.loginUser`.
3. Axios posts to `/auth/login` with cookie credentials enabled.
4. The server route applies rate limiting, then the controller checks credentials and establishes the session cookie.
5. The user is stored in React context; protected routes render the application layout.
6. On a page refresh, `AuthContext` calls `/users/profile` to rehydrate the signed-in user.

### 6.2 Create or import a resume

Manual workflow:

1. `ResumesPage` builds a payload from the editor.
2. It posts/puts JSON to `/resumes`.
3. The resume route applies authentication and, when a PDF attachment is submitted, Multer disk upload.
4. `resumeController` validates/extracts uploaded PDF text where applicable.
5. `resumeService` normalizes user fields and persists the record and skills.

Import workflow:

1. The browser sends multipart `FormData` to `/resumes/import`.
2. The Axios interceptor removes its JSON content type so the browser supplies the multipart boundary.
3. The import route applies authentication, rate limiting, and bounded in-memory PDF upload.
4. `resumeImportService` validates the PDF, extracts text with PDF.js, detects common resume section headings, and creates editable structured fields.
5. Extracted data is saved through `resumeService`; the user is asked to review/correct parser output.

The import flow is designed for searchable text-based PDFs. Scanned image PDFs require OCR outside this flow. The current documented import limits are 8 MB and 20 pages.

### 6.3 Match a resume to a role

1. The UI sends `resumeId` and `jobId` to `/matches/analyze`.
2. `matchController` calls `jobMatchService`.
3. The service loads the user's own resume and job, parses skills, compares normalized terms, calculates required/preferred coverage and resume completeness, and creates recommendations.
4. The service persists the analysis in `job_matches` and returns a breakdown.
5. `SkillsPage` and dashboard data can surface the missing skills.

The score is explainable and derived from listed content; it is not a hiring probability or a third-party ATS result.

### 6.4 Save and track a job application

1. `JobsPage` loads roles, saved roles, and applications.
2. Saving calls `/saved-jobs`; marking applied calls `/applications`.
3. The application controller validates ownership and prevents duplicate user/job trackers.
4. `ApplicationsPage` updates status, notes, and next-action date through `PUT /applications/:id`.
5. Dashboard summary aggregates counts, recent activity, and pipeline state.

CareerPilot records the user's status after they apply elsewhere; it does not submit the external application.

### 6.5 Practice an interview

1. `InterviewsPage` creates a session with type, optional job, optional resume, and optional title.
2. The session is stored in `interview_sessions`.
3. `InterviewPracticePage` asks the server to generate questions; AI service uses role/resume context and can use the configured provider or local question generation.
4. Candidate answers are stored through the answer endpoint and can receive feedback.
5. Session status is updated through the status endpoint.

The question and feedback service is expected to be grounded in supplied context and avoid inventing candidate experience.

### 6.6 Career assistant

1. `CoachWidget` checks `/ai/status` and posts the user message, short history, and current page context to `/ai/chat`.
2. The controller collects only relevant workspace information for the signed-in user.
3. `aiService` chooses live OpenAI mode when a server-side key is configured; otherwise, local workspace guidance is used.
4. Provider failures are surfaced as actionable errors/notices rather than silently presented as successful AI answers.

Resume review sends selected resume/role information to the provider only after server-side preparation. Review the server implementation and privacy notice before changing what data is sent.

## 7. Why this technology stack

- **React**: component model for building interactive pages and reusable dashboard/job/resume UI. Local state and context handle user interaction and shared session state.
- **React Router**: client-side URL routing, nested protected layouts, and navigation without a full document reload. Lazy page imports reduce initial JavaScript loading.
- **Vite**: fast local development server and frontend production bundler. Sass compilation is used because the client imports `.scss` files.
- **Sass**: variables, partials, and organized feature styles. Bootstrap remains available for baseline CSS utilities/components.
- **Axios**: shared HTTP client, API base URL, cookie credentials, multipart handling, and centralized unauthorized-response behavior.
- **Node.js**: JavaScript runtime on the server, allowing the team to use JavaScript across the full stack and use the official OpenAI Node SDK.
- **Express**: small HTTP routing/middleware framework suitable for separating routes, controllers, and middleware.
- **MySQL with `mysql2/promise`**: relational persistence with transactions, foreign keys, indexes, and prepared parameterized queries for user-owned career records.
- **JWT plus HTTP-only cookies**: stateless signed session token transported in a browser cookie; the server validates it and checks token version. The cookie is safer from direct JavaScript token reads than browser local storage. Cookie settings, CSRF protections, and HTTPS still need to match deployment requirements.
- **Multer**: multipart PDF uploads with MIME/extension checks and size/part limits.
- **PDF.js and `pdf-parse`**: PDF text extraction for the separate import and existing attachment workflows.
- **OpenAI SDK**: optional server-side career chat, role-aware interview questions/feedback, and resume review. It is not required for local fallback behavior.
- **Adzuna API integration**: optional external job listing source. The provider credentials are server-side; workspace roles remain available without credentials.
- **Node test runner**: built-in `node:test` runner for the backend tests without an additional test framework.
- **ESLint**: frontend static checks; Vite build checks bundling and Sass imports.

The stack reflects a practical single-repository full-stack application. It is not a microservice architecture: the API is a single Express process backed by a shared relational database.

## 8. API response and error conventions

Successful controller responses use the shared envelope:

```json
{
  "success": true,
  "message": "Human-readable result",
  "data": {}
}
```

Errors use `{ "success": false, "message": "...", "code": "...", "errors": [] }` and an HTTP status. Internal failures return a generic message. Controllers generally forward unexpected errors to `errorMiddleware`; validation errors should have an intentional client status/message. Frontend pages display recoverable errors and should not assume every request succeeds.

## 9. Configuration and local development

Requirements from the project README include Node.js 20.19+ or 22.12+ and MySQL 8. PDF.js also declares a compatible Node engine. Configure `server/.env` locally using the variable list in the project README and `client/Client/.env.example` for Vite. Do not commit real credentials.

Typical local commands:

```powershell
# API
cd E:\CarrerPilot\server
npm install
npm run dev

# Web client, in a second terminal
cd E:\CarrerPilot\client\Client
npm install
npm run dev
```

If the API is not at its local default, set client `VITE_API_URL` to the full API prefix (for example `https://api.example.com/api`). Set the API's `CLIENT_ORIGINS` to the exact deployed frontend origins.

Optional server settings include:

- `OPENAI_API_KEY` or `AI_API_KEY`; optionally `OPENAI_MODEL` or `AI_MODEL`, and `AI_API_URL`.
- `ADZUNA_APP_ID`, `ADZUNA_APP_KEY`, and `ADZUNA_COUNTRY`.
- Core `PORT`, `DB_*`, `JWT_SECRET`, `NODE_ENV`, and `CLIENT_ORIGINS`.

Use actual secrets only in the ignored local `.env` or deployment secret manager. The `.env.example` must remain placeholders.

## 10. Testing and verification

Frontend:

```powershell
cd E:\CarrerPilot\client\Client
npm run lint
npm run build
```

Backend:

```powershell
cd E:\CarrerPilot\server
npm test
```

The backend test script is `node --test`. Current test files include `test/aiChat.test.js` and `test/interviewQuestions.test.js`. The frontend package defines lint/build scripts; it does not currently define a dedicated frontend unit-test script.

For a release candidate, also verify the main user paths manually: register/login/logout; profile load/update; create/import/edit/delete resume; attach/download PDF if that workflow is used; job list/detail/create/save; match analysis; application updates; interview session/question/answer/status; local assistant and configured provider behavior; CORS and cookies from the deployed frontend origin.

## 11. Important limitations and design trade-offs

- Match percentages are deterministic heuristics based on skills and completeness. They are not validated against hiring outcomes.
- PDF heading extraction is best-effort. Users must review imported fields; scanned PDFs need OCR.
- AI is optional and external requests can incur provider costs. Keep provider keys server-side and report provider errors accurately.
- Local AI guidance is rule/workspace-based fallback, not an LLM response.
- Adzuna is optional and subject to provider terms/attribution. A listing snapshot supports application workflows but does not transfer the job-posting source or enable automatic applying.
- The database setup code applies schema changes on startup. A mature production workflow should consider explicit, version-controlled migrations and a reviewed rollout/back-up plan.
- Uploaded resume files and extracted resume text are sensitive personal data. Production deployment needs access control, retention/deletion policy, private storage, TLS, backups, monitoring, and a clear AI data-sharing consent experience.
- Rate limiting in-process protects selected endpoints per server process, but a multi-instance deployment may require a shared rate-limit store and edge-level protection.

## 12. Interview-ready project explanation

### 30-second version

> CareerPilot is a full-stack career workspace built with React and Vite on the frontend and Node.js/Express with MySQL on the backend. Users can build or import resumes, save job descriptions, compare a resume to a role, track applications, and practice interviews. The frontend uses a shared Axios client and an auth context, while the API uses route middleware, controllers, and services. AI and live job search are optional server-side integrations, so core workspace features can still work without provider credentials.

### 2-minute version

> I organized the browser application around pages and reusable components. React Router handles nested protected routes, `AuthContext` restores the user from the server, and an Axios instance centralizes the API URL, cookie credentials, multipart uploads, and unauthorized handling. The Express API is divided into routes, middleware, controllers, and services: routes define the API surface, middleware handles authentication/rate limits/uploads, controllers coordinate requests, and services implement resume, match, AI, and job-provider logic. MySQL stores user-owned records and relationships.
>
> A core workflow is comparing a resume with a job. The browser sends the selected IDs, the backend verifies ownership, normalizes resume and job skills, computes required/preferred coverage plus resume completeness, stores the result, and returns an explainable breakdown. For interview practice, a session can be linked to the same role and resume; questions and answers then use that context. External AI and Adzuna integrations are optional and keep credentials on the server. I would emphasize that the score is a transparent heuristic, imported PDF data needs user review, and the application tracker records external applications rather than submitting them.

### Common interview questions

**Why split routes, controllers, and services?**  
Routes make the API contract visible, middleware handles cross-cutting concerns, controllers translate HTTP input/output, and services keep reusable domain and provider logic out of request handlers. This improves testability and makes responsibilities easier to reason about.

**How does authentication survive refresh?**  
The browser sends an HTTP-only session cookie with Axios credentials. At startup the client calls the profile endpoint; the server verifies the JWT and checks the user's token version before returning account data.

**Why MySQL rather than a document database?**  
Users, resumes, jobs, matches, applications, and interview sessions have clear ownership and relationships. Foreign keys, transactions, unique constraints, and indexes help preserve integrity for those relationships.

**How would you protect resume data?**  
Validate access on every request, keep uploads private and outside public static paths, enforce size/type limits, use HTTPS and least-privilege DB access, avoid logging resume contents, provide deletion/retention controls, protect secrets, and be explicit before sending any content to an AI provider.

**What does the match score mean?**  
It summarizes structured skill overlap and resume completeness for the selected role. It is an estimate to help the user decide what to review, not an employer ATS result or a prediction of hiring success.

**What happens if OpenAI is unavailable?**  
The UI can use the local workspace-guidance path when no provider key is configured. If a configured provider request fails, the service returns an actionable provider failure rather than pretending that local guidance is a successful live-AI answer.

**How would you scale it?**  
First add production telemetry, centralized logs, DB query/index review, managed DB backups, and private object storage for files. For horizontal scaling, move rate-limit state to shared storage, deploy multiple stateless API instances behind a load balancer, and consider background jobs for costly AI/PDF work. Introduce explicit database migrations and API/integration tests before expanding the deployment.

**What are the main trade-offs?**  
The monolithic Express API is straightforward to develop and deploy but requires disciplined module boundaries as it grows. Startup schema alterations are convenient for local bootstrap but less controlled than a migration system. Rule-based matching is explainable and inexpensive but less semantically rich than a validated ranking model. Optional AI improves coaching but adds cost, latency, privacy, and provider-availability concerns.

## 13. How to explain the important code paths line by line

When presenting source in an interview, explain each layer in the order it executes rather than reciting every JSX or SQL line:

1. **`main.jsx`**: vendor CSS and Sass establish global presentation; `createRoot` attaches React to the HTML root; `StrictMode` helps surface development-time lifecycle issues; `App` starts the UI.
2. **`App.jsx`**: `AuthProvider` supplies user state; `BrowserRouter` supplies URL navigation; `Suspense` provides a loading state for lazy imports; public and protected route wrappers decide access; nested routes render inside `Layout`.
3. **`api.js`**: `axios.create` centralizes configuration; `baseURL` selects local/deployed API; `withCredentials` carries the session cookie; request interception preserves multipart boundaries; response interception propagates non-auth errors and signals expired sessions.
4. **`AuthContext.jsx`**: state tracks `user` and bootstrap `loading`; the initialization effect asks the server for the current user; event listeners clear stale sessions; callbacks wrap auth/profile service calls; `useMemo` exposes a stable provider value; the hook rejects use outside its provider.
5. **`server.js`**: load environment; import app/config; validate settings; test DB; initialize schema; only then listen. The error branch prevents starting a partially configured service.
6. **`app.js`**: define trusted origins; enable credentials; parse bounded request bodies; add security headers; mount route modules; handle 404; centralize errors.
7. **A route file**: apply authentication first for private data, then any endpoint-specific limiter/upload middleware, then pass control to a named controller.
8. **A controller**: read the authenticated user and validated request fields; invoke the service; choose HTTP status and common response envelope; pass unexpected failures to `next`.
9. **A service**: enforce domain rules; use prepared SQL parameters and transactions for related writes; call external integrations only on the server; return normalized domain results.
10. **A test**: set controlled inputs/provider responses; invoke the service behavior; assert the observable output and error handling. Prefer deterministic tests that do not need real provider keys or production databases.

## 14. Source of truth

This guide describes the checked-in project layout and active source files. If implementation changes later, update this guide alongside the affected routes, package manifests, data model, and documented configuration. The `README.md` remains the quick-start/configuration reference; this file is the deeper architecture and interview-preparation reference.
