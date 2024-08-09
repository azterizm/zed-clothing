import fs from 'fs/promises';
import path from 'path';
import { chromium } from 'playwright';
import tinycolor from 'tinycolor2';


export async function extractProductColors(url: string) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto('about:blank')
  await page.addScriptTag({ path: path.resolve('public/scripts/color.js') })
  const prominent: number[][] = await page.evaluate((r) => {
    return (window as any).colorjs.prominent(r, { amount: 2 })
  }, url)
  await page.close()
  await browser.close()

  const a = tinycolor(rgbArrayToString(prominent[0]))
  a.isDark() ? a.lighten(75) : a.darken(75)
  const bg = tinycolor(rgbArrayToString(prominent[1]))
  const circle = tinycolor(rgbArrayToString(prominent[0]))
  if (circle.isLight() && bg.isDark()) {
    bg.lighten(25)
  } else if (circle.isDark() && bg.isLight()) {
    bg.darken(25)
  }

  return { average: a.toRgbString(), prominent: [bg.toRgbString(), circle.toRgbString()] }
}
export function rgbArrayToString(input?: number[]) {
  return `rgb(${input?.[0]},${input?.[1]},${input?.[2]})`
}
export async function toDataUri(imgPath: string) {
  const bitmap = await fs.readFile(imgPath);
  const base64Image = Buffer.from(bitmap).toString('base64');
  const ext = imgPath.split('.').pop();
  const uri = `data:image/${ext};base64,${base64Image}`;
  return uri;
}

export function blobToDataUri(blob: Blob | File) {
  return new Promise<string>(r => {
    var a = new FileReader();
    a.onload = function(e) { if (typeof e.target?.result === 'string') r(e.target?.result); }
    a.readAsDataURL(blob);
  })

}
