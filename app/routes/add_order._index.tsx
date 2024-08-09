import { CaretLeft } from '@phosphor-icons/react';
import { ActionFunctionArgs, json, MetaFunction, redirect } from '@remix-run/node';
import { Link, useFetcher, useNavigation } from '@remix-run/react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { getClientIPAddress } from "remix-utils/get-client-ip-address";
import { z } from 'zod';
import { MAX_ADD_ORDER_TRIES } from '~/constants/api';
import { messageCookie } from '~/cookies.server';
import { prisma, redis } from '~/db.server';
import { addOrder } from '~/utils/order.server';


export default function AddOrder() {
  const navigation = useNavigation()
  const [phone, setPhone] = useState('')
  const [countries, setCountries] = useState<{ name: string, code: string }[]>([])
  const [country, setCountry] = useState('PK')
  const [province, setProvince] = useState('Sindh')
  const fetcher = useFetcher<{ error: null | string }>()
  useEffect(() => {
    import('~/constants/countries').then(r => setCountries(r.default))
  }, [])
  return (
    <motion.div initial={{ height: 0 }} animate={{ height: navigation.state !== 'idle' ? 0 : '100vh' }} className="overflow-hidden">
      <div className="h-screen p-8 overflow-y-auto">
        <div className="relative">
          <Link to='/orders' className="border-2 border-white/50 w-max flex items-center gap-2 px-4 py-2 border-white/30 hover:bg-white hover:text-black"><CaretLeft /><span>orders</span></Link>
          <Link state={{ noAnimate: true }} to='/'><img src='/logo.svg' alt='logo' className="hidden sm:block w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></Link>
        </div>
        <div className="mb-10 mt-8">
          <motion.h1 className="text-5xl font-bold">add order(s)</motion.h1>
          <fetcher.Form method='post' className="max-w-lg mt-8 space-y-4">
            <div className="flex flex-col">
              <p className="mb-2 normal-case">Email address</p>
              <input required name='email' type="email" className="px-4 py-2 rounded-none border-white text-white bg-black" placeholder='Your email address' />
            </div>
            <div className="flex flex-col">
              <p className="mb-2 normal-case">Phone number</p>
              <input value={phone} onChange={e => setPhone(e.target.value.match(/\d/g)?.join('') || '')} name='phone' type="text" required className="px-4 py-2 rounded-none border-white text-white bg-black" placeholder='Your phone number' />
            </div>
            <div className="flex flex-col">
              <p className="mb-2 normal-case">First name</p>
              <input required name='first_name' type="text" className="px-4 py-2 rounded-none border-white text-white bg-black" placeholder='Your first name' />
            </div>
            <div className="flex-col flex">
              <p className="mb-2 normal-case">Country</p>
              <select required name="country" id="country" className="px-4 py-2 rounded-none border-white text-white bg-black" value={country} onChange={e => setCountry(e.target.value)}>
                {countries.map((r, i) => (
                  <option disabled={country === r.code} key={i} value={r.code}>{r.name}</option>
                ))}
              </select>
              <input type="hidden" name="country" value={country} />
            </div>
            <div className="flex flex-col">
              <p className="mb-2 normal-case">Province</p>
              {country === 'PK' ? (
                <>
                  <select required name="province" id="province" className="px-4 py-2 rounded-none border-white text-white bg-black" value={province} onChange={e => setProvince(e.target.value)}>
                    {[
                      'Punjab',
                      'Sindh',
                      'Khyber Pakhtunkhwa',
                      'Balouchistan',
                      'Azad Kashmir',
                      'Gilgit Baltistan',
                    ].map(r => (
                      <option key={r} disabled={province === r} value={r}>{r}</option>
                    ))}
                  </select>
                  <input type="hidden" name="province" value={province} />
                </>
              ) : (
                <input value={province} onChange={e => setProvince(e.target.value)} name='province' type="text" className="px-4 py-2 rounded-none border-white text-white bg-black" placeholder='Your province' />
              )}
            </div>
            <button disabled={fetcher.state !== 'idle'} className="!mt-16 px-8 block w-full py-4 bg-black text-white border-2 border-white text-lg font-medium disabled:opacity-50">{fetcher.state !== 'idle' ? 'Searching...' : 'Search'}</button>
            {fetcher.data?.error ? (
              <p className="normal-case text-red-400">Error: {fetcher.data?.error}</p>
            ) : null}
          </fetcher.Form>
        </div>

      </div>

    </motion.div>
  )
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const ip = getClientIPAddress(request)

  if (process.env.NODE_ENV === 'production') {
    if (!ip) return json({ error: "Invalid request." })
    const key = 'add_order_limit:' + ip
    const triesStr = await redis.get(key) || '0'
    const tries = Number(triesStr)
    if (tries >= MAX_ADD_ORDER_TRIES) return json({ error: "Too many tries. Please try again later." })
    await redis.incr(key)
    await redis.expire(key, 3600)
  }

  const formData = await request.formData()
  const body = schema.parse(Object.fromEntries([...formData.entries()]))
  const orders = await prisma.order.findMany({
    where: {
      firstName: body.first_name,
      phone: body.phone,
      email: body.email,
      country: body.country,
      province: body.province
    },
    select: { id: true }
  })
  if (!orders.length) return json({ error: "No orders were found with this information. Please make sure to provide exact information." })

  return redirect('/orders', {
    headers: [
      ['set-cookie', await addOrder(orders.map(r => r.id), request)],
      ['set-cookie', await messageCookie.serialize('add_order:' + orders.length)]
    ]
  })
}

const schema = z.object({
  email: z.string(),
  phone: z.string(),
  first_name: z.string(),
  country: z.string(),
  province: z.string()
})

export const meta: MetaFunction = () => {
  return [
    { title: 'Add order | ZED' },
  ]
}
