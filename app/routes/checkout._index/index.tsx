
import { ArrowRight, Cards, CaretLeft, Check, Spinner, Truck, X } from "@phosphor-icons/react"
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction, redirect } from "@remix-run/node"
import { Link, useFetcher, useLoaderData, useNavigation } from "@remix-run/react"
import classNames from "classnames"
import { motion } from "framer-motion"
import { serialize } from "object-to-formdata"
import { useEffect, useState } from "react"
import z from 'zod'
import { Table, TableBody, TableCell, TableRow } from "~/components/Table"
import { cartCookie, checkoutInfoCookie } from "~/cookies.server"
import { prisma, redis } from "~/db.server"
import '~/styles/checkout.css'
import { getCart } from "~/utils/cart.server"
import { getSavedCheckoutInfo } from "~/utils/checkout.server"
import { addOrder } from "~/utils/order.server"
import CartDisplay from "./CartDisplay"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cart = await getCart(request)
  if (!cart.length) return redirect('/')
  const shippingFee = Number(await redis.get('shipping_fee') || '150')
  const subtotal = cart.map(r => r.quantity * r.price).reduce((a, c) => a + c, 0)
  const info = await getSavedCheckoutInfo(request)
  return json({ cart, shippingFee, subtotal, info })
}

export default function Checkout() {
  const { info, cart, shippingFee, subtotal } = useLoaderData<typeof loader>()
  const [countries, setCountries] = useState<{ name: string, code: string }[]>([])
  const [country, setCountry] = useState('PK')
  const [province, setProvince] = useState('Sindh')
  const [payment, setPayment] = useState(Payment.COD)
  const [billTo, setBillTo] = useState(BillTo.SameAddress)
  const [phone, setPhone] = useState('')

  const fetcher = useFetcher()
  const navigation = useNavigation()

  useEffect(() => { import('~/constants/countries').then(r => setCountries(r.default)) }, [])
  useEffect(() => { if (country !== 'PK') setProvince('') }, [country])

  function removeSavedData() {
    fetcher.submit(serialize({ action: 'remove_saved_data' }), { method: 'post' })
  }

  const savedDataKeys = Object.keys(info || {}) as Array<keyof NonNullable<typeof info>>

  return (
    <div id='checkout' className={classNames('p-8 flex flex-col max-h-screen transition-transform', navigation.state !== 'idle' && navigation.location.pathname === '/checkout/confirm' ? '-translate-x-full' : 'translate-x-0')}>
      <div className="relative">
        <Link to='/products' className="border-2 border-white/50 w-max flex items-center gap-2 px-4 py-2 border-white/30 hover:bg-white hover:text-black"><CaretLeft /><span>products</span></Link>
        <Link state={{ noAnimate: true }} to='/'><img src='/logo.svg' alt='logo' className="w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></Link>
      </div>

      <div className="md:grid grid-cols-3 mt-8 flex-1 overflow-x-visible overflow-y-auto">
        <fetcher.Form method='post' className="md:col-span-2 pb-32 overflow-y-auto overflow-x-hidden">
          <div className="overflow-hidden mb-10">
            <motion.h1 initial={{ y: '100%' }} animate={{ y: 0 }} className="mt-8 text-5xl font-bold">checkout</motion.h1>
          </div>
          {info ? (
            <div>
              <h2 className="text-xl font-semibold mb-6">Saved data</h2>
              <Table>
                <TableBody>
                  {savedDataKeys.filter(r => typeof info[r] === 'string' && r !== 'payment_type' && r !== 'billing_address').map(r => (
                    <TableRow>
                      <TableCell className="font-medium">{r}</TableCell>
                      <TableCell className="normal-case">{info[r]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <button disabled={fetcher.state !== 'idle'} type='button' onClick={removeSavedData} className="mt-4 hover:bg-red-400 px-4 py-2 bg-white text-black disabled:opacity-50 flex items-center gap-2 group">
                <span className="translate-x-3 transition-transform duration-300 group-hover:translate-x-0">{fetcher.state !== 'idle' ? 'Removing saved data...' : 'Remove saved data'}</span>{' '}
                <X className="group-hover:opacity-100 transition-opacity duration-300 opacity-0" />
              </button>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-xl font-semibold mb-6">contact</h2>
                <div className="max-w-lg flex md:items-center justify-between gap-2 flex-col md:flex-row">
                  <div className="flex flex-col">
                    <p className="mb-2">Email address</p>
                    <input required name='email' type="email" className="px-4 py-2 rounded-none border-white text-white bg-black" placeholder='Your email address' />
                  </div>
                  <div className="flex flex-col">
                    <p className="mb-2">Phone number</p>
                    <input value={phone} onChange={e => setPhone(e.target.value.match(/\d/g)?.join('') || '')} name='phone' type="text" required className="px-4 py-2 rounded-none border-white text-white bg-black" placeholder='Your phone number' />
                  </div>
                </div>
                <label className="flex items-center gap-2 normal-case mt-4">
                  <input name='remember_me' type="checkbox" className="accent-black" />
                  <p>Remember me</p>
                </label>
              </div>
              <div className="w-full h-1 bg-white -translate-x-8 my-8" />
              <div className="max-w-lg space-y-4">
                <h2 className="text-xl font-semibold mb-6">Delivery address</h2>
                <div className="flex sm:items-center justify-between gap-4 flex-col sm:flex-row">
                  <div className="flex flex-col">
                    <p className="mb-2">First name</p>
                    <input required name='first_name' type="text" className="px-4 py-2 rounded-none border-white text-white bg-black" placeholder='Your first name' />
                  </div>
                  <div className="flex flex-col">
                    <p className="mb-2">Last name</p>
                    <input required name='last_name' type="text" className="px-4 py-2 rounded-none border-white text-white bg-black" placeholder='Your last name' />
                  </div>
                </div>
                <div className="flex-col flex">
                  <p className="mb-2">Country</p>
                  <select required name="country" id="country" className="px-4 py-2 rounded-none border-white text-white bg-black" value={country} onChange={e => setCountry(e.target.value)}>
                    {countries.map((r, i) => (
                      <option disabled={country === r.code} key={i} value={r.code}>{r.name}</option>
                    ))}
                  </select>
                  <input type="hidden" name="country" value={country} />
                </div>
                <div className="flex-col flex">
                  <p className="mb-2">Address</p>
                  <input required name='address_line_1' type="text" className="px-4 py-2 rounded-none border-white text-white bg-black" placeholder='Your address line 1' />
                  <input name='address_line_2' type="text" className="px-4 py-2 rounded-none border-t-0 border-white text-white bg-black" placeholder='Your address line 2 (optional)' />
                </div>
                <div className="flex sm:items-center justify-between gap-4 flex-col sm:flex-row">
                  <div className="flex flex-col">
                    <p className="mb-2">City</p>
                    <input required name='city' type="text" className="px-4 py-2 rounded-none border-white text-white bg-black" placeholder='Your city' />
                  </div>
                  <div className="flex flex-col">
                    <p className="mb-2">Province</p>
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
                </div>
              </div>
            </>
          )
          }
          <div className="w-full h-1 bg-white -translate-x-8 my-8" />
          <div className="max-w-lg space-y-4">
            <h2 className="text-xl font-semibold mb-6">Payment</h2>
            <div className="flex flex-col">
              {['Cash on Delivery', 'Credit / Debit Card'].map((r, i) => {
                const Icon = [Truck, Cards][i]
                return (
                  <button type='button' onClick={() => setPayment(i)} key={i} className={classNames('transition-all duration-300 w-full last:border-t-0 h-16 border-white flex items-center justify-center gap-2', payment === i ? 'bg-white text-black' : 'bg-black text-white')}>
                    <motion.div animate={{ x: payment === i ? 8 : 0 }}>
                      <Icon className='w-8' weight='fill' />
                    </motion.div>
                    <motion.span animate={{ x: payment === i ? 0 : 8 }}>{r}</motion.span>
                    <motion.div animate={{ opacity: payment === i ? 1 : 0, x: payment === i ? 0 : -8 }}><Check /></motion.div>
                  </button>
                )
              })}
              <input type="hidden" name='payment_type' value={payment} />
            </div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: payment === Payment.COD ? 1 : 0, y: payment === Payment.COD ? 0 : -16 }}>
              <p className="mb-2 mt-4">Billing address</p>
              <div className="flex flex-col">
                {['Bill to same shipping address', 'Bill to a different address'].map((r, i) => (
                  <button type='button' onClick={() => setBillTo(i)} key={i} className={classNames('px-4 transition-all duration-300 w-full last:border-t-0 h-16 border-white flex items-center justify-center gap-2', billTo === i ? 'bg-white text-black' : 'bg-black text-white')}>
                    <motion.span animate={{ x: billTo === i ? 0 : 8 }}>{r}</motion.span>
                    <motion.div animate={{ opacity: billTo === i ? 1 : 0, x: billTo === i ? 0 : -8 }}><Check /></motion.div>
                  </button>
                ))}
              </div>
            </motion.div>

            <motion.textarea
              required={billTo === BillTo.DifferentAddress && payment === Payment.COD}
              animate={{ opacity: billTo === BillTo.DifferentAddress && payment === Payment.COD ? 1 : 0, y: billTo === BillTo.DifferentAddress && payment === Payment.COD ? 0 : -16 }}
              name="billing_address" id="billing_address" rows={6}
              className={classNames('w-full bg-black rounded-none text-white p-2', billTo === BillTo.DifferentAddress && payment === Payment.COD ? '' : 'absolute')}
              placeholder="Type billing address here..."
              defaultValue={info?.billing_address || ''}
            />

            <CartDisplay shippingFee={shippingFee} subtotal={subtotal} className="block md:hidden" cart={cart} />

            <button type='submit' className={classNames('!mt-16 group hover:bg-white relative hover:text-black transition-all duration-300 text-xl font-semibold text-white border-2 border-white w-full px-4 py-8 flex items-center gap-2 justify-center', fetcher.state !== 'idle' ? 'opacity-50 pointer-events-none' : '')}>
              {fetcher.state !== 'idle' ? (
                <>
                  <motion.span initial={{ x: -30 }} animate={{ x: 30 }} transition={{ repeatType: 'reverse', repeatDelay: 1, duration: 1, repeat: Infinity }} className="translate-x-6">submitting...</motion.span>
                  <div className="absolute top-1/2 right-8 -translate-y-1/2">
                    <Spinner className="animate-spin text-4xl" />
                  </div>
                </>
              ) : (
                <>

                  <span className="translate-x-6 group-hover:translate-x-0 transition-transform duration-300">submit</span>
                  <ArrowRight className="opacity-0 group-hover:opacity-100 -translate-x-6 group-hover:translate-x-0 transition-transform duration-300" />
                </>
              )}
            </button>
          </div>
        </fetcher.Form >
        <CartDisplay shippingFee={shippingFee} subtotal={subtotal} className="hidden md:block" cart={cart} />
      </div>
    </div>
  )
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData()

  const action = formData.get('action')
  if (action) {
    if (action === 'remove_saved_data') {
      return json({ error: null }, {
        headers: {
          'set-cookie': await checkoutInfoCookie.serialize(null),
        }
      })
    }
  }

  const info = await getSavedCheckoutInfo(request)
  const body = await schema.parseAsync(Object.fromEntries([...Object.entries(info || {}), ...formData.entries()]))

  const cart = await getCart(request)
  const cartSizeInstances = await Promise.all(cart.map(r => prisma.productSize.findFirst({ where: { ...r.size, productId: r.id } })))

  if (cartSizeInstances.includes(null)) throw new Error("Cart item contains invalid size: " + JSON.stringify(cart))

  const shippingFee = Number(await redis.get('shipping_fee') || '150')
  const subtotal = cart.map(r => r.quantity * r.price).reduce((a, c) => a + c, 0)
  const total = subtotal + shippingFee

  const order = await prisma.order.create({
    data: {
      firstName: body.first_name,
      lastName: body.last_name,
      total,
      subtotal,
      shippingFee,
      city: body.city,
      email: body.email,
      phone: body.phone,
      address: `${body.address_line_1} | ${body.address_line_2}`,
      country: body.country,
      province: body.province,
      payment: body.payment_type === '0' ? 'CashOnDelivery' : 'Card',
      products: {
        create: cart.map((r, i) => ({
          title: r.title,
          price: r.price,
          quantity: r.quantity,
          productId: r.id,
          sizeId: cartSizeInstances[i]?.id!
        }))
      },
      billingAddress: body.billing_address,
    },
    select: {
      id: true
    }
  })

  return redirect('/checkout/confirm', {
    headers: [
      ['set-cookie', await cartCookie.serialize({})],
      ['set-cookie', await checkoutInfoCookie.serialize(body.remember_me ? body : null)],
      ['set-cookie', await addOrder(order.id, request)]
    ]
  })
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Checkout | ZED' },
  ]
}


enum BillTo {
  SameAddress,
  DifferentAddress
}
enum Payment {
  COD,
  Card
}

export const schema = z.object({
  email: z.string(),
  phone: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  address_line_1: z.string(),
  address_line_2: z.optional(z.string()),
  city: z.string(),
  payment_type: z.string(),
  billing_address: z.optional(z.string()).transform(r => !r ? null : r),
  remember_me: z.optional(z.union([z.string(), z.boolean()])).transform(r => typeof r === 'boolean' ? r : r === 'on'),
  country: z.string(),
  province: z.string()
})

