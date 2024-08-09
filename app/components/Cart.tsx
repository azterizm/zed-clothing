import { X } from "@phosphor-icons/react";
import { useFetcher, useLocation, useNavigate } from "@remix-run/react";
import classNames from "classnames";
import { motion } from "framer-motion";
import { serialize } from "object-to-formdata";
import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { ClientOnly } from "remix-utils/client-only";
import { useWindowSize } from "usehooks-ts";
import { getCart } from "~/utils/cart.server";
import { formatCurrency } from "~/utils/data";
import { isTouchDevice } from "~/utils/device.client";

export default function Cart(props: {
  items: Awaited<ReturnType<typeof getCart>>
  btnClass?: string
  openState?: [boolean, Dispatch<SetStateAction<boolean>>]
  hideOrders?: boolean
}) {
  const [open, setOpen] = props.openState || useState(false)
  const [why, setWhy] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  const location = useLocation()
  const fetcher = useFetcher()
  const navigate = useNavigate()
  const { height } = useWindowSize()

  useEffect(() => {
    function handle(e: MouseEvent) {
      const x = Number(containerRef.current?.style.getPropertyValue('transform')?.match(/\d/g)?.join('') || '0')

      const target = e.target as HTMLElement
      if (
        target.innerHTML.includes('cart') ||
        target.innerHTML.includes('Cart') ||
        target === btnRef.current ||
        x > 0 ||
        !target ||
        target === containerRef.current ||
        target && containerRef.current?.contains(target as Node)
      ) return

      setOpen(false)
    }

    window.addEventListener('click', handle)
    return () => {
      window.removeEventListener('click', handle)
    }
  }, [])

  useEffect(() => {
    if (why) {
      setTimeout(() => {
        setWhy(false)
      }, 5000)
    }
  }, [why])
  useEffect(() => {
    containerRef.current?.style.setProperty('height', `${height.toString()}px`)
  }, [height, open])

  function onRemove(id: string) {
    fetcher.submit(serialize({ id, action: 'remove' }), { action: '/api/cart/update', method: 'post' })
  }
  return (
    <>
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: location.pathname === '/' && !location.state?.noAnimate ? 4 : 0 }}
        ref={btnRef}
        onClick={() => setOpen(e => !e)}
        className={
          classNames(
            'text-sm font-bold absolute top-0 right-0 backdrop-blur-lg md:p-0 bg-black/30 md:bg-transparent md:top-8 md:right-8 underline z-20',
            props.btnClass,
            location.pathname === '/products' ? 'p-8' : 'px-4 py-2'
          )
        }
      >
        Cart
      </motion.button>
      {props.hideOrders ? null : (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: location.pathname === '/' && !location.state?.noAnimate ? 4 : 0 }}
          ref={btnRef}
          onClick={() => navigate('/orders')}
          className={
            classNames(
              'text-sm font-bold absolute top-0 backdrop-blur-lg p-8 md:p-0 bg-black/30 md:bg-transparent md:top-8 md:right-24 underline z-20',
              props.btnClass,
              location.pathname === '/products' ? 'p-8 right-[6.5rem]' : 'px-4 py-2 right-[4.5rem]'
            )
          }
        >
          Orders
        </motion.button>
      )}
      <ClientOnly>
        {() => (
          <div
            id='cart'
            style={{
              transform: `translateX(${open ? 0 : 100}%)`,
            }}
            ref={containerRef}
            className={classNames(
              'absolute z-20 top-0 right-0 w-full lg:w-3/4 md:max-w-[40rem] bg-black border-l-2 border-white transition-transform duration-300 text-white flex flex-col',
              isTouchDevice() && !open ? '!w-0 !h-0 overflow-hidden' : '',
            )}
          >
            <div className="flex items-center justify-between">
              <h1 className="pl-4 text-2xl font-bold">cart</h1>
              <button onClick={() => setOpen(false)} className="px-4 py-8 bg-white text-black flex items-center gap-2">
                <X /><span>close</span>
              </button>
            </div>
            {props.items.length ? (
              <div className="flex flex-col overflow-y-auto overflow-x-hidden flex-1">
                {props.items.map(r => (
                  <div key={r.id} className="flex items-end justify-between border-t-2 last:border-b-2 border-white">
                    <div className="flex items-start gap-2">
                      <img src={`/products/image/${r.images[0].id}`} alt={r.title} className="w-20" />
                      <div className="pl-4 pt-2">
                        <p className="flex items-center gap-1 text-lg font-medium normal-case">
                          <span>{r.title}</span>{' '}
                          <X />
                          <span>{r.quantity}</span>{' '}
                        </p>
                        <p>{r.size.name} <span className="text-sm">size</span></p>
                        <button
                          className="bg-white text-black px-4 py-2 text-xs inline-block mt-2"
                          onClick={() => onRemove(r.id)}
                          disabled={fetcher.state !== 'idle'}
                        >
                          remove
                        </button>
                      </div>
                    </div>
                    <div className="flex items-end gap-2 pr-4 pb-2">
                      <p className="text-2xl"><span className="text-sm">Rs.</span>{' '}{formatCurrency(r.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="flex-1 text-lg text-center my-8 text-md normal-case font-medium">No products are in the cart right now.</p>
            )}
            <button onClick={() => !props.items.length ? setWhy(true) : (setOpen(false), navigate('/checkout'))} className="border-t-2 border-white text-2xl font-bold py-8 hover:bg-white hover:text-black relative w-full bg-black text-white group">
              <span>{why ? 'bring something first...' : 'checkout'}</span>
              <div className="absolute top-0 right-0 flex items-center gap-2 pb-2 -translate-y-full group-hover:pb-0 transition-transform duration-300 group-hover:translate-y-0 group-hover:text-black z-10 pr-4">
                <span className="font-light">subtotal</span>
                <span><span className="text-sm">Rs.{' '}</span>{formatCurrency(props.items.map(r => r.price * r.quantity).reduce((a, c) => a + c, 0))}</span>
              </div>
            </button>
          </div>
        )}
      </ClientOnly>
    </>
  )
}
