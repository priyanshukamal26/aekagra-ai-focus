# Aekagra AI — Historical Git Timeline & Provenance Reconstruction

> **Notice:** This repository documents work originally developed locally between **February 14, 2026** and **July 29, 2026**, prior to its initial public publication on GitHub on **October 30, 2026**.

---

## 1. Context & Objectives

Aekagra AI was authored and iteratively developed on a local development machine. Although Git was initialized subsequent to development, the project's historical creation and modification timestamps were preserved on the local NTFS filesystem.

Rather than collapsing the entire codebase into an uninformative single commit on the upload date, this repository's commit graph has been reconstructed using genuine filesystem metadata to reflect the logical and chronological milestones of its creation.

---

## 2. Methodology & Evidence Sources

### Primary Metadata Sources
1. **Windows NTFS Attributes:** Exact `CreationTime` and `LastWriteTime` timestamps captured for every file in both Local Time (`Asia/Kolkata`, `UTC+05:30`) and UTC.
2. **Architecture & Dependency Graph:** Logical progression from framework scaffolding & UI primitives to backend database engines, API routes, LLM services, and interactive GSAP animations.
3. **Canonical Manifest:** The root [`FILE_PROVENANCE.csv`](./FILE_PROVENANCE.csv) file contains the full cryptographic ledger of all repository files, timestamps, and commit associations.

---

## 3. Reconstructed Development Milestones

The historical progression is mapped into four distinct, sequential commits:

### Commit 1: Project Scaffolding, Design System & Core Primitives
- **Date:** `2026-02-14 02:25:00 +0530` (`2026-02-13 20:55:00 UTC`)
- **Scope:** 
  - Vite 5, React 18, TypeScript, Tailwind CSS, PostCSS, and Vitest configuration.
  - Complete shadcn/ui and Radix UI component library (buttons, dialogs, dropdowns, forms, cards, tabs, tooltips).
  - Project documentation (`README.md`) and `.gitignore`.

### Commit 2: Express Backend Foundation, SQLite Setup & Auth Flow
- **Date:** `2026-02-14 03:00:00 +0530` (`2026-02-13 21:30:00 UTC`)
- **Scope:**
  - Express 5 server initialization (`server/index.js`).
  - SQLite database foundation (`server/db.js`) with users schema and WAL mode.
  - JWT authentication routes (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`).
  - Client-side auth integration (`AuthContext.tsx`, `ProtectedRoute.tsx`).

### Commit 3: Full Feature APIs, AI LLM Services & Study Engine
- **Date:** `2026-02-14 16:30:00 +0530` (`2026-02-14 11:00:00 UTC`)
- **Scope:**
  - 11-table relational schema for focus sessions, study plans, tasks, and tutor chats.
  - 25+ REST endpoints across focus, planner, tutor, analytics, dashboard, and user modules.
  - AI Tutor dual engine: Google Gemini 1.5 Flash cloud integration + local Ollama support.
  - Client vision pipeline: MediaPipe Face Landmarker integration (`FocusCamera.tsx`).
  - Unit and integration tests for auth and tutor endpoints.

### Commit 4: Rich GSAP Animations, Modern Aesthetics & Polish
- **Date:** `2026-07-29 19:15:00 +0530` (`2026-07-29 13:45:00 UTC`)
- **Scope:**
  - GSAP 3 animation system integration (`gsap-setup.ts`, `use-gsap-entrance.ts`, `use-magnetic.ts`).
  - Interactive page entrances and micro-interactions across Landing, Dashboard, Tutor, and Settings pages.
  - Agent workflows and skills integration.

---

## 4. Technical Distinctions

- **Git Author & Committer Dates:** Both `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE` were explicitly set during repository creation to preserve the historical timeline.
- **GitHub Push Date:** When pushed to GitHub, GitHub records the actual server-side push timestamp (`October 30, 2026`). This distinction is natural: commits accurately reflect when the code was written, while push logs reflect when it was published.
- **Intermediate File Versions:** Modern Git stores whole snapshots. Because intermediate file diffs between Feb and July were not stored in an active version control system at the time, final state files are captured cleanly across their corresponding development milestones.
