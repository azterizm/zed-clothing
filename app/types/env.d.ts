declare global {
  namespace NodeJS {
    interface ProcessEnv {
      ORDERS_COOKIE_SECRET: string
      CHECKOUT_COOKIE_SECRET: string
      REVIEW_COOKIE_SECRET: string
    }
  }
}

export { }
