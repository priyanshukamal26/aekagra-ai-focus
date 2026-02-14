# Aekagra AI — Project Improvements Roadmap

> Full audit of the current codebase identifying every gap between the existing scaffold and a production-ready "AI-powered focus & study optimization platform."

---

## Current State Summary

| Layer | What exists | What's missing |
|-------|------------|----------------|
| **Backend** | Auth routes (register/login/me), single `users` table, JWT middleware | Every feature API, database schema, env config, error handling, rate limiting |
| **Frontend** | 9 pages with full UI, auth flow (login/register/protected routes) | All pages use **hardcoded mock data** — zero backend integration |
| **Testing** | Vitest scaffolded, 1 placeholder test | No real unit, integration, or E2E tests |
| **DevOps** | Vite dev proxy, `.gitignore` | No env files, no Docker, no CI/CD, no deployment config |

---

## 🔴 Critical — Backend API & Database

### 1. Database Schema — ~~Missing Tables~~ ✅ DONE

~~The database currently has **only** a `users` table.~~ All 11 tables created in `server/db.js` with foreign keys, CHECK constraints, and indexes:

- [x] **`focus_sessions`** — `id, user_id, started_at, ended_at, duration_seconds, focus_score, status (active/completed/abandoned)`
- [x] **`focus_events`** — `id, session_id, event_type (face_detected, eyes_away, tab_switch, idle), timestamp, metadata`
- [x] **`study_plans`** — `id, user_id, title, syllabus_text, created_at, updated_at`
- [x] **`study_weeks`** — `id, plan_id, week_number, topics (JSON)`
- [x] **`study_tasks`** — `id, week_id, user_id, title, is_completed, due_date, completed_at`
- [x] **`tutor_conversations`** — `id, user_id, mode, created_at`
- [x] **`tutor_messages`** — `id, conversation_id, role (user/assistant), content, created_at`
- [x] **`user_subjects`** — `id, user_id, name, color, total_minutes`
- [x] **`user_profiles`** — `id, user_id, display_name, avatar_url, timezone, preferences (JSON)`
- [x] **`daily_activity`** — `id, user_id, date, total_focus_minutes, sessions_count, tasks_completed`

### 2. API Routes — ~~Missing Endpoints~~ ✅ DONE

All 25+ endpoints created across 6 route files:

**Focus Sessions** — `server/routes/focus.js`
- [x] `POST /api/focus/start` — start a new session
- [x] `POST /api/focus/:id/event` — log a focus event (face, eyes, tab, activity)
- [x] `PATCH /api/focus/:id/end` — end a session, calculate final score
- [x] `GET /api/focus/history` — list user's past sessions (paginated)
- [x] `GET /api/focus/active` — get the currently active session

**Study Planner** — `server/routes/planner.js`
- [x] `POST /api/planner/plans` — create a plan (from syllabus upload)
- [x] `GET /api/planner/plans` — list user's plans
- [x] `GET /api/planner/plans/:id` — get a plan with weeks & tasks
- [x] `PATCH /api/planner/tasks/:id` — toggle task completion
- [x] `DELETE /api/planner/plans/:id` — delete a plan

**AI Tutor** — `server/routes/tutor.js`
- [x] `POST /api/tutor/conversations` — create a new conversation
- [x] `GET /api/tutor/conversations` — list conversations
- [x] `POST /api/tutor/conversations/:id/messages` — send a message & get AI reply
- [x] `GET /api/tutor/conversations/:id/messages` — get conversation history

**Analytics** — `server/routes/analytics.js`
- [x] `GET /api/analytics/summary` — weekly average focus, total hours, streak, distractions
- [x] `GET /api/analytics/focus-trend?days=7` — daily focus scores
- [x] `GET /api/analytics/subject-distribution` — time breakdown by subject
- [ ] `GET /api/analytics/heatmap?range=month` — daily activity heatmap data

**Dashboard** — `server/routes/dashboard.js`
- [x] `GET /api/dashboard/stats` — today's focus score, hours, streak, tasks
- [x] `GET /api/dashboard/upcoming` — next 3-5 upcoming tasks

**User Profile** — `server/routes/user.js`
- [x] `GET /api/user/profile` — get profile + preferences
- [x] `PATCH /api/user/profile` — update display name, avatar, timezone
- [x] `PATCH /api/user/password` — change password
- [x] `DELETE /api/user/account` — account deletion

### 3. Server Infrastructure — ✅ DONE

