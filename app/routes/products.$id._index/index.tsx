import { CaretLeft, CaretRight, Check, ShoppingBag, ShoppingCart, Star, X } from "@phosphor-icons/react";
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction, NodeOnDiskFile, unstable_parseMultipartFormData } from '@remix-run/node';
import { Link, useFetcher, useLoaderData, useLocation, useNavigate, useNavigation } from "@remix-run/react";
import classNames from "classnames";
import { animate, motion } from "framer-motion";
import { serialize } from 'object-to-formdata';
import { useEffect, useRef, useState } from "react";
import { getClientIPAddress } from 'remix-utils/get-client-ip-address';
import { useWindowSize } from "usehooks-ts";
import { z } from "zod";
import Cart from "~/components/Cart";
import { fileHandler } from "~/config/file";
import { prisma } from "~/db.server";
import '~/styles/product.css';
import { cachedResponse } from "~/utils/cache.server";
import { getCart } from "~/utils/cart.server";
import { addReview, getSavedReviews, removeReview } from "~/utils/review.server";
import ProductListing from '../../components/ProductListing';
import { imageEndpoint } from '../../utils/api';
import { randomInt } from "../../utils/data";
import Review from "./Review";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const id = params.id

  const product = await cachedResponse(`product:${id}`,
    prisma.product.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        words: true,
        images: { select: { id: true } },
        price: true,
        sizes: { select: { id: true, name: true, chest: true, length: true } },
        description: true,
        category: { select: { id: true, name: true } },
        prominentColors: true,
        averageColor: true,
        reviews: {
          select: {
            name: true,
            message: true,
            rating: true,
            id: true
          }
        }
      },
    })
  )

  if (!product) throw new Error("No product for this id.")

  const categoryId = product.category[0].id
  const total = await cachedResponse(`product_category_count:${categoryId}`, prisma.product.count({ where: { category: { some: { id: categoryId } } } }))

  let skip = randomInt(0, total)
  if ((skip + 10) > total) skip = Math.max(0, skip - 10)

  const similar = await cachedResponse(
    `product_similar:${product.category[0].id}:${product.id}`,
    prisma.product.findMany({
      where: { category: { some: { id: categoryId } }, id: { not: product.id } },
      select: {
        id: true,
        title: true,
        price: true,
        images: { select: { id: true }, take: 1, orderBy: { createdAt: 'desc' } },
      },
      take: 10,
      skip,
    })
  )

  const cart = await getCart(request)
  const inCart = Boolean(cart.find(r => r.id === product.id))

  const isWaist = product.category.map(r => r.name).some(r => r === 'pants' || 'shorts')

  const userReviewsId = await getSavedReviews(request)

  return json({ product, similar, cart, inCart, isWaist, userReviewsId })
}

