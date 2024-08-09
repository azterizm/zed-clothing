import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';
import { chromium } from 'playwright';
import tinycolor from 'tinycolor2';

const prisma = new PrismaClient()
const data = [
  {
    "title": "White Relaxed Fit Resort Shirt",
    "images": [
      "https://zed.com.pk/cdn/shop/files/050A6166_600x.jpg?v=1718954935",
      "https://zed.com.pk/cdn/shop/files/050A6152_600x.jpg?v=1718954920",
      "https://zed.com.pk/cdn/shop/files/050A6170_600x.jpg?v=1718957245",
      "https://zed.com.pk/cdn/shop/files/050A6152_600x.jpg?v=1718954920"
    ],
    "price": 2599,
    "sizes": {
      "small": {
        "chest": 39,
        "length": 27
      },
      "medium": {
        "chest": 41,
        "length": 28
      },
      "large": {
        "chest": 43,
        "length": 29
      },
      "custom_available": true
    },
    "description": "Arguably one of the best trend pieces of last year make it's return: the revere collar shirt. Often called the Cuban shirt, this piece was a monumental success and made a huge impact on last years menswear market. Worn by the likes of Harry Styles, Ryan Gosling, Brooklyn Beckham and Chris Pine, this shirt covered runways and camera lenses all season. We've got some of our own revere collar shirt just in time for SS19.",
    "words": [
      "Regular Fit",
      "Revere Collar",
      "Easily dressed up or down",
      "Woven cotton fabric",
      "Machine washable",
      "Buttoned fastening.",
      "Half Sleeves",
      "Imported Fabric",
      "Tight around the sleeves and chest"
    ],
  },
  {
    "title": "Black V Neck Organic Vest",
    "images": [
      "https://zed.com.pk/cdn/shop/files/050A6367.jpg?v=1717754716",
      "https://zed.com.pk/cdn/shop/files/050A6352-1_600x.jpg?v=1717754754",
      "https://zed.com.pk/cdn/shop/files/050A6363_600x.jpg?v=1717754754",
      "https://zed.com.pk/cdn/shop/files/050A6356_600x.jpg?v=1717754754",
      "https://zed.com.pk/cdn/shop/files/050A6356_600x.jpg?v=1717754754",
      "https://zed.com.pk/cdn/shop/files/050A6356.jpg?v=1717754754"
    ],
    "price": 1199,
    "sizes": {
      "small": {
        "chest": 38,
        "length": 26
      },
      "medium": {
        "chest": 40,
        "length": 27
      },
      "large": {
        "chest": 42,
        "length": 28
      },
      "custom_available": true
    },
    "description": "Crafted from superior quality fabric. These soft open-edged vests are a must for your active wardrobe, offering a smooth and comfortable pop of fashion to your fitness runway. Wear it with any bottoms - long or short and show the world what you have been hiding under that shirt all along.",
    "words": [
      "organic",
      "vest",
      "black",
      "V-neck",
      "fitness",
      "wardrobe",
      "fashion",
      "comfortable",
      "active",
      "soft"
    ]
  }
]

const categoriesSet = [
  ['SHIRTS', 'PANTS', 'SHOES', 'ACCESSORIES'],
  ['CASUAL', 'fullFORMAL', 'SEMI_FORMAL'],
  ['WEDDING', 'MEETING', 'PRESENTATION', 'ROAM', 'PLAYFUL']
]

  ; (async () => {

    await prisma.productCategory.create({ data: { name: 'new_arrivals', displayName: 'NEW_ARRIVALS', group: 0 } })
    await prisma.productCategory.create({ data: { name: 'selected_outfits', displayName: 'SELECTED_OUTFITS ⚡', group: 0 } })

    await Promise.all(categoriesSet.map((categories, i) => Promise.all(categories.map(r => prisma.productCategory.create({ data: { name: r.toLowerCase(), displayName: r, group: i } })))))

    const images = await Promise.all(data.map(r => Promise.all(r.images.map(async url => {
      const abuffer = await fetch(url).then(r => r.arrayBuffer())
      const buffer = Buffer.from(abuffer)
      const n = Math.random().toString(36).slice(2) + '.jpg'
      const p = path.resolve('uploads', n)
      await fs.writeFile(p, buffer)
      return { name: n, size: abuffer.byteLength, type: 'image/jpeg' }
    }))))


    const category = await prisma.productCategory.findFirst({ where: { name: 'shirts' } })

    const products = await Promise.all(data.map(async (r, i) => {
      const colors = await extractProductColors(images[i][0].name)
      await prisma.product.create({
        data: {
          title: r.title,
          price: r.price,
          words: r.words.join(','),
          sizes: {
            create: [
              { name: 'small', chest: r.sizes.small.chest, length: r.sizes.small.length },
              { name: 'medium', chest: r.sizes.medium.chest, length: r.sizes.medium.length },
              { name: 'large', chest: r.sizes.large.chest, length: r.sizes.large.length },
            ]
          },
          description: r.description,
          images: { create: images[i].map(r => ({ fileName: r.name, fileSize: r.size, fileType: r.type })) },
          category: !category ? undefined : { connect: [{ id: category.id }] },
          prominentColors: colors.prominent.join(':'),
          averageColor: colors.average
        }
      })
    }))


    console.log({ products })
  })()



async function extractProductColors(fileName: string) {
  const dataUri = await toDataUri(path.resolve('uploads/', fileName))
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('about:blank')
  await page.addScriptTag({ path: path.resolve('public/scripts/color.js') })
  const prominent: number[][] = await page.evaluate((r) => {
    return (window as any).colorjs.prominent(r, { amount: 2 })
  }, dataUri)
  const average: number[] = await page.evaluate((r) => {
    return (window as any).colorjs.average(r)
  }, dataUri)
  await page.close()
  await browser.close()

  const p = tinycolor(`rgb(${prominent[0][0]},${prominent[0][1]},${prominent[0][2]})`)
  const c = tinycolor(`rgb(${average[0]},${average[1]},${average[2]})`)
  const inst = p.isDark() ? c.lighten(50) : c.darken(50)
  const averageRgb = inst.toString('rgb')

  return { average: averageRgb, prominent: prominent.map(rgbArrayToString) }
}
function rgbArrayToString(input?: number[]) {
  return `rgb(${input?.[0]},${input?.[1]},${input?.[2]})`
}
async function toDataUri(imgPath: string) {
  const bitmap = await fs.readFile(imgPath);
  const base64Image = Buffer.from(bitmap).toString('base64');
  const ext = imgPath.split('.').pop();
  const uri = `data:image/${ext};base64,${base64Image}`;
  return uri;
}
