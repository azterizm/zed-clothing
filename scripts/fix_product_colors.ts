import { PrismaClient } from '@prisma/client';
import { extractProductColors } from './utils';


(async () => {
  const prisma = new PrismaClient();
  const products = await prisma.product.findMany({
    select: {
      images: { select: { id: true, fileName: true, } },
      id: true,
      averageColor: true,
      prominentColors: true
    }
  })

  for (const product of products) {
    const colors = await extractProductColors(product?.images[0].fileName)
    await prisma.product.update({
      where: { id: product.id }, data: {
        averageColor: colors.average,
        prominentColors: colors.prominent.join(':')
      }
    })
  }
  console.log('done')
})()


