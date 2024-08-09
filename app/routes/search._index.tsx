import { CaretLeft } from "@phosphor-icons/react";
import { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json, Link, useLoaderData, useSearchParams } from "@remix-run/react";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "use-debounce";
import ProductListing from "~/components/ProductListing";
import { prisma } from "~/db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const search = url.searchParams?.get('search') || ''
  if (!search) return json({ products: [] })
  const products = await prisma.product.findMany({
    select: {
      id: true,
      title: true,
      price: true,
      images: { select: { id: true }, take: 1, orderBy: { createdAt: 'desc' } },
    },
    where: {
      OR: [
        { title: { contains: search } },
        { words: { contains: search } },
        { description: { contains: search } },
        ...[isNaN(Number(search)) ? {} : { price: Number(search) }],
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return json({ products })
}

export default function Search() {
  const { products } = useLoaderData<typeof loader>()


  const inputRef = useRef<HTMLInputElement>(null)

  const [search, setSearch] = useState('')
  const [debouncedSearch] = useDebounce(search, 500)
  const [, setSearchParams] = useSearchParams()

  useEffect(() => {
    setSearchParams({ search: debouncedSearch })
  }, [debouncedSearch])

  useEffect(() => {
    const timeout = setTimeout(() => {
      inputRef.current?.focus()
    }, 500)

    return () => {
      clearTimeout(timeout)
    }
  }, [])

  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <div className="relative flex justify-center items-center m-16">
        <motion.input value={search} onChange={e => setSearch(e.target.value)} ref={inputRef} initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} type="text" name="search" id="search" placeholder="Type here..." className="text-2xl text-white bg-bg-main px-4 py-2 border-b-2 border-white font-semibold mt-20 md:mt-0" />
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <Link to='/products' className="absolute top-0 left-0 flex items-center gap-2 bg-black text-white border-2 border-white/30 px-4 py-2 hover:bg-white hover:text-black">
            <CaretLeft />
            Go back
          </Link>
        </motion.div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        exit={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-8 flex-wrap p-8 overflow-y-auto flex-1 justify-center"
      >
        {products.map(r => <ProductListing price={r.price} title={r.title} imageId={r.images?.[0]?.id} key={r.id} id={r.id} />)}
      </motion.div>
    </div>

  )
}

export const meta: MetaFunction = () => {
  return [
    { title: 'Search | ZED' },
  ]
}
