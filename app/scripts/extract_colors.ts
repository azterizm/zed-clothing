import { chromium } from 'playwright'
import { toDataUri } from '~/utils/file.server'
import path from 'path'
import tinycolor from 'tinycolor2'
import { rgbArrayToString } from '~/utils/color'

export async function extractProductColors(fileName: string) {
  const dataUri = toDataUri(path.resolve('uploads/', fileName))
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

  const c = tinycolor(`rgb(${average[0]},${average[1]},${average[2]})`)
  const inst = c.isDark() ? c.lighten(50) : c.darken(50)
  const averageRgb = inst.toString('rgb')

  return { average: averageRgb, prominent: prominent.map(rgbArrayToString) }
}
