import { cartCookie } from '~/cookies.server'
import { prisma } from '~/db.server'

export async function getCart(request: Request) {
  const cartData = await getCartData(request)
  const cart = !cartData ? [] : await prisma.product.findMany({
    where: { id: { in: Object.keys(cartData) } },
    select: {
      id: true,
      title: true,
      price: true,
      images: { select: { id: true }, take: 1, orderBy: { createdAt: 'desc' } },
    },
  }).then((r) =>
    r.map((p) => ({
      ...p,
      ...cartData[p.id]
    }))
  )
  return cart
}


export async function getCartData(request: Request) {
  const cookie = request.headers.get('Cookie')
  const cartData = await cartCookie.parse(cookie)
  return (cartData || {}) as { [id: string]: { size: { chest: number, name: string, length: number }, quantity: number } }
}
