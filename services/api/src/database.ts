import { chmodSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

const encode = (value: unknown): string => JSON.stringify(value, (_key, v) =>
  typeof v === 'bigint' ? { $signalpassBigInt: v.toString() } : v)
const decode = <T>(value: string): T => JSON.parse(value, (_key, v) =>
  v && typeof v === 'object' && Object.keys(v).length === 1 && '$signalpassBigInt' in v
    ? BigInt(v.$signalpassBigInt) : v) as T

export interface Collection<T> {
  get(key: string): T | undefined
  set(key: string, value: T): void
  delete(key: string): void
  values(): IterableIterator<T>
  readonly size: number
}

export function openDatabase(path: string): DatabaseSync {
  if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
  const db = new DatabaseSync(path)
  if (path !== ':memory:') chmodSync(path, 0o600)
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS documents (
      collection TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL,
      PRIMARY KEY (collection, key)
    );
    CREATE TABLE IF NOT EXISTS challenges (
      nonce TEXT PRIMARY KEY, address TEXT NOT NULL, message TEXT NOT NULL,
      expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, address TEXT NOT NULL, csrf TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS idempotency (
      owner TEXT NOT NULL, key TEXT NOT NULL, payload_hash TEXT NOT NULL,
      introduction_id TEXT NOT NULL, PRIMARY KEY (owner, key)
    );
  `)
  return db
}

export function collection<T>(db: DatabaseSync, name: string): Collection<T> {
  return {
    get(key) {
      const row = db.prepare('SELECT value FROM documents WHERE collection = ? AND key = ?').get(name, key)
      return row ? decode<T>(row.value as string) : undefined
    },
    set(key, value) {
      db.prepare('INSERT INTO documents(collection,key,value) VALUES(?,?,?) ON CONFLICT(collection,key) DO UPDATE SET value=excluded.value').run(name, key, encode(value))
    },
    delete(key) { db.prepare('DELETE FROM documents WHERE collection = ? AND key = ?').run(name, key) },
    *values() {
      for (const row of db.prepare('SELECT value FROM documents WHERE collection = ? ORDER BY rowid').all(name)) yield decode<T>(row.value as string)
    },
    get size() { return Number(db.prepare('SELECT count(*) AS n FROM documents WHERE collection = ?').get(name)?.n ?? 0) },
  }
}

export function transaction<T>(db: DatabaseSync, run: () => T): T {
  db.exec('BEGIN IMMEDIATE')
  try { const result = run(); db.exec('COMMIT'); return result }
  catch (error) { db.exec('ROLLBACK'); throw error }
}
