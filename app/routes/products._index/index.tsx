import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { Link, useLoaderData, useNavigation, useSearchParams } from "@remix-run/react"
import classNames from "classnames"
import { AnimatePresence, motion } from "framer-motion"
import _ from "lodash"
import { useEffect, useRef, useState } from "react"
import { useIntersectionObserver } from "usehooks-ts"
import ProductListing from "~/components/ProductListing"
import { lastSelectedCategoryCookie } from "~/cookies.server"
import { prisma } from '~/db.server'
import { cachedResponse } from "~/utils/cache.server"
import { getCart } from "~/utils/cart.server"
import Cart from "../../components/Cart"
import CategoryHeading from "./CategoryHeading"
import Sidebar from "./Sidebar"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const categories = await cachedResponse(
    'categories',
    prisma.productCategory.findMany({
      select: { name: true, displayName: true, group: true },
      orderBy: { updatedAt: 'asc' }
    }),
    259200
  )

  const groupedCategories = _.groupBy(categories, 'group')

  const cart = await getCart(request)

  const cookie = request.headers.get('cookie')
  const urlCategory = url.searchParams.get('category_name')
  const lastCategory = urlCategory || await lastSelectedCategoryCookie.parse(cookie)

  return json({ categories: groupedCategories, cart, lastCategory })
}

export default function Products() {
  const { lastCategory, categories, cart } = useLoaderData<typeof loader>()
  const [category, setCategory] = useState(lastCategory || 'new_arrivals')

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [ended, setEnded] = useState(false)
  const [cursor, setCursor] = useState(0)
  const [isFirst, setIsFirst] = useState(true)

  const productsContainerRef = useRef<HTMLDivElement>(null)
  const navigation = useNavigation()
  const navLoading = navigation.state !== 'idle' && navigation.location?.pathname !== '/products'
  const [, setSearchParams] = useSearchParams()
  const { isIntersecting, ref: loadingRef } = useIntersectionObserver({ threshold: 0.5 })

  useEffect(() => {
    if (loading || !isIntersecting || isFirst) return
    setCursor(e => e + 20)
  }, [isIntersecting])

  useEffect(() => {
    setIsFirst(true)
    setEnded(false)
    setProducts([])
    setCursor(0)
    fetchProducts()
  }, [category])

  useEffect(() => {
    if (ended) return
    fetchProducts()
  }, [cursor])

  async function fetchProducts() {
    setLoading(true)
    const categoryFinal = lastCategory && (!category || category === 'new_arrivals') && isFirst ? lastCategory : category
    setIsFirst(false)
    const url = new URL(window.location.origin)
    url.pathname = '/api/products/list'
    url.searchParams.set('category_name', categoryFinal)
    url.searchParams.set('cursor', cursor.toString())
    const [data] = await Promise.all([
      fetch(url, { credentials: 'include', method: 'get' }).then(r => r.json()),
      new Promise<void>(r => setTimeout(() => r(), 800))
    ]) as unknown as [{ products: Product[], more: boolean }]
    setProducts(e => _.uniqBy([...e, ...data.products], 'id'))
    setLoading(false)
    document.title = `${categoryFinal.toUpperCase()} | ZED`
    if (window.location.href.includes('category_name')) { setSearchParams({}) }
    if (!data.more) { setEnded(true) }
  }

  return (
    <>
      {navLoading ? (<p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-lg animate-pulse !uppercase">loading...</p>) : null}
      <motion.div className="flex overflow-hidden" initial={{ height: 0 }} animate={{ height: navLoading ? 0 : '100vh' }}>
        <Sidebar onChangeCategory={setCategory} selectedCategory={category} categories={categories} />
        <div className="flex-1 flex flex-col max-h-screen">
          <CategoryHeading forceHide={Boolean(products.length && products.length < 6)} category={category} containerRef={productsContainerRef} />
          <motion.div
            ref={productsContainerRef}
            className="flex items-start gap-8 flex-wrap pt-24 sm:pt-8 p-8 overflow-y-auto flex-1 justify-center"
          >
            <AnimatePresence initial={false}>
              {products.map(r => <ProductListing imgPaddingTop={150} price={r.price} title={r.title} imageId={r.images?.[0]?.id} key={r.id} id={r.id} />)}
            </AnimatePresence>
            <h1
              ref={loadingRef}
              className={classNames('animate-pulse flex-auto w-full text-center text-md font-medium normal-case pt-8', navigation.state !== 'idle' ? 'opacity-50' : 'opacity-100', { 'hidden': ended })}
            >
              Loading more products...
            </h1>
            {!products.length && !loading ? (
              <h1 className={classNames('flex-auto w-full text-center text-md font-medium normal-case pt-8', navigation.state !== 'idle' ? 'opacity-50' : 'opacity-100')}>No products in this category. Please check later!</h1>
            ) : null}
          </motion.div>

        </div>
      </motion.div>
      <Link className="absolute px-8 py-[1.6rem] backdrop-blur-lg md:w-max w-1/2 overflow-hidden bg-black/30 top-0 md:z-20 left-[6.5rem] md:translate-x-0 md:left-6" to='/' state={{ noAnimate: true }}>
        <img src="/logo.svg" alt="" className="w-8" />
      </Link>
      <Cart items={cart} />
    </>
  )

}

export const meta: MetaFunction<typeof loader> = () => {
  return [
    { title: `Products | ZED` },
  ]
}

interface Product {
  id: string;
  title: string;
  price: number;
  images: {
    id: string;
  }[];
}
