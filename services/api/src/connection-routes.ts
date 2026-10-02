import type { Context, Hono } from 'hono'
import { z } from 'zod'
import type { Session } from './auth.js'
import { collection } from './database.js'
import type { Store, StoredIntroduction } from './store.js'

type Env = { Variables: { session: Session } }
export interface ConnectionContact {
  type: 'email' | 'contact_url' | 'scheduling_url'
  label: string
  value: string
  updatedAt: number
}
interface Participants { intro: StoredIntroduction; owner: string; other: string }
const controls = /[\p{Cc}\p{Cf}]/u
const encodedControls = /%(?:0[0-9a-f]|1[0-9a-f]|7f|8[0-9a-f]|9[0-9a-f])/i
const text = (max: number) => z.string().refine((value) => !controls.test(value)).transform((value) => value.trim()).pipe(z.string().min(1).max(max))
const email = z.string().email().max(254)
function safeHttps(value: string) {
  if (/\s|\\/.test(value)) return false
  try {
    // Decode whole UTF-8 sequences: continuation bytes are not control characters.
    if (controls.test(decodeURIComponent(value))) return false
    const url = new URL(value)
    return url.protocol === 'https:' && Boolean(url.hostname) && !url.username && !url.password
  } catch { return false }
}
const contactInput = z.object({
  type: z.enum(['email', 'contact_url', 'scheduling_url']),
  label: text(60),
  value: text(1200),
}).strict().superRefine((contact, context) => {
  const valid = contact.type === 'email'
    ? email.safeParse(contact.value).success && !encodedControls.test(contact.value)
    : safeHttps(contact.value)
  if (!valid) context.addIssue({ code: z.ZodIssueCode.custom, path: ['value'], message: 'Use an email address or an HTTPS link without credentials or control characters.' })
}).transform((contact) => ({ ...contact, value: contact.type === 'email' ? contact.value : new URL(contact.value).href }))

/** Contacts are a separate, participant-only disclosure; never part of profile or receipt projection. */
export function installConnectionRoutes(app: Hono<Env>, store: Store) {
  const contacts = collection<ConnectionContact>(store.db, 'connection_contacts')
  const key = (id: string, owner: string) => `${id}:${owner.toLowerCase()}`
  const participants = (c: Context<Env>): Participants | Response => {
    const id = c.req.param('id')
    const intro = id ? store.introductions.get(id) : undefined
    const owner = c.get('session').address.toLowerCase()
    if (!intro || ![intro.sender.toLowerCase(), intro.recipient.toLowerCase()].includes(owner)) return c.json({ error: 'introduction_not_found' }, 404)
    if (intro.state !== 'accepted') return c.json({ error: 'introduction_not_accepted' }, 409)
    return { intro, owner, other: (intro.sender.toLowerCase() === owner ? intro.recipient : intro.sender).toLowerCase() }
  }
  const project = ({ intro, owner, other }: Participants) => ({ connection: {
    introductionId: intro.id,
    ownContact: contacts.get(key(intro.id, owner)) ?? null,
    otherContact: contacts.get(key(intro.id, other)) ?? null,
  } })
  app.get('/introductions/:id/connection', (c) => {
    const target = participants(c)
    return target instanceof Response ? target : c.json(project(target))
  })
  app.post('/introductions/:id/connection', async (c) => {
    let target = participants(c)
    if (target instanceof Response) return target
    const input = contactInput.safeParse(await c.req.json().catch(() => null))
    if (!input.success) return c.json({ error: 'invalid_contact' }, 400)
    // Recheck after awaiting the body in case reconciliation changed the state.
    target = participants(c)
    if (target instanceof Response) return target
    contacts.set(key(target.intro.id, target.owner), { ...input.data, updatedAt: Math.floor(Date.now() / 1000) })
    return c.json(project(target))
  })
  app.post('/introductions/:id/connection/remove', async (c) => {
    let target = participants(c)
    if (target instanceof Response) return target
    const input = z.object({}).strict().safeParse(await c.req.json().catch(() => null))
    if (!input.success) return c.json({ error: 'invalid_request' }, 400)
    target = participants(c)
    if (target instanceof Response) return target
    contacts.delete(key(target.intro.id, target.owner))
    return c.json(project(target))
  })
}
