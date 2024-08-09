import { ArrowRight, CaretLeft, X } from "@phosphor-icons/react"
import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { json, Link, useLoaderData, useNavigation } from "@remix-run/react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import Cart from "~/components/Cart"
import ProductListing from "~/components/ProductListing"
import { months } from "~/constants/date"
import { messageCookie } from "~/cookies.server"
import { prisma } from "~/db.server"
import { getCart } from "~/utils/cart.server"
import { formatCurrency } from "~/utils/data"
import { getSavedOrders } from "~/utils/order.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const cart = await getCart(request)
  const ordersId = await getSavedOrders(request)
  const cookie = request.headers.get('cookie')
  const message: string | null = await messageCookie.parse(cookie)

  const orders = await prisma.order.findMany({
    where: { id: { in: ordersId } },
    select: {
      id: true,
      products: {
        select: {
          id: true,
          size: { select: { chest: true, length: true } },
          title: true,
          price: true,
          productId: true,
          quantity: true,
          product: { select: { images: { select: { id: true }, take: 1, orderBy: { createdAt: 'desc' } } } }
        }
      },
      createdAt: true,
      total: true,
    },
    orderBy: { createdAt: 'desc' }
  })

  const newOrders = message?.startsWith('add_order') ? Number(message.split(':').pop()) : 0

  return json({ cart, orders, newOrders }, {
    headers: {
      'set-cookie': await messageCookie.serialize('')
    }
  })
}

export default function Orders() {
  const data = useLoaderData<typeof loader>()
  const [hideNewOrdersDialog, setHideNewOrdersDialog] = useState(false)

  const navigation = useNavigation()

  useEffect(() => {
    let timeout: NodeJS.Timeout | null = null
    if (data.newOrders) {
      timeout = setTimeout(() => {
        setHideNewOrdersDialog(true)
      }, 8000)
    }

    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [])

  return (
    <motion.div initial={{ height: 0 }} animate={{ height: navigation.state !== 'idle' ? 0 : '100vh' }} className="overflow-hidden">
      <div className="h-screen p-8 overflow-y-auto overflow-x-hidden">
        <div className="relative">
          <Link to='/products' className="border-2 border-white/50 w-max flex items-center gap-2 px-4 py-2 border-white/30 hover:bg-white hover:text-black"><CaretLeft /><span>products</span></Link>
          <Link state={{ noAnimate: true }} to='/'><img src='/logo.svg' alt='logo' className="hidden sm:block w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></Link>
        </div>
        <div className="mb-10 mt-8">
          <div className="flex items-center gap-4 sm:gap-2 justify-between flex-col sm:flex-row">
            <motion.h1 className="text-5xl font-bold">orders</motion.h1>
            <div className="flex items-center gap-3 normal-case">
              <p>Can't find your order?</p>
              <Link to='/add_order' className="uppercase bg-white text-black px-4 py-2">add order</Link>
            </div>
          </div>
          {data.orders.length ? (
            <div className="flex flex-col mt-8">
              <div className="-m-1.5 overflow-x-auto">
                <div className="p-1.5 min-w-full inline-block align-middle">
                  <div className="overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-start text-xs font-medium uppercase"
                          >

                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-start text-xs font-medium uppercase"
                          >
                            Ordered At
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-start text-xs font-medium uppercase"
                          >
                            Products
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-start text-xs font-medium uppercase"
                          >
                            Total Amount
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-end text-xs font-medium uppercase"
                          >

                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {data.orders.map((r, i) => {
                          const date = new Date(r.createdAt)
                          const month = months[date.getMonth()]
                          return (
                            <tr key={i}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm ">
                                {i + 1}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium ">
                                {month}{' '}{date.getDate()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center flex-wrap gap-4">
                                {r.products.map(r => (
                                  <ProductListing key={r.id} containerClass="!w-min" priceClass="" labelClass="text-pretty" quantity={r.quantity} imageClass="!min-w-36" title={r.title} id={r.productId} price={r.price} imageId={r.product.images[0].id} disableScale />
                                ))}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm normal-case">
                                Rs. {formatCurrency(r.total)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-end text-sm font-medium">
                                <Link to={r.id}
                                  type="button"
                                  className="inline-flex group items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent text-white hover:text-white disabled:opacity-50 disabled:pointer-events-none"
                                >
                                  <span className="translate-x-4 group-hover:translate-x-0 transition-transform duration-300">See details</span>
                                  <ArrowRight className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </Link>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="font-medium mt-16 text-left font-bold">No orders were found.</p>
          )}

        </div>
      </div>
      <Cart hideOrders items={data.cart} />

      <motion.div exit={{ width: 0, opacity: 0 }} initial={{ width: 0, opacity: 0 }} animate={{ width: data.newOrders && !hideNewOrdersDialog ? 'auto' : 0, opacity: data.newOrders && !hideNewOrdersDialog ? 1 : 0 }} className="absolute bottom-4 right-4 flex items-center gap-2 border-2 border-white pl-2 text-xl normal-case font-medium whitespace-nowrap overflow-hidden">
        <p>{data.newOrders} new order{data.newOrders > 1 ? 's were' : ' was'} added.</p>
        <button onClick={() => setHideNewOrdersDialog(true)} className="bg-white text-black p-2"><X /></button>
      </motion.div>
    </motion.div >
  )
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Orders | ZED' },
  ]
}
