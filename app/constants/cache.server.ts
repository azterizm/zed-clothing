export const shortCacheHeader = process.env.NODE_ENV !== 'production' ? `no-cache, no-store, must-revalidate` : `max-age=3600, public`
export const longCacheHeader = process.env.NODE_ENV !== 'production' ? `no-cache, no-store, must-revalidate` : `max-age=604800, public`
export const preventCacheHeader = `no-cache, no-store, must-revalidate`

