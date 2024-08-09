import { ordersCookie } from '~/cookies.server'

export async function getSavedOrders(request: Request) {
  const cookie = request.headers.get('Cookie')
  const orders = await ordersCookie.parse(cookie)
  return (orders || []) as string[]
}

export async function addOrder(ids: string | string[], request: Request) {
  const current = await getSavedOrders(request)
  return await ordersCookie.serialize([...current, ...Array.isArray(ids) ? [...ids] : [ids]].filter((v, i, a) => a.indexOf(v) === i))
}
