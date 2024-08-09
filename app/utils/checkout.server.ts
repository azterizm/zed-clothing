import { z } from 'zod'
import { checkoutInfoCookie } from '~/cookies.server'
import { schema } from '~/routes/checkout._index'

export async function getSavedCheckoutInfo(request: Request) {
  const cookie = request.headers.get('Cookie')
  const checkout = await checkoutInfoCookie.parse(cookie)
  return checkout as z.infer<typeof schema> | null
}
