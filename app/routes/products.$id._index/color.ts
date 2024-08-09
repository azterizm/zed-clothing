import { average, prominent } from 'color.js';
import tinycolor from 'tinycolor2';
import { imageEndpoint } from '../../utils/api';

export async function extractColorsFromURl(url: string) {
  const thumbnail = imageEndpoint(url)
  const matching = await prominent(thumbnail, { amount: 2 }) as number[][]
  const most = await average(thumbnail) as number[]
  const c = tinycolor(`rgb(${most[0]},${most[1]},${most[2]})`)
  const inst = c.isDark() ? c.lighten(50) : c.darken(50)
  const rgb = inst.toRgb()

  return { colors: matching, average: [rgb.r, rgb.g, rgb.b] }
}

