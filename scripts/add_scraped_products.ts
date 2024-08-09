import { PrismaClient } from '@prisma/client';
import data from '../scrap/product_details.json';
import general from '../scrap/products.json';
import { extractProductColors } from './utils';

const prisma = new PrismaClient();
(async () => {
  const categoriesSet = [
    ['SHIRTS', 'PANTS', 'JACKETS', 'SHORTS'],
    ['CASUAL', 'fullFORMAL', 'SEMI_FORMAL'],
    ['WEDDING', 'MEETING', 'PRESENTATION', 'ROAM', 'PLAYFUL']
  ]
  const categories = ['shirts', 'tShirts', 'pants', 'jacket', 'shorts', 'activewear'] as const

  await prisma.productCategory.create({ data: { name: 'new_arrivals', displayName: 'NEW_ARRIVALS', group: 0 } })
  await prisma.productCategory.create({ data: { name: 'selected_outfits', displayName: 'SELECTED_OUTFITS ⚡', group: 0 } })
  await Promise.all(categoriesSet.map((categories, i) => Promise.all(categories.map(r => prisma.productCategory.create({ data: { name: r.toLowerCase(), displayName: r, group: i } })))))

  for (let i = 0; i < categories.length; i++) {
    const pCategory = categories[i]
    console.log({ pCategory })
    const products = data[pCategory].slice(0, 50)
    while (products.length) {
      console.log(products.length)
      await Promise.all(products.splice(0, 10).map(async product => {
        if (!product.name || !product.desc) return

        const names =
          pCategory === 'tShirts' ? ['SHIRTS', 'ROAM', 'PLAYFUL', 'CASUAL']
            : pCategory === 'jacket' ? ['MEETING', 'WEDDING', 'JACKETS', 'fullFORMAL', 'SEMI_FORMAL', 'PRESENTATION']
              : pCategory === 'shorts' ? ['SHORTS', 'PLAYFUL', 'CASUAL']
                : pCategory === 'activewear' ? ['ROAM', 'CASUAL']
                  : pCategory === 'shirts' ? ['SHIRTS', 'ROAM', 'PLAYFUL', 'CASUAL', 'PRESENTATION']
                    : pCategory === 'pants' ? ['PANTS', 'fullFORMAL', 'SEMI_FORMAL', 'WEDDING', 'MEETING', 'PRESENTATION'] : []

        const categoryIds = await Promise.all(names.map(r => prisma.productCategory.findFirst({ where: { displayName: r }, select: { id: true } }))).then(r => r.map(r => r?.id).filter(Boolean)) as string[]

        const imageBlob = await fetch(product.images[0]).then(r => r.blob())
        const buffer = Buffer.from(await imageBlob.arrayBuffer())
        const dataUri = `data:${imageBlob.type};base64,${buffer.toString('base64')}`
        const colors = await extractProductColors(dataUri)
        await prisma.product.create({
          data: {
            title: product.name,
            price: Number(product.price.match(/\d/g)?.slice(0, -2).join('') || '0'),
            words: product.words.join(','),
            sizes: {
              create: [
                { name: 'small', chest: general.sizes[pCategory].s[0], length: general.sizes[pCategory].s[1] },
                { name: 'medium', chest: general.sizes[pCategory].m[0], length: general.sizes[pCategory].m[1] },
                { name: 'large', chest: general.sizes[pCategory].l[0], length: general.sizes[pCategory].l[1] },
                { name: 'extra_large', chest: general.sizes[pCategory].xl[0], length: general.sizes[pCategory].xl[1] },
              ]
            },
            description: product.desc,
            images: { create: product.images.map(r => ({ url: r })) },
            prominentColors: colors.prominent.join(':'),
            averageColor: colors.average,
            category: { connect: categoryIds.map(r => ({ id: r })) }
          }
        })

      }))
    }


  }

})()


