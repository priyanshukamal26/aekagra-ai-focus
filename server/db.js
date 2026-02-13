import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.DATABASE_PATH === ":memory:"
  ? ":memory:"
  : (process.env.DATABASE_PATH
    ? path.resolve(process.env.DATABASE_PATH)
    : path.join(__dirname, "aekagra.db"));

const db = new Database(dbPath);

// Enable WAL mode for better concurrent read performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ── Schema ─────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    preferences TEXT DEFAULT '{}',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// MIGRATION: Ensure preferences column exists for existing databases
try {
  db.prepare("ALTER TABLE user_profiles ADD COLUMN preferences TEXT DEFAULT '{}'").run();
} catch (error) {
  // Column likely already exists, ignore
}

db.exec(`
  CREATE TABLE IF NOT EXISTS focus_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    duration_seconds INTEGER DEFAULT 0,
    focus_score REAL DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK(status IN ('active','completed','abandoned')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS focus_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL,
    event_type TEXT NOT NULL CHECK(event_type IN ('face_detected','face_lost','eyes_away','eyes_back','tab_switch','tab_return','idle','active')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT DEFAULT '{}',
    FOREIGN KEY (session_id) REFERENCES focus_sessions(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS study_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    syllabus_text TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS study_weeks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    topics TEXT DEFAULT '[]',
    FOREIGN KEY (plan_id) REFERENCES study_plans(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS study_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    is_completed INTEGER DEFAULT 0,
    due_date DATE,
    completed_at DATETIME,
    FOREIGN KEY (week_id) REFERENCES study_weeks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tutor_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mode TEXT DEFAULT 'Explain Mode',
    title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS tutor_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user','assistant')),
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES tutor_conversations(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS user_subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#22c55e',
    total_minutes INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS daily_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    total_focus_minutes INTEGER DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    UNIQUE(user_id, date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

// ── Indexes ────────────────────────────────────────────────────────

db.exec(`CREATE INDEX IF NOT EXISTS idx_focus_sessions_user    ON focus_sessions(user_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_focus_events_session   ON focus_events(session_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_study_plans_user       ON study_plans(user_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_study_weeks_plan       ON study_weeks(plan_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_study_tasks_week       ON study_tasks(week_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_study_tasks_user       ON study_tasks(user_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_tutor_convos_user      ON tutor_conversations(user_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_tutor_msgs_convo       ON tutor_messages(conversation_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_user_subjects_user     ON user_subjects(user_id)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_daily_activity_user    ON daily_activity(user_id, date)`);

export default db;
