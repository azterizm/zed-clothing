import { json, LoaderFunctionArgs } from '@remix-run/node'
import { shortCacheHeader } from '~/constants/cache.server'
import { lastSelectedCategoryCookie } from '~/cookies.server'
import { prisma } from '~/db.server'
import { cachedResponse } from '~/utils/cache.server'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)

  const categoryName = url.searchParams.get('category_name')
  const cursor = url.searchParams.get('cursor')

  const where = { ...typeof categoryName === 'string' && categoryName !== 'new_arrivals' && categoryName.length ? { category: { some: { name: categoryName } } } : {} }

  const count = await cachedResponse(`products_count:${JSON.stringify(where)}`, prisma.product.count({ where }))
  const skip = Math.min(Math.max(0, Number(cursor) || 0), count)

  let products = await cachedResponse(
    `products_list:${JSON.stringify(where)}:${skip}`,
    prisma.product.findMany({
      select: {
        id: true,
        title: true,
        price: true,
        images: { select: { id: true }, take: 1, orderBy: { createdAt: 'asc' } },
      },
      where,
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip,
    })
  )

  return json({ products, more: (skip + 20) < count }, {
    headers: {
      'set-cookie': await lastSelectedCategoryCookie.serialize(where.category?.some?.name || ''),
      'cache-control': shortCacheHeader
    },
  })
}
