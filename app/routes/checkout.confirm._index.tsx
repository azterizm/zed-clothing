import { CaretLeft, Check } from "@phosphor-icons/react";
import { Link, useNavigation } from "@remix-run/react";
import { motion } from "framer-motion";

export default function CheckoutConfirm() {
  const navigation = useNavigation()
  return (
    <motion.div initial={{ height: 0 }} animate={{ height: navigation.state !== 'idle' ? 0 : '100vh' }} className="overflow-hidden">
      <div className="p-8 flex flex-col h-screen">
        <div className="relative">
          <Link to='/products' className="w-max flex items-center gap-2 px-4 py-2 border-white/30 hover:bg-white hover:text-black"><CaretLeft /><span>products</span></Link>
          <Link state={{ noAnimate: true }} to='/'><img src='/logo.svg' alt='logo' className="w-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" /></Link>
        </div>
        <div className="flex-1 flex items-center flex-col justify-center gap-4">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Check className="text-5xl" />
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
            className="normal-case font-medium">Your order has successfully been placed.</motion.p>
          <div className="flex items-center mt-16">
            <motion.div initial={{ opacity: 0, marginRight: 64 }} animate={{ marginRight: 24, opacity: 1 }} transition={{ delay: 1 }}>
              <Link state={{ noAnimate: true }} to='/' className="bg-black text-white px-4 py-1.5 border-2 border-white">home</Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, marginLeft: 64 }} animate={{ opacity: 1, marginLeft: 24 }} transition={{ delay: 1 }}>
              <Link to='/orders' className="bg-white text-black px-4 py-2">orders</Link>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
