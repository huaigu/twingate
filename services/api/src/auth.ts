import { createHash, randomBytes } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import type { Context } from 'hono'
import { verifyMessage, type Address, type Hex } from 'viem'
import { createSiweMessage } from 'viem/siwe'

export interface Session { address: Address; csrf: string; expiresAt: number }
export const SESSION_COOKIE = 'signalpass_session'
const digest = (value: string) => createHash('sha256').update(value).digest('hex')
const now = () => Math.floor(Date.now() / 1000)

export function createAuth(db: DatabaseSync, origin: string) {
  const site = new URL(origin)
  if (site.origin !== origin) throw new Error('APP_ORIGIN must be an origin without a trailing slash or path')
  const cookieOptions = { httpOnly: true, secure: site.protocol === 'https:', sameSite: 'Lax' as const, path: '/' }
  return {
    origin,
    sameOrigin(c: Context) { return c.req.header('origin') === origin },
    challenge(address: Address, chainId: number) {
      const time = now()
      db.prepare('DELETE FROM challenges WHERE expires_at < ?').run(time)
      db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(time)
      const count = Number(db.prepare('SELECT count(*) AS n FROM challenges WHERE address = ? AND created_at > ?').get(address.toLowerCase(), time - 60)?.n ?? 0)
      const total = Number(db.prepare('SELECT count(*) AS n FROM challenges').get()?.n ?? 0)
      if (count >= 5 || total >= 1000) return null
      const nonce = randomBytes(16).toString('hex')
      const expiresAt = time + 300
      const message = createSiweMessage({ address, chainId, domain: site.host, uri: origin, version: '1', nonce, issuedAt: new Date(time * 1000), expirationTime: new Date(expiresAt * 1000), statement: 'Sign in to SignalPass. This does not authorize a transaction or payment.' })
      db.prepare('INSERT INTO challenges VALUES(?,?,?,?,?)').run(nonce, address.toLowerCase(), message, expiresAt, time)
      return { nonce, message, expiresAt }
    },
    async verify(nonce: string, signature: Hex, c: Context): Promise<Session | null> {
      const row = db.prepare('SELECT * FROM challenges WHERE nonce = ? AND expires_at >= ?').get(nonce, now())
      if (!row) return null
      let valid = false
      try { valid = await verifyMessage({ address: row.address as Address, message: row.message as string, signature }) } catch { return null }
      if (!valid) return null
      // Atomic consumption prevents concurrent signature replay. Never accept a client-supplied message.
      if (!db.prepare('DELETE FROM challenges WHERE nonce = ? AND expires_at >= ?').run(nonce, now()).changes) return null
      const old = getCookie(c, SESSION_COOKIE)
      if (old) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(old))
      const token = randomBytes(32).toString('hex')
      const session: Session = { address: row.address as Address, csrf: randomBytes(24).toString('hex'), expiresAt: now() + 86400 }
      db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(digest(token), session.address, session.csrf, session.expiresAt)
      setCookie(c, SESSION_COOKIE, token, { ...cookieOptions, maxAge: 86400 })
      return session
    },
    session(c: Context): Session | null {
      const token = getCookie(c, SESSION_COOKIE)
      if (!token || !/^[a-f0-9]{64}$/.test(token)) return null
      const row = db.prepare('SELECT * FROM sessions WHERE token_hash = ? AND expires_at >= ?').get(digest(token), now())
      return row ? { address: row.address as Address, csrf: row.csrf as string, expiresAt: Number(row.expires_at) } : null
    },
    logout(c: Context) {
      const token = getCookie(c, SESSION_COOKIE)
      if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(token))
      deleteCookie(c, SESSION_COOKIE, cookieOptions)
    },
  }
}
