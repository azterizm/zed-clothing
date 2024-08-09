import { reviewsCookie } from '~/cookies.server'

export async function getSavedReviews(request: Request) {
  const cookie = request.headers.get('Cookie')
  const orders = await reviewsCookie.parse(cookie)
  return (orders || []) as string[]
}

export async function addReview(ids: string | string[], request: Request) {
  const current = await getSavedReviews(request)
  return await reviewsCookie.serialize([...current, ...Array.isArray(ids) ? [...ids] : [ids]].filter((v, i, a) => a.indexOf(v) === i))
}

export async function removeReview(ids: string | string[], request: Request) {
  const current = await getSavedReviews(request)
  return await reviewsCookie.serialize(current.filter(r => Array.isArray(ids) ? !ids.includes(r) : r !== ids))
}

