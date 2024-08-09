import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, useLoaderData, useLocation, useNavigate, useNavigation } from "@remix-run/react";
import { animate, motion, stagger } from "framer-motion";
import _ from 'lodash';
import { useState } from "react";
import { useTimeout, useWindowSize } from "usehooks-ts";
import Cart from "~/components/Cart";
import { prisma } from "~/db.server";
import { cachedResponse } from "~/utils/cache.server";
import { getCart } from "~/utils/cart.server";
import { randomInt } from "~/utils/data";
import UnderlineButton from "../../components/UnderlineButton";
import CircularText from "./CircularText";
import ScrollIndicator from "./ScrollIndicator";
import handleNavigation from "./navigation";
import { lastSelectedCategoryCookie } from "~/cookies.server";
import classNames from "classnames";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const isMobile = Boolean(request.headers.get('user-agent')?.includes('Mobi'))
  const data = await cachedResponse(
    'categories',
    prisma.productCategory.findMany({
      select: { name: true, displayName: true, group: true },
      orderBy: { updatedAt: 'asc' }
    }),
    259200
  )
  const groupedCategories = _.groupBy(data, 'group')
  const cart = await getCart(request)

  const count = await cachedResponse(`products_count`, prisma.product.count())
  let skip = randomInt(0, count)
  if ((skip + 10) > count) skip = Math.max(0, skip - 10)
  const products = await cachedResponse(
    'home_products',
    prisma.product.findMany({
      select: {
        images: { select: { id: true }, take: 1, orderBy: { createdAt: 'desc' } },
      },
      take: isMobile ? 2 : 4,
      skip,
    })
  )
  const images = products.map(r => r.images[0].id)

  return json({ categories: groupedCategories, cart, images, isMobile }, {
    headers: {
      'set-cookie': await lastSelectedCategoryCookie.serialize(''),
    }
  })
}

export default function Home() {
  const { isMobile, cart, categories, images } = useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const location = useLocation()
  const noAnimate = location.state?.noAnimate === true
  const navigation = useNavigation()
  const { width } = useWindowSize()
  const [openMenu, setOpenMenu] = useState(false)
  const cartOpen = useState(false);

  useTimeout(() => {
    animate('.home-image', { height: '100vh' }, { delay: stagger(0.25) })
  }, noAnimate ? 0 : 1500)

  handleNavigation(cartOpen[0])

  return (
    <motion.div initial={{ height: '100vh' }} animate={{ height: navigation.state !== 'idle' ? '0vh' : '100vh' }} className="h-screen relative">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: noAnimate ? 0 : 3 }} className="flex items-start justify-between absolute w-screen z-20 text-xs md:mt-8 md:ml-8">
        <motion.div initial={{ height: '100vh', visibility: 'visible' }} animate={{ height: openMenu || width > 768 ? width > 768 ? 'auto' : '100vh' : 0, visibility: openMenu || width > 768 ? 'visible' : 'hidden' }} className="flex items-start gap-6 flex-col w-screen h-screen overflow-y-auto bg-black p-8 pt-24 z-10 md:p-0 md:pt-0 md:bg-transparent md:w-max md:h-max md:flex-row">
          {Object.keys(categories).map((_, ci) => (
            <div key={ci} className="flex flex-col items-start gap-1 w-full text-left">
              {categories[ci].map((r, i) => (
                <UnderlineButton onClick={() => navigate('/products?category_name=' + r.name)} key={i}>{r.displayName}</UnderlineButton>
              ))}
            </div>
          ))}
        </motion.div>
        <button onClick={() => setOpenMenu(e => !e)} className="absolute top-8 left-8 z-20 text-sm font-bold underline md:hidden">
          {openMenu ? 'close' : 'menu'}
        </button>
        <button className="absolute left-1/2 -translate-x-1/2 top-8 md:top-0">
          <motion.img src='/logo.svg' className="w-8" />
        </button>
      </motion.div>

      <div className="w-screen h-screen flex items-center absolute top-0 left-8 z-10 -translate-x-8 md:translate-x-0 scrollable">
        <div className="flex flex-col items-start mx-auto">
          <h1 className="text-[8vw] md:text-5xl font-bold flex items-center gap-2 mx-auto justify-center">
            <span className="-translate-y-1">{'{'}</span>
            <motion.span className="w-0 whitespace-nowrap overflow-hidden" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ ease: 'circOut', duration: 3 }}>zed</motion.span>
            <span className="-translate-y-1">{'}'}</span>
          </h1>
          <motion.p animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: -4 }} transition={{ delay: noAnimate ? 0 : 2 }} className="opacity-0 text-left normal-case max-w-xs mt-4">Business grade elegance for the modern, handsome professionals.</motion.p>
        </div>
      </div>

      <CircularText />
      <ScrollIndicator />

      <div className="w-screen h-screen flex overflow-hidden">
        {images.map(r => (
          <div key={r} className={classNames('h-0 home-image overflow-hidden', isMobile ? 'w-1/2' : 'w-1/4')}>
            <img className="h-screen w-full object-cover object-center brightness-[0.4]" alt='' src={`/products/image/${r}`} />
          </div>
        ))}
      </div>

      <Cart openState={cartOpen} items={cart} />
    </motion.div>
  )
}

export const meta: MetaFunction<typeof loader> = () => {
  return [
    { title: 'ZED | T-Shirts, Hoodies, V-necks, Polos, Shorts' },
    { name: 'description', content: 'Business grade elegance for the modern, handsome professionals.' },
    { name: 'keywords', content: "t-shirts for professionals,business grade t-shirts,elegant hoodies for men,professional v-necks,stylish polos for work,modern polos for professionals,handsome professional wear,business casual shorts,elegant men's t-shirts,office-ready hoodies,sophisticated v-necks,professional polos for men,modern professional apparel,business elegance clothing,premium men's shorts" },
  ]
}


