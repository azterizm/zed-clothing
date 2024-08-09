import { useNavigate } from "@remix-run/react";
import classNames from "classnames";
import { motion } from "framer-motion";
import { formatCurrency } from "../utils/data";

export default function ProductListing(props: {
  id: string
  imageId: string
  title: string
  price: number
  disableScale?: boolean
  onClick?: () => void
  imageClass?: string
  quantity?: number
  labelClass?: string
  priceClass?: string
  containerClass?: string
  imgPaddingTop?: number
}) {
  const navigate = useNavigate()
  return (
    <motion.div
      onClick={() => (props.onClick ? props.onClick() : null, navigate(`/products/${props.id}`))}
      whileHover={{ scale: props.disableScale ? 1 : 1.05 }}
      className={classNames('flex flex-col items-start w-56 snap-center relative group', props.containerClass)}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 32, opacity: 0 }}
      initial={{ y: 0, opacity: 0 }}
      key={props.id}
    >
      {props.imgPaddingTop ? (
        <div className="w-full h-0 relative" style={{ paddingTop: props.imgPaddingTop + '%' }}>
          <img
            src={`/products/image/${props.imageId}`}
            loading='lazy'
            alt=''
            className={classNames('absolute top-0 left-0 w-full min-w-[14rem] h-full object-cover group-hover:brightness-50', props.imageClass)}
          />
        </div>
      ) : (
        <img
          src={`/products/image/${props.imageId}`}
          loading='lazy'
          alt=''
          className={classNames('w-full min-w-[14rem] aspect-[10/16] object-contain group-hover:brightness-50', props.imageClass)}
        />
      )}
      <p className={classNames('flex items-center gap-1 font-semibold mt-2', props.labelClass)}>
        {props.title}
        {props.quantity ? ` × ${props.quantity}` : null}
      </p>
      <p className={classNames('text-white group-hover:opacity-100 opacity-0 transition-opacity duration-300 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none font-bold text-5xl', props.priceClass)} style={{ top: '40%' }}><span className="normal-case text-xs">Rs.</span><br /><span>{formatCurrency(props.price)}</span></p>
    </motion.div >
  )
}
