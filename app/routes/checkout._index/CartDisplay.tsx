import { X } from "@phosphor-icons/react";
import { Link } from "@remix-run/react";
import classNames from "classnames";
import { getCart } from "~/utils/cart.server";
import { formatCurrency } from "~/utils/data";

export default function CardDisplay({ shippingFee, subtotal, ...props }: {
  className: string
  cart: Awaited<ReturnType<typeof getCart>>
  shippingFee: number
  subtotal: number
}) {
  return (
    <div className={classNames('overflow-y-auto space-y-4 relative', props.className)}>
      {props.cart.map(r => (
        <div key={r.id} className="flex items-center gap-2">
          <img src={`/products/image/${r.images[0].id}`} alt={r.title} className="w-20" />
          <div className="w-full">
            <div className="flex items-start gap-2">
              <div className="">
                <Link target='_blank' to={`/products/${r.id}`} className="flex items-center gap-1 text-lg font-medium normal-case hover:underline">
                  <span>{r.title}</span>{' '}
                  <X />
                  <span>{r.quantity}</span>{' '}
                </Link>
                <p className="!uppercase">{r.size.name} <span className="text-sm">size</span></p>
              </div>
            </div>
            <p className="text-right m-0 ml-auto text-lg"><span className="text-sm">Rs.</span>{' '}{formatCurrency(r.price)}</p>
          </div>
        </div>
      ))}
      <div className="divide-y-2 border-white sticky backdrop-blur-lg bottom-0 left-0 w-full [&>div]:pl-2 [&>div>p]:!capitalize">
        <div className="flex items-center justify-between bg-bg-main">
          <p>subtotal</p>
          <p className='normal-case'>Rs. {formatCurrency(subtotal)}</p>
        </div>
        <div className="flex items-center justify-between bg-bg-main">
          <p>shipping</p>
          <p className='normal-case'>Rs. {formatCurrency(shippingFee)}</p>
        </div>
        <div className="flex items-center justify-between text-2xl font-semibold pt-2 bg-bg-main">
          <p>Total</p>
          <p className='normal-case'>Rs. {formatCurrency(subtotal + shippingFee)}</p>
        </div>
      </div>
    </div>
  )
}
