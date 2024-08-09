import { LoaderFunctionArgs } from '@remix-run/node'
import * as davatar from 'davatar'
import fs from 'fs/promises'
import path from 'path'
import { longCacheHeader } from '~/constants/cache.server'
import { prisma } from '~/db.server'

const colors = ["#780000", "#c1121f", "#fdf0d5", "#003049", "#669bbc", "#001219", "#005f73", "#0a9396", "#94d2bd", "#e9d8a6", "#ee9b00", "#ca6702", "#bb3e03", "#9b2226"]

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const image = await prisma.review.findUnique({
    where: { id: params.id },
    select: {
      image: { select: { fileName: true, fileType: true, fileSize: true } },
      name: true
    }
  })

  if (!image?.image) {
    if (!image?.name) return new Response(null, { status: 404 })
    const avatar = davatar.default.davatar.generate({
      text: image?.name,
      textColor: colors[Math.floor(Math.random() * colors.length)],
      backgroundColor: colors[Math.floor(Math.random() * colors.length)],
    })
    const buffer = Buffer.from(avatar.split(",")[1], 'base64');
    return new Response(buffer, {
      headers: {
        'content-type': 'image/png',
        'content-disposition': `inline filename="avatar.png"`,
        'content-length': buffer.byteLength.toString(),
        'cache-control': longCacheHeader
      }
    })
  }

  const buffer = await fs.readFile(
    path.resolve(
      'uploads',
      image.image.fileName,
    ),
  )

  return new Response(buffer, {
    headers: {
      'content-type': image.image.fileType,
      'content-disposition': 'inline filename="' + image.image.fileName + '"',
      'content-length': buffer.byteLength.toString(),
      'cache-control': longCacheHeader
    }
  })
}
