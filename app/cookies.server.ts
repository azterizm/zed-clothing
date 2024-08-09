import { createCookie } from "@remix-run/node";

export const cartCookie = createCookie('cart', {
  maxAge: 604_800, // one week
})

export const checkoutInfoCookie = createCookie('checkout', {
  maxAge: 1.814e+9, // 3 week
  secrets: [process.env.CHECKOUT_COOKIE_SECRET]
})

export const ordersCookie = createCookie('orders', {
  maxAge: 1.814e+9, // 3 week
  secrets: [process.env.ORDERS_COOKIE_SECRET]
})

export const reviewsCookie = createCookie('reviews', {
  maxAge: 1.814e+9, // 3 week
  secrets: [process.env.REVIEW_COOKIE_SECRET]
})

export const lastSelectedCategoryCookie = createCookie('last_category', {
  maxAge: 3.6e+6 // 1 hour
})


export const messageCookie = createCookie('message', {
  maxAge: 3.6e+6
})
