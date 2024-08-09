import { CaretLeft } from "@phosphor-icons/react";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Link, useLoaderData, useNavigation } from "@remix-run/react";
import classNames from "classnames";
import { motion } from "framer-motion";
import ProductListing from "~/components/ProductListing";
import { prisma } from "~/db.server";
import { formatCurrency } from "~/utils/data";
import { camelCaseToTitleCase } from "~/utils/ui";

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  if (!id) throw new Error("No id")

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      createdAt: true,
      id: true,
      total: true,
      subtotal: true,
      city: true,
      email: true,
      phone: true,
      status: true,
      shippingFee: true,
      province: true,
      payment: true,
      country: true,
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
      billingAddress: true
    }
  })

  if (!order?.id) throw new Error("No order with this id.")

  if (order.billingAddress) order.billingAddress = '****'

  return json({ order })
}

export default function OrderDetails() {
  const data = useLoaderData<typeof loader>()
  const navigation = useNavigation()

  const keys = Object.keys(data.order) as Array<keyof typeof data.order>
  const omitKeys: Array<keyof typeof data.order> = ['country', 'city', 'createdAt', 'id']

  return (
    <motion.div initial={{ height: 0 }} animate={{ height: navigation.state !== 'idle' ? 0 : '100vh' }} className="overflow-hidden">
      <div className="h-screen p-8 overflow-y-auto">
        <div className="relative">
          <Link to='/orders' className="border-2 border-white/50 w-max flex items-center gap-2 px-4 py-2 border-white/30 hover:bg-white hover:text-black"><CaretLeft /><span>orders</span></Link>
          <Link state={{ noAnimate: true }} to='/'><img src='/logo.svg' alt='logo' className="w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></Link>
        </div>
        <div className="mb-10 mt-8">
          <motion.h1 className="text-5xl font-bold">order details</motion.h1>

          <div className="flex flex-col lg:flex-row">
            <div className="flex items-center flex-wrap gap-4 justify-center mt-16 flex-1">
              {data.order.products.map(r => (
                <ProductListing key={r.id} containerClass="!w-min" priceClass="" labelClass="text-pretty" quantity={r.quantity} imageClass="!min-w-[10rem]" title={r.title} id={r.productId} price={r.price} imageId={r.product.images[0].id} disableScale />
              ))}
            </div>
            <div className="flex flex-col mt-8 max-w-sm mx-auto">
              <div className="-m-1.5 overflow-x-hidden sticky top-0 left-0">
                <div className="p-1.5 min-w-full inline-block align-middle">
                  <div className="border rounded-none shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white normal-case">Ordered At</td>
                          <td className={classNames('px-6 py-4 whitespace-nowrap text-sm text-white normal-case')}>
                            {new Date(data.order.createdAt).toLocaleString()}
                          </td>
                        </tr>
                        {keys.filter(r => typeof data.order[r] === 'string' && !omitKeys.includes(r)).map((r, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white normal-case">
                              {camelCaseToTitleCase(r)}
                            </td>
                            <td className={classNames('text-pretty px-6 py-4 whitespace-nowrap text-sm text-white normal-case', r === 'status' ? data.order[r] === 'Pending' ? 'text-blue-300' : data.order[r] === 'Shipping' ? 'text-yellow-300' : 'text-purple-300' : r === 'payment' ? data.order[r] === 'CashOnDelivery' ? 'text-yellow-300' : 'text-blue-300' : 'text-white')}>
                              {r === 'payment' ? camelCaseToTitleCase(data.order[r]?.toString()) : data.order[r]?.toString()}
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white normal-case"> Address </td>
                          <td className={classNames('px-6 py-4 whitespace-nowrap text-sm text-white normal-case text-pretty')}>
                            {data.order.country} {data.order.city} ****
                          </td>
                        </tr>
                        {keys.filter(r => typeof data.order[r] === 'number').reverse().map((r, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white normal-case">{camelCaseToTitleCase(r)}</td>
                            <td className={classNames('px-6 py-4 whitespace-nowrap text-sm text-white normal-case')}>
                              Rs. {formatCurrency(data.order[r] as number)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>





        </div>
      </div>
    </motion.div>
  )
}