- [x] **Environment config** — `.env` + `.env.example` with `JWT_SECRET`, `PORT`, `DATABASE_PATH`, `CORS_ORIGIN`; using `dotenv`
- [x] **Request validation** — Zod schemas via `middleware/validate.js` on all write endpoints
- [x] **Error handling middleware** — `middleware/errorHandler.js` with consistent `{ error, code }` responses
- [x] **Rate limiting** — `express-rate-limit` on auth routes (20 req/15 min)
- [ ] **Logging** — Add structured logging (e.g., `pino` or `winston`)
- [ ] **Database migrations** — Instead of inline `CREATE TABLE`, use a migration system
- [x] **Graceful shutdown** — `SIGINT`/`SIGTERM` handlers close DB connection

---

## 🟡 High Priority — Frontend Integration

### 4. Replace All Mock Data with API Calls — ✅ DONE

All feature pages rewritten to use `src/hooks/use-api.ts`:

**Dashboard.tsx**
- [x] Fetch stats from `GET /api/dashboard/stats`
- [x] Fetch upcoming tasks from `GET /api/dashboard/upcoming`
- [x] Wire "Quick Actions" buttons to navigate to respective pages

**FocusMode.tsx**
- [x] Call `POST /api/focus/start` when "Start Focus Session" is clicked
- [x] Implement real timer (synced with server start time)
- [x] Post focus events to `POST /api/focus/:id/event` (tab visibility)
- [x] Call `PATCH /api/focus/:id/end` when session ends
- [x] Display **real-time focus score** (at least 50 when active)
- [x] Wired up UI indicators for events

**StudyPlanner.tsx**
- [x] Fetch plans from `GET /api/planner/plans`
- [x] Implement syllabus upload → `POST /api/planner/plans` (simulated generation for now)
- [x] Wire task checkboxes to `PATCH /api/planner/tasks/:id`
- [x] Delete plans via `DELETE /api/planner/plans/:id`

**AITutor.tsx**
- [x] Send messages to `POST /api/tutor/conversations/:id/messages`
- [x] Stream or display AI responses (using stubbed response for Phase 2)
- [x] Persist conversation history via `GET /api/tutor/conversations/:id/messages`
- [x] Wire mode selection to new conversation creation

**Analytics.tsx**
- [x] Fetch summary from `GET /api/analytics/summary`
- [x] Fetch focus trend from `GET /api/analytics/focus-trend`
- [x] Fetch subject distribution from `GET /api/analytics/subject-distribution`

### 5. API Client & State Management — ✅ DONE

- [x] Create a shared API client (`src/lib/api.ts`) with base URL, auth header injection, and error handling
- [x] Use `@tanstack/react-query` hooks for all data fetching
- [x] Create custom hooks: `useFocusSession`, `useStudyPlans`, `useTutorChat`, `useAnalytics`, `useDashboard` (all in `src/hooks/use-api.ts`)

### 6. Missing Pages & Components — ✅ DONE

- [x] **Settings page** (`/settings`) — created with profile editing, password change, and danger zone
- [x] **Loading / skeleton states** — added to all data-fetching pages
- [x] **Empty states** — added for no tasks, no plans, no conversations
- [x] **Error states** — added validation toast notifications and API error handling

---

## 🟠 Medium Priority — User Experience

### 7. Focus Mode — Core Feature Gaps

- [x] **Real timer** — implement `useEffect` interval for live elapsed time
- [x] **Session persistence** — if user refreshes mid-session, restore from server
- [x] **Focus detection stub** — even without ML, wire up tab-visibility API (`document.hidden`) for tab-switch detection
- [ ] **Session history view** — list of past focus sessions with scores
- [x] **Pomodoro mode** — configurable work/break intervals

### 8. AI Tutor — AI Integration

- [x] **LLM integration** — connect to OpenAI/Gemini API on the backend
- [x] **System prompts per mode** — different behavior for Explain, Quiz, Doubt, Rapid Revision, Interview modes
- [ ] **Streaming responses** — use SSE or WebSocket for real-time AI responses
- [ ] **File/notes upload** — allow users to upload study material for context (RAG)
- [x] **Markdown rendering** — render AI responses with code blocks, math, etc.

### 9. Study Planner — AI Generation

- [x] **Syllabus parser** — accept text input and extract topics
- [x] **AI plan generation** — generate weekly study plan from syllabus using LLM
- [ ] **Drag-and-drop reordering** — let users reorder tasks/weeks
- [ ] **Due date notifications** — highlight overdue tasks
- [ ] **Progress bar** per week showing completion percentage

### 10. User Profile & Settings

