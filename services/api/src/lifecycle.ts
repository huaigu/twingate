interface HttpServer {
  close(callback: (error?: Error) => void): unknown
  closeAllConnections?(): void
}

/** Track asynchronous work so normal shutdown never closes SQLite under it. */
export function createLifecycle(options: { graceMs: number; closeResources: () => void; exit: (code: number) => void }) {
  let stopping = false
  let shutdown: Promise<{ forced: boolean; exitCode: number }> | undefined
  const work = new Set<Promise<unknown>>()
  const idle = new Set<() => void>()
  function track<T>(operation: () => T | Promise<T>): Promise<T> {
    const pending = Promise.resolve().then(operation).finally(() => {
      work.delete(pending)
      if (work.size === 0) { for (const resolve of idle) resolve(); idle.clear() }
    })
    work.add(pending)
    return pending
  }
  return {
    fetch: (handler: (request: Request) => Response | Promise<Response>) => (request: Request) => {
      if (stopping) return Promise.resolve(Response.json({ error: 'service_draining' }, { status: 503, headers: { 'cache-control': 'no-store', 'retry-after': '5' } }))
      return track(() => handler(request))
    },
    background(operation: () => unknown | Promise<unknown>) { return stopping ? Promise.resolve() : track(operation) },
    stop(server: HttpServer) {
      if (shutdown) return shutdown
      stopping = true
      shutdown = (async () => {
        let timer: ReturnType<typeof setTimeout> | undefined
        const closed = new Promise<void>((resolve) => { server.close(() => resolve()) })
        const drained = work.size === 0 ? Promise.resolve() : new Promise<void>((resolve) => idle.add(resolve))
        const forced = await Promise.race([
          Promise.all([closed, drained]).then(() => false),
          new Promise<true>((resolve) => { timer = setTimeout(() => resolve(true), options.graceMs) }),
        ])
        if (timer) clearTimeout(timer)
        let exitCode = forced ? 1 : 0
        try {
          if (forced) server.closeAllConnections?.()
          options.closeResources()
        } catch { exitCode = 1 }
        // On forced shutdown the process exits immediately: no abandoned handler
        // may resume against the closed database. Normal shutdown drains it first.
        options.exit(exitCode)
        return { forced, exitCode }
      })()
      return shutdown
    },
  }
}
