import fs from 'fs/promises'
import pRetry from 'p-retry'
import axios from 'axios'
import { parse } from 'node-html-parser'
import path from 'path'
import data from '../scrap/products.json'

(async () => {

  const categories = ['shirts', 'tShirts', 'pants', 'jacket', 'shorts', 'activewear'] as const
  const products = categories.map(r => data[r])

  await fs.appendFile(path.resolve('scrap/product_details.json'), `{`, { encoding: 'utf8' })
  for (let i = 0; i < products.length; i++) {
    const category = categories[i]
    let urls = products[i]
    const data = await Promise.all(urls.map(async (url) => {
      const res = await pRetry(() => axios.get<string>(url, { timeout: 50000 }).then(r => r.data), { retries: 5 })
      const html = parse(res)
      const name = html.querySelector('h2.name')?.textContent
      const price = html.querySelector('span.money')?.textContent
      const desc = html.querySelector('#product-description p')?.textContent
      let images = html.querySelectorAll('a[href*="zed.com.pk/cdn/shop/files/"]').map(r => r.getAttribute('href')).filter(Boolean).map(r => 'https://' + r?.slice(2).split('?')[0])
      if (!images.length) images = html.querySelectorAll('a[href*="zed.com.pk/cdn/shop/products/"]').map(r => r.getAttribute('href')).filter(Boolean).map(r => 'https://' + r?.slice(2).split('?')[0])
      if (!images.length) throw new Error("Still no images found for " + url)
      images = images.filter(r => !r.includes('size-chart'))
      const words = html.querySelectorAll('#product-description ul li').map(r => r.textContent).slice(0, -3)
      return { name, price, desc, images, words }
    }))
    console.log(category, 'done')
    await fs.appendFile(path.resolve('scrap/product_details.json'), `,"${category}": ${JSON.stringify(data)}`, { encoding: 'utf8' })
  }
  await fs.appendFile(path.resolve('scrap/product_details.json'), `}`, { encoding: 'utf8' })
})()
