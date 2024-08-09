import { ActionFunctionArgs, json, redirect } from "@remix-run/node"
import z from 'zod'
import { cartCookie } from "~/cookies.server"
import { getCartData } from "~/utils/cart.server"

export const loader = async () => {
  return redirect('/')
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()
  const body = Object.fromEntries([...formData.entries()])

  if (body.action === 'add') {
    const data = schema.parse(body)
    const cartData = await getCartData(request)
    cartData[data.id] = { size: { name: data.size, chest: data.chest, length: data.length }, quantity: data.quantity }
    if (data.checkout) {
      return redirect('/checkout', {
        headers: {
          'Set-Cookie': await cartCookie.serialize(cartData)
        }
      })
    }
    return json({ error: null, action: data.action }, {
      headers: {
        'Set-Cookie': await cartCookie.serialize(cartData)
      }
    })
  }
  if (body.action === 'remove') {
    const cartData = await getCartData(request)
    if (typeof body.id !== 'string') return json({ error: "Bad req" })
    delete cartData[body.id]
    return json({ error: null, action: body.action }, {
      headers: { 'set-cookie': await cartCookie.serialize(cartData) }
    })
  }

  return json({ error: null })
}

const schema = z.object({
  id: z.string(),
  size: z.string(),
  action: z.optional(z.string()),
  checkout: z.optional(z.string()).transform(r => r === 'true'),
  chest: z.string().transform(r => Number(r)),
  length: z.string().transform(r => Number(r)),
  quantity: z.string().transform(r => Number(r))
})
