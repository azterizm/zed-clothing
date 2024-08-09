import { LoaderFunctionArgs, redirect } from "@remix-run/node"
import { prisma } from "~/db.server"

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const id = params.id
  const image = await prisma.productImage.findUnique({ where: { id }, select: { url: true } })

  if (!image) {
    return new Response(null, { status: 404 })
  }

  return redirect(image.url)
}
