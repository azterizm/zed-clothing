import tinycolor from "tinycolor2"
import { prisma, redis } from "~/db.server"

export async function ensureProductColors(product: { id: string, prominentColors: string, averageColor: string }) {
  const c = tinycolor(product.prominentColors.split(':')[1])
  const a = tinycolor(product.averageColor)

  if (c.isDark() && a.isDark()) {
    const r = c.lighten(75)
    product.prominentColors = product.prominentColors.split(':')[0] + ':' + r.toRgbString()
  }

  if (c.isLight() && a.isLight()) {
    const r = c.darken(75)
    product.prominentColors = product.prominentColors.split(':')[0] + ':' + r.toRgbString()
  }

  await prisma.product.update({
    where: { id: product.id },
    data: { prominentColors: product.prominentColors }
  })

  await redis.del(`product:${product.id}`)

  return product
}
