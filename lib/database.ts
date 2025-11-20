import Database from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";
import { normalizeDateString } from "./constants";

export interface TimeEntry {
  date: string;
  project: string;
  duration: number;
  startTime: string;
  endTime: string;
}

export interface Timer {
  timerId: string;
  project: string;
  startTime: string;
  elapsedTime: number;
  isRunning: boolean;
}

export interface ProjectWithRate {
  name: string;
  hourlyRate: number;
}

export interface TimeEntryWithCost extends TimeEntry {
  cost: number;
  hourlyRate: number;
}

export interface TimeEntryWithId extends TimeEntryWithCost {
  id: string;
}

let db: Database.Database | null = null;

function getDataDirectory(): string {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return dataDir;
}

function getDatabasePath(): string {
  const dataDir = getDataDirectory();
  return path.join(dataDir, "time-tracking.db");
}

function getDatabase(): Database.Database {
  if (!db) {
    const dbPath = getDatabasePath();
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

function initializeDatabase() {
  const database = getDatabase();

  database.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      hourly_rate REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS time_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration REAL NOT NULL,
      description TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS timers (
      timer_id TEXT PRIMARY KEY,
      project_id INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      elapsed_time REAL DEFAULT 0,
      is_running INTEGER DEFAULT 1,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_time_entries_project_date
      ON time_entries(project_id, date);
    CREATE INDEX IF NOT EXISTS idx_time_entries_date
      ON time_entries(date);
    CREATE INDEX IF NOT EXISTS idx_timers_project
      ON timers(project_id);
  `);
}

export function initializeExcelFile() {
  try {
    initializeDatabase();
  } catch (error) {
    console.error("Error initializing database:", error);
    throw new Error("Не удалось инициализировать базу данных. Проверьте права доступа к папке data.");
  }
}

export function getProjects(): ProjectWithRate[] {
  initializeDatabase();
  const database = getDatabase();

  const stmt = database.prepare(`
    SELECT name, hourly_rate as hourlyRate
    FROM projects
    ORDER BY name
  `);

  return stmt.all() as ProjectWithRate[];
}

export function addProject(projectName: string, hourlyRate: number = 0) {
  try {
    initializeDatabase();
    const database = getDatabase();

    const stmt = database.prepare(`
      INSERT INTO projects (name, hourly_rate)
      VALUES (?, ?)
    `);

    try {
      stmt.run(projectName, hourlyRate);
    } catch (error: any) {
      if (error.code === "SQLITE_CONSTRAINT") {
        throw new Error("Проект уже существует");
      }
      throw error;
    }
  } catch (error: any) {
    console.error("Error adding project:", error);
    if (error.message === "Проект уже существует") throw error;
    throw new Error("Не удалось добавить проект.");
  }
}

export function updateProjectRate(projectName: string, hourlyRate: number) {
  try {
    initializeDatabase();
    const database = getDatabase();

    const stmt = database.prepare(`
      UPDATE projects
      SET hourly_rate = ?
      WHERE name = ?
    `);

    stmt.run(hourlyRate, projectName);
  } catch (error) {
    console.error("Error updating project rate:", error);
    throw new Error("Не удалось обновить ставку проекта.");
  }
}

function getProjectId(database: Database.Database, projectName: string): number | null {
  const stmt = database.prepare(`SELECT id FROM projects WHERE name = ?`);
  const result = stmt.get(projectName) as { id: number } | undefined;
  return result?.id ?? null;
}

export function saveTimeEntry(entry: TimeEntry) {
  try {
    initializeDatabase();
    const database = getDatabase();

    let projectId = getProjectId(database, entry.project);
    if (!projectId) {
      addProject(entry.project, 0);
      projectId = getProjectId(database, entry.project);
      if (!projectId) {
        throw new Error("Failed to create project");
      }
    }

    const stmt = database.prepare(`
      INSERT INTO time_entries (project_id, date, start_time, end_time, duration, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(projectId, entry.date, entry.startTime, entry.endTime, entry.duration, "");
  } catch (error) {
    console.error("Error saving time entry:", error);
    throw new Error("Не удалось сохранить запись времени.");
  }
}

export function getProjectEntries(projectName: string): TimeEntryWithCost[] {
  initializeDatabase();
  const database = getDatabase();

  const stmt = database.prepare(`
    SELECT
      te.date,
      te.start_time as startTime,
      te.end_time as endTime,
      te.duration,
      p.name as project,
      p.hourly_rate as hourlyRate,
      ROUND(te.duration * p.hourly_rate, 2) as cost
    FROM time_entries te
    JOIN projects p ON te.project_id = p.id
    WHERE p.name = ?
    ORDER BY te.date DESC, te.start_time DESC
  `);

  const entries = stmt.all(projectName) as any[];

  return entries.map(entry => ({
    date: normalizeDateString(entry.date),
    startTime: entry.startTime,
    endTime: entry.endTime,
    duration: entry.duration,
    project: entry.project,
    hourlyRate: entry.hourlyRate,
    cost: entry.cost
  }));
}

export function getAllTimeEntries(): TimeEntryWithId[] {
  initializeDatabase();
  const database = getDatabase();

  const stmt = database.prepare(`
    SELECT
      te.id,
      te.date,
      te.start_time as startTime,
      te.end_time as endTime,
      te.duration,
      p.name as project,
      p.hourly_rate as hourlyRate,
      ROUND(te.duration * p.hourly_rate, 2) as cost
    FROM time_entries te
    JOIN projects p ON te.project_id = p.id
    ORDER BY te.date DESC, te.start_time DESC
  `);

  const entries = stmt.all() as any[];

  return entries.map(entry => ({
    id: `${entry.project}|${entry.date}|${entry.startTime}|${entry.endTime}`,
    date: normalizeDateString(entry.date),
    startTime: entry.startTime,
    endTime: entry.endTime,
    duration: entry.duration,
    project: entry.project,
    hourlyRate: entry.hourlyRate,
    cost: entry.cost
  }));
}

export function updateTimeEntry(id: string, updatedEntry: Partial<TimeEntry>) {
  try {
    initializeDatabase();
    const database = getDatabase();

    const parts = id.split("|");
    if (parts.length !== 4) throw new Error("Invalid entry ID");

    const [project, date, startTime, endTime] = parts;
    const normalizedDate = normalizeDateString(date);

    const projectId = getProjectId(database, project);
    if (!projectId) throw new Error("Project not found");

    const findStmt = database.prepare(`
      SELECT id FROM time_entries
      WHERE project_id = ?
        AND date = ?
        AND start_time = ?
        AND end_time = ?
    `);

    const entry = findStmt.get(projectId, normalizedDate, startTime, endTime) as { id: number } | undefined;
    if (!entry) throw new Error("Entry not found");

    const updates: string[] = [];
    const values: any[] = [];

    if (updatedEntry.date !== undefined) {
      updates.push("date = ?");
      values.push(updatedEntry.date);
    }
    if (updatedEntry.startTime !== undefined) {
      updates.push("start_time = ?");
      values.push(updatedEntry.startTime);
    }
    if (updatedEntry.endTime !== undefined) {
      updates.push("end_time = ?");
      values.push(updatedEntry.endTime);
    }
    if (updatedEntry.duration !== undefined) {
      updates.push("duration = ?");
      values.push(updatedEntry.duration);
    }

    if (updates.length === 0) return;

    values.push(entry.id);

    const updateStmt = database.prepare(`
      UPDATE time_entries
      SET ${updates.join(", ")}
      WHERE id = ?
    `);

    updateStmt.run(...values);
  } catch (error) {
    console.error("Error updating time entry:", error);
    throw new Error("Не удалось обновить запись времени.");
  }
}

export function deleteTimeEntry(id: string) {
  try {
    initializeDatabase();
    const database = getDatabase();

    const parts = id.split("|");
    if (parts.length !== 4) throw new Error("Invalid entry ID");

    const [project, date, startTime, endTime] = parts;
    const normalizedDate = normalizeDateString(date);

    const projectId = getProjectId(database, project);
    if (!projectId) throw new Error("Project not found");

    const stmt = database.prepare(`
      DELETE FROM time_entries
      WHERE project_id = ?
        AND date = ?
        AND start_time = ?
        AND end_time = ?
    `);

    const result = stmt.run(projectId, normalizedDate, startTime, endTime);
    if (result.changes === 0) throw new Error("Entry not found");
  } catch (error) {
    console.error("Error deleting time entry:", error);
    throw new Error("Не удалось удалить запись времени.");
  }
}

export function getActiveTimers(): Timer[] {
  initializeDatabase();
  const database = getDatabase();

  const stmt = database.prepare(`
    SELECT
      t.timer_id as timerId,
      p.name as project,
      t.start_time as startTime,
      t.elapsed_time as elapsedTime,
      t.is_running as isRunning
    FROM timers t
    JOIN projects p ON t.project_id = p.id
  `);

  const timers = stmt.all() as any[];

  return timers.map(timer => ({
    timerId: timer.timerId,
    project: timer.project,
    startTime: timer.startTime,
    elapsedTime: timer.elapsedTime,
    isRunning: Boolean(timer.isRunning)
  }));
}

export function getTimer(timerId: string): Timer | null {
  const timers = getActiveTimers();
  return timers.find((t) => t.timerId === timerId) || null;
}

export function startTimer(timerId: string, project: string): Timer {
  try {
    initializeDatabase();
    const database = getDatabase();

    let projectId = getProjectId(database, project);
    if (!projectId) {
      addProject(project, 0);
      projectId = getProjectId(database, project);
      if (!projectId) throw new Error("Failed to create project");
    }

    const timer: Timer = {
      timerId,
      project,
      startTime: new Date().toISOString(),
      elapsedTime: 0,
      isRunning: true,
    };

    const stmt = database.prepare(`
      INSERT OR REPLACE INTO timers (timer_id, project_id, start_time, elapsed_time, is_running)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(timerId, projectId, timer.startTime, timer.elapsedTime, 1);
    return timer;
  } catch (error) {
    console.error("Error starting timer:", error);
    throw new Error("Не удалось запустить таймер.");
  }
}

export function updateTimer(timerId: string, elapsedTime: number): Timer | null {
  try {
    initializeDatabase();
    const database = getDatabase();

    const stmt = database.prepare(`
      UPDATE timers
      SET elapsed_time = ?
      WHERE timer_id = ?
    `);

    const result = stmt.run(elapsedTime, timerId);
    if (result.changes === 0) return null;

    return getTimer(timerId);
  } catch (error) {
    console.error("Error updating timer:", error);
    throw new Error("Не удалось обновить таймер.");
  }
}

export function stopTimer(timerId: string): Timer | null {
  try {
    initializeDatabase();
    const database = getDatabase();

    const stmt = database.prepare(`
      UPDATE timers
      SET is_running = 0
      WHERE timer_id = ?
    `);

    const result = stmt.run(timerId);
    if (result.changes === 0) return null;

    return getTimer(timerId);
  } catch (error) {
    console.error("Error stopping timer:", error);
    throw new Error("Не удалось остановить таймер.");
  }
}

export function deleteTimer(timerId: string): boolean {
  try {
    initializeDatabase();
    const database = getDatabase();

    const stmt = database.prepare(`DELETE FROM timers WHERE timer_id = ?`);
    const result = stmt.run(timerId);

    return result.changes > 0;
  } catch (error) {
    console.error("Error deleting timer:", error);
    throw new Error("Не удалось удалить таймер.");
  }
}

export function getSettingValue(key: string): string | undefined {
  initializeDatabase();
  const database = getDatabase();

  const stmt = database.prepare(`SELECT value FROM settings WHERE key = ?`);
  const result = stmt.get(key) as { value: string } | undefined;

  return result?.value;
}

export function setSettingValue(key: string, value: string | number): void {
  initializeDatabase();
  const database = getDatabase();

  const stmt = database.prepare(`
    INSERT OR REPLACE INTO settings (key, value)
    VALUES (?, ?)
  `);

  stmt.run(key, String(value));
}