export default function Product() {
  const { userReviewsId, inCart, product, similar, cart, isWaist } = useLoaderData<typeof loader>()

  const [cartOpen, setCartOpen] = useState(false)
  const [size, setSize] = useState<string>('medium')
  const [showSize, setShowSize] = useState<boolean>(false)
  const [quantity, setQuantity] = useState(1)
  const [chest, setChest] = useState(product.sizes.find(r => r.name === 'medium')?.chest || 0)
  const [length, setLength] = useState(product.sizes.find(r => r.name === 'medium')?.length || 0)
  const [hide, setHide] = useState(false)
  const [showReview, setShowReview] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null)
  const priceRef = useRef<HTMLSpanElement>(null)
  const location = useLocation()
  const navigation = useNavigation()
  const navigate = useNavigate()
  const fetcher = useFetcher()
  const { height } = useWindowSize()

  const words = product?.words.split(',') || []
  const colors = product.prominentColors.split(':')


  useEffect(() => {
    setHide(true)
    const timeout = setTimeout(() => {
      setHide(false)
    }, 250)
    return () => {
      clearTimeout(timeout)
    }
  }, [location])

  useEffect(() => {
    if (containerRef.current) containerRef.current.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    const controls = animate(0, product.price, {
      duration: 1,
      onUpdate: (v) => {
        const value = v.toFixed(0)
        if (priceRef.current)
          priceRef.current.textContent = value.length > 3 ?
            value[0] + ',' + value.slice(1) :
            value
      }
    })

    return () => {
      controls.stop()
    }
  }, [location])

  function purchase(type = 'cart') {
    if (type === 'cart' && inCart) {
      return setCartOpen(true)
    }
    fetcher.submit(
      serialize({
        id: product.id,
        action: 'add',
        quantity,
        size,
        checkout: type === 'buy',
        chest,
        length
      }),
      { action: '/api/cart/update', method: 'post' }
    )
  }

  function handleRemoveReview(id: string) {
    fetcher.submit(serialize({ id, action: 'delete_review' }), { method: 'post' })
  }

  return (
    <>
      <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-lg animate-pulse !uppercase">loading...</p>
      <motion.div
        className="relative overflow-hidden"
        initial={{
          height: 0,
          filter: 'blur(0px)',
        }}
        transition={{ delay: navigation.location?.pathname.startsWith('/products') ? 0 : 0.25 }}
        animate={{
          height: navigation.state === 'idle' && colors.length ? height : 0,
          opacity: hide ? 0 : 1
        }}
        style={{ color: product.averageColor }}
      >
        <div ref={containerRef} className="p-8 pt-24 h-screen overflow-x-hidden overflow-y-auto">
          <button style={{ borderColor: product.averageColor }} onClick={() => navigate('/products')} className="flex items-center gap-2 font-bold text-sm border-2 rounded-full p-2 hover:bg-white hover:text-black transition-all duration-300 absolute top-7 left-20 md:sticky md:top-0 md:left-0 z-10 md:mb-16">
            <CaretLeft weight='fill' />
            <span>go back</span>
          </button>
          {product.images.map((r, i) => (
            <div key={r.id} className={classNames('flex-col mb-16 relative flex items-center justify-around', i === 0 || i % 3 === 0 ? 'md:flex-row' : i % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-col')}>
              <motion.div
                className="relative w-full md:w-[40vw] h-full md:h-0 md:pt-[62%] hover:scale-110 transition-transform duration-300"
                initial={{ x: i % 2 === 0 ? '50%' : '-50%' }}
                whileInView={{ x: 0 }}
                viewport={{ once: true, amount: 0.25 }}
              >
                <img
                  loading='lazy'
                  src={imageEndpoint(product?.images?.[i]?.id)}
                  alt=""
                  className="md:absolute top-0 left-0 w-full md:w-[40vw] h-full object-cover"
                />
              </motion.div>
              <motion.p
                initial={{ x: i % 2 === 0 ? '-50%' : '50%' }}
                whileInView={{ x: 0 }}
                viewport={{ once: true, amount: 0.1 }}
                transition={{ delay: 0.5 }}
                className={classNames('px-4 drop-shadow-5xl text-md max-w-xs md:max-w-full mt-2 md:mt-0 text-center md:text-left md:text-3xl font-black', i % 2 === 0 ? '' : 'mt-2 md:mt-8')}
              >
                {words[i % words.length]}
              </motion.p>
            </div>
          ))}
          <p className='text-sm mx-auto text-left mt-[20rem] max-w-sm normal-case'>
            {product.description}
          </p>

          <div className="text-center text-5xl mt-36 font-bold">
            <p className='mb-8'>what they said.</p>
            {product.reviews.length ? product.reviews.map((r, i) => (
              <div key={i} className={classNames('gap-4 lg:gap-0 pt-4 pb-6 lg:pt-0 lg:pb-0 lg:py-4 lg:justify-items-center items-center grid lg:grid-cols-3 text-sm before:absolute relative before:bg-white before:top-0 before:-left-8 after:absolute after:w-screen after:h-0.5 after:bg-white after:bottom-0 after:-left-8', i === 0 ? 'before:w-screen before:h-0.5' : '')}>
                <div className='flex items-center gap-4'>
                  <img loading='lazy' src={`/reviews/image/${r.id}`} alt='' className='w-8 h-8 rounded-full object-contain' />
                  <p>{r.name}</p>
                  {userReviewsId.includes(r.id) ? (
                    <button disabled={fetcher.state !== 'idle'} onClick={() => handleRemoveReview(r.id)} className="disabled:opacity-50 bg-red-600 text-white p-2 rounded-full"><X /></button>
                  ) : null}
                </div>
                <p className='lg:py-4 normal-case text-start lg:text-center font-normal'>{r.message}</p>
                <div className="flex items-center">
                  {new Array(10).fill(null).map((_, i) => (
                    <Star key={i} weight={r.rating < (i + 1) ? 'regular' : 'fill'} />
                  ))}
                </div>
              </div>
            )) : (
              <div className="border-y-2 border-white w-screen -translate-x-8 py-4 opacity-50">
                <p className="text-sm">No reviews yet.</p>
              </div>
            )}
            <button onClick={() => setShowReview(e => !e)} className={classNames('hover:bg-black transition-all w-screen hover:text-white -translate-x-8 block duration-300 cursor-pointer py-4 flex items-center justify-center relative before:bg-white before:top-0 before:-left-8 after:absolute after:w-screen after:h-0.5 after:bg-white after:bottom-0 after:left-0')}>
              <motion.h1 key="review-heading" className="text-2xl">post your review now</motion.h1>
            </button>
          </div>

          <div className="mt-24 mb-36">
            <h1 className="font-bold text-5xl">other options...</h1>
            <div className="flex items-start gap-4 mt-8 snap-x snap-mandatory overflow-x-auto">
              {similar.map(r => <ProductListing onClick={() => setHide(true)} key={r.id} price={r.price} title={r.title} id={r.id} imageId={r.images?.[0]?.id} disableScale />)}
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-screen" style={{ color: product.averageColor }}>
          <div className="flex items-center justify-between w-full px-4 pb-2">
            <h1 className='text-md md:text-3xl font-semibold normal-case'>{product.title}</h1>
            <p className='font-medium text-lg md:text-5xl normal-case'><span className='text-sm'>Rs.</span>{' '}<span ref={priceRef}>0</span></p>
          </div>
          <div className="grid-cols-2 grid md:flex items-center justify-between border-t-2 border-white [&>button]:py-2 md:[&>button]:py-4 [&>button]:px-4 font-bold text-sm md:text-md">
            <button onClick={() => setShowSize(e => !e)} className={classNames('hover:bg-white hover:text-black transtiion-all duration-300 border-r-2 border-white flex-1 backdrop-blur-lg flex items-center gap-2 justify-center', showSize ? 'bg-red-600' : 'bg-black/30')}>
              {showSize ? (
                <><span>Close</span> <X /></>
              ) : (
                <>Size: {size[0]}</>
              )}</button>
            <div className='bg-black/30 md:border-r-2 border-white flex-1 backdrop-blur-lg justify-between flex items-center px-4 gap-4 group'>
              <button onClick={() => setQuantity(e => Math.max(1, e - 1))} className='group-hover:opacity-100 opacity-100 md:opacity-0 transition-opacity duration-300 text-xl py-2 md:py-4 rounded-full md:bg-white text-black p-1 flex-1'><CaretLeft className='mx-auto' /></button>
              <span>Q: {quantity}</span>
              <button onClick={() => setQuantity(e => Math.min(50, e + 1))} className='group-hover:opacity-100 opacity-100 md:opacity-0 transition-opacity duration-300 text-xl flex-1 w-full md:bg-white text-black rounded-full p-1 md:py-4 py-2'><CaretRight className='mx-auto' /></button>
            </div>
            <motion.button onClick={() => purchase('cart')} initial='initial' animate='initial' whileHover='animate' className='border-r-2 border-white flex-1 bg-black/30 backdrop-blur-lg flex items-center gap-2 justify-center relative group'>
              <motion.p className='block' variants={{ animate: { x: -8 }, initial: { x: 0 } }}>{inCart ? 'added to' : fetcher.state !== 'idle' ? 'adding' : 'add'} to <motion.span variants={{ initial: { textDecoration: 'auto' }, animate: { textDecoration: 'underline' } }}>cart</motion.span></motion.p>
              {inCart ? (
                <Check className='absolute text-xl translate-x-24 group-hover:opacity-100 opacity-0 duration-300 transition-opacity' weight='fill' />
              ) : (
                <ShoppingCart className='absolute text-xl translate-x-20 group-hover:opacity-100 opacity-0 duration-300 transition-opacity' weight='fill' />
              )}
            </motion.button>
            <motion.button onClick={() => purchase('buy')} initial='initial' animate='initial' whileHover='animate' className='bg-black/30 backdrop-blur-lg flex items-center gap-2 justify-center relative group min-w-[10rem]'>
              <motion.p className='block' variants={{ animate: { x: -8 }, initial: { x: 0 } }}>buy now</motion.p>
              <ShoppingBag className='absolute text-xl translate-x-14 group-hover:opacity-100 opacity-0 duration-300 transition-opacity' weight='fill' />
            </motion.button>
          </div>
        </div>

        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: showSize ? 'auto' : 0, opacity: showSize ? 1 : 0 }} className={classNames('overflow-hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white border-2 border-white min-w-[50vw]', showSize ? '' : 'pointer-events-none')}>
          <div className="flex items-center justify-between border-b-2 border-white">
            <h1 className='pl-4 text-3xl font-bold'>Size</h1>
            <button onClick={() => setShowSize(false)} className="flex items-center gap-2 bg-white text-black py-4 px-4">
              <span>Close</span>
              <X />
            </button>
          </div>

          {product.sizes.sort((a, c) => c.chest > a.chest ? -1 : 1).map(r => (
            <button key={r.id} onClick={() => (setSize(r.name), setChest(r.chest), setLength(r.length))} className={classNames('py-4 flex items-center justify-between w-full px-4', size === r.name ? 'bg-white text-black' : 'hover:bg-white/50')} >
              <span className='font-semibold'>{r.name}</span>
              <div className="flex items-center gap-2 justify-between">
                <span>{isWaist ? 'Waist' : 'Chest'}: {r.chest}</span>
                <span className='-translate-y-0.5'>|</span>
                <span>Length: {r.length}</span>
              </div>
            </button>
          ))}

          <button onClick={() => setSize('custom')} className={classNames('cursor-pointer py-4 flex items-center justify-between w-full px-4', size === 'custom' ? 'bg-white text-black' : 'hover:bg-white/50')}>
            <span className='font-semibold'>Custom</span>
            <div className="flex items-center gap-2 justify-between">
              <span>Chest:<input value={size === 'custom' ? chest.toString() : 0} onChange={e => setChest(Number(e.target.value))} className='text-black ml-2 text-center rounded-full border-2 border-black' type="number" min={1} max={100} /></span>
              <span className='-translate-y-0.5'>|</span>
              <span>Length:<input value={size !== 'custom' ? 0 : length.toString()} onChange={e => setLength(Number(e.target.value))} className='text-black text-center ml-2 rounded-full border-2 border-black' type="number" min={1} max={100} /></span>
            </div>
          </button>
        </motion.div>

        <Review show={showReview} onClose={() => setShowReview(false)} />

        <Cart openState={[cartOpen, setCartOpen]} items={cart} />

        <Link to='/' state={{ noAnimate: true }} className="absolute top-8 left-8">
          <img loading='lazy' src="/logo.svg" alt="logo" className="w-8" />
        </Link>

        <div className="-z-10 pointer-events-none absolute top-0 left-0 w-screen h-screen flex items-center justify-center" style={{ backgroundColor: colors[1] }}>
          <div
            id='bg-blob'
            className="w-[50vmax] h-[50vmax] rounded-full" style={{ backgroundColor: colors[0] }}
          />
        </div>
      </motion.div>
    </>
  )
}

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formData = await request.clone().formData()
  const body = Object.fromEntries([...formData.entries()])
  const productId = params.id

  if (body.action === 'add_review') {
    if (!productId) return json({ error: "Something went wrong: No product Id." })
    const data = reviewSchema.safeParse(body)
    if (!data.success) return json({ error: data.error.toString() })
    const fileForm = await unstable_parseMultipartFormData(request.clone(), fileHandler)
    const image = fileForm.get('image') as unknown as NodeOnDiskFile
    const ip = process.env.NODE_ENV === 'production' ? getClientIPAddress(request) : 'localhost'
    const review = await prisma.review.create({
      data: {
        ...data.data,
        image: !image ? undefined : {
          create: {
            fileName: image.name,
            fileType: image.type,
            fileSize: image.size
          }
        },
        ip,
        productId
      },
      select: { id: true }
    })
    return json({ error: null }, {
      headers: {
        'set-cookie': await addReview(review.id, request)
      }
    })
  }

  if (body.action === 'delete_review') {
    const reviewId = body.id
    if (typeof reviewId !== 'string') return json({ error: "No review id." })
    const reviews = await getSavedReviews(request)
    if (!reviews.includes(reviewId)) return json({ error: "Review cannot be deleted. Please contact the team." })
    await prisma.review.delete({ where: { id: reviewId } })
    return json({ error: null }, {
      headers: {
        'set-cookie': await removeReview(reviewId, request)
      }
    })
  }

  return json({ error: null })
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: `${data?.product.title} | ZED` },
    { name: 'description', content: data?.product.description },
    { name: 'keywords', content: data?.product.words.toLowerCase() },
  ]
}


export type Product = {
  title: string
  category: { name: string }
  words: string
  images: Array<{
    id: string
  }>
  price: number
  sizes: Array<{
    id: string
    name: string
    chest: number
    length: number
  }>
  description: string
}


const reviewSchema = z.object({
  name: z.string().min(5),
  message: z.string().min(5),
  rating: z.string().refine(r => !isNaN(Number(r))).transform(r => Number(r))
})
