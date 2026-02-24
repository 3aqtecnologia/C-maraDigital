const isDev = import.meta.env.DEV

export const logger = {
  error: (msg: string, ...args: unknown[]) => {
    if (isDev) console.error(`[error] ${msg}`, ...args)
  },
  warn: (msg: string, ...args: unknown[]) => {
    if (isDev) console.warn(`[warn] ${msg}`, ...args)
  },
}