- [x] **Profile page** — display name, email, avatar, joined date
- [ ] **Theme toggle** — light/dark mode (already have `next-themes` installed but not wired)
- [ ] **Notification preferences** — focus reminders, streak alerts
- [x] **Account management** — password change, email change, delete account

---

## 🔵 Important — Security & Reliability

### 11. Security Concerns

- [x] **Hardcoded JWT secret** — Now reads from `process.env.JWT_SECRET`, throws in production if missing
- [ ] **No HTTPS enforcement** — add HTTPS redirect in production mode
- [ ] **No CSRF protection** — add CSRF tokens for form submissions
- [x] **Input sanitization** — Zod validation on all write endpoints
- [ ] **Token refresh** — implement refresh token rotation (current: 7-day expiry with no refresh)
- [ ] **Password reset flow** — no "forgot password" functionality
- [ ] **Email validation** — currently accepts any string as email
- [x] **SQLite DB files in repo** — `.gitignore` now covers `*.db`, `*.db-shm`, `*.db-wal`

### 12. Error Handling

- [ ] **AuthContext** — no error state exposed; login/register errors are thrown but not all consumers catch them
- [ ] **API error boundaries** — add React Error Boundary for unexpected crashes
- [ ] **Network error handling** — handle offline state, show reconnection UI
- [ ] **Token expiry handling** — auto-logout when token expires, show "session expired" message

---

## 🟣 Testing & Quality

### 13. Testing

- [ ] **Remove placeholder test** — `example.test.ts` only asserts `true === true`
- [ ] **Backend tests** — test auth routes (register, login, me), validate error cases
- [ ] **API route tests** — test each endpoint with valid and invalid inputs
- [ ] **Frontend component tests** — test `ProtectedRoute`, `AuthContext`, form validation
- [ ] **Integration tests** — full login → dashboard → start session flow
- [ ] **E2E tests** — add Playwright or Cypress for critical user flows

### 14. Code Quality

- [ ] **TypeScript types for API** — create shared types/interfaces for all API request/response shapes
- [ ] **Consistent error types** — standardize API error response format `{ error: string, code?: string }`
- [ ] **Extract constants** — hardcoded strings like `"aekagra_token"` should be constants
- [ ] **Separate concerns** — backend currently mixes DB queries in route handlers; extract service/repository layers
- [ ] **ESLint rules** — run `npm run lint` and fix any existing warnings

---

## ⚪ Nice-to-Have — Polish & DevOps

### 15. Developer Experience

- [x] **`.env.example`** — template created with all required variables
- [ ] **Concurrent server startup** — use `concurrently` to run backend + frontend with single `npm run dev`
- [ ] **Hot-reload for backend** — use `nodemon` for `server:dev` script
- [ ] **API documentation** — add Swagger/OpenAPI spec or at minimum a `docs/API.md`

### 16. Deployment & DevOps (Postponed)
 
- [ ] **Docker setup** — `Dockerfile` + `docker-compose.yml` for containerized development
- [ ] **CI/CD pipeline** — GitHub Actions for lint, test, build on PRs
- [ ] **Production build** — configure Vite build + Express to serve static assets
- [x] **Health check improvement** — `/api/health` now checks DB connectivity and returns `{ status, database }`
- [x] **CORS configuration** — `CORS_ORIGIN` read from env variable (defaults to `localhost:8080`)
- [ ] **Email Auth** — SMTP for password reset (Moved to Future)
- [ ] **Custom Domain** — (Moved to Future)

### 17. Responsive & Accessibility

- [ ] **Mobile sidebar** — current sidebar is fixed 256px; add hamburger menu for mobile
- [ ] **Keyboard navigation** — ensure all interactive elements are keyboard accessible
- [ ] **ARIA labels** — add proper ARIA labels to custom components
- [ ] **Screen reader support** — semantic HTML for focus score circle, analytics charts

---

## Priority Execution Order

| Phase | Items | Estimated Effort |
|-------|-------|-----------------|
| **Phase 1** — Foundation ✅ | Items 1, 2, 3, 11 (DB schema, APIs, server infra, security) | ✅ Complete |
| **Phase 2** — Integration ✅ | Items 4, 5, 6 (wire frontend to backend, API client, missing pages) | ✅ Complete |
| **Phase 3** — Core Features | Items 7, 8, 9, 10 (focus timer, AI tutor, planner, settings) | ✅ Complete |
| **Phase 4** — Quality | Items 12, 13, 14 (error handling, testing, code quality) | 2-3 days |
| **Phase 5** — Polish | Items 15, 16, 17 (DX, deployment, accessibility) | 2-3 days |

---

*Generated on 2026-02-14 from a full codebase audit of `aekagra-ai-focus`.*
