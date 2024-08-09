import { PrismaClient } from "@prisma/client";
import _ from "lodash";

const data = [
  'Amazing quality and fit!',
  'Fast shipping, great service.',
  'Stylish and affordable!',
  'Perfect fit, very comfortable.',
  'Top-notch craftsmanship.',
  'Love the variety available.',
  'Great prices for quality clothing.',
  'Fits perfectly, looks great.',
  'Excellent customer service!',
  'Highly recommend this site.',
  'Trendy styles, great prices.',
  'Super comfortable and durable.',
  'Awesome fit and feel.',
  'Quick delivery, well-packaged.',
  'Impressive quality and style.',
  'Fits like a glove!',
  'Great for both casual and formal.',
  'High-quality materials used.',
  'Received many compliments!',
  'My new favorite clothing site.',
  'Stylish and Comfortable!',
  "I recently purchased a pair of jeans from this site, and I'm beyond impressed. The fit is perfect, and they are incredibly comfortable. I've already received several compliments!",
  'Top-Notch Quality',
  'The quality of the shirts I bought is outstanding. They feel durable and look fantastic. Definitely worth the price. Will be shopping here again!',
  'Perfect Fit',
  'Finding clothes that fit well can be a challenge, but this website nailed it. The sizes are accurate, and the clothes fit like they were tailor-made for me. Highly recommended!',
  'Great Customer Service',
  'Had a slight issue with my order, but customer service was amazing. They resolved it quickly and even offered me a discount on my next purchase. Great experience overall!',
  'Excellent Variety',
  "The range of styles and colors available is impressive. I found everything I needed for both casual and formal occasions. This is now my go-to site for men's clothing.",
  'Fast Shipping',
  "I was pleasantly surprised by how quickly my order arrived. The packaging was neat, and the clothes were in perfect condition. I'll definitely be ordering again.",
  'Affordable and High-Quality',
  "It's rare to find such high-quality clothing at these prices. The materials used are top-notch, and the craftsmanship is excellent. I'm very happy with my purchase.",
  'Trendy and Modern',
  "The designs available are right on trend. I've updated my wardrobe with some fantastic pieces that are both stylish and modern. Love this site!",
  'Comfortable and Durable',
  'Bought a few t-shirts and a hoodie, and they are incredibly comfortable. They’ve held up well after several washes, maintaining their shape and color. Very satisfied!',
  'Great Fit and Look',
  'The suit I ordered fits perfectly and looks very sharp. I received numerous compliments at my last event. Will definitely be buying more from here in the future!'
]

const availableNames = [
  "Ahmed Al-Farsi",
  "Khalid ibn Abdulaziz",
  "Mohammed Al-Mansour",
  "Yusuf ibn Hasan",
  "Ibrahim Al-Hakim",
  "Bilal Al-Rashid",
  "Omar ibn Said",
  "Hamza Al-Hadi",
  "Ali Al-Tamimi",
  "Hassan Al-Najjar",
  "Mustafa Al-Ghani",
  "Suleiman ibn Tariq",
  "Ismail Al-Rahman",
  "Zayd ibn Nasser",
  "Rashid Al-Maari",
  "Faisal Al-Hussain",
  "Amin ibn Salim",
  "Abdul Rahman Al-Qasim",
  "Tariq Al-Malik",
  "Sami ibn Farid",
  "Nabil Al-Aziz",
  "Adil Al-Mustafa",
  "Mansour ibn Hakim",
  "Jawad Al-Harith",
  "Rami ibn Jamil",
  "Kareem Al-Bukhari",
  "Fahad Al-Hashimi",
  "Saif ibn Khalil",
  "Yahya Al-Ali",
  "Salman ibn Qadir",
  "Adnan Al-Basir",
  "Bassam Al-Khattab",
  "Hadi ibn Faisal",
  "Zubair Al-Rafiq",
  "Nasser ibn Mahdi",
  "Imran Al-Mansoor",
  "Munir Al-Rafi",
  "Ilyas Al-Saadi",
  "Murad ibn Hamid",
  "Anwar Al-Jabbar",
  "Fadi Al-Karim",
  "Hassan ibn Omar",
  "Jamil Al-Farooq",
  "Kamal ibn Idris",
  "Latif Al-Hakeem",
  "Majid Al-Munir",
  "Nadim ibn Rashid",
  "Rafiq Al-Sadiq",
  "Sabir Al-Harith",
  "Usman ibn Saeed"
]

const prisma = new PrismaClient()
  ; (async () => {
    const products = await prisma.product.findMany()
    for (const product of products) {
      const reviews = _.shuffle(data).slice(0, _.random(1, data.length))
      const names = _.shuffle(availableNames).slice(0, reviews.length)
      await Promise.all(reviews.map((r, i) => prisma.review.create({
        data: {
          message: r,
          productId: product.id,
          name: names[i],
          ip: null,
          rating: 10,
        }
      })))
    }
    process.exit(0)
  })()
