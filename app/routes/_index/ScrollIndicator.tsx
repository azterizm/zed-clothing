import { ArrowDown } from '@phosphor-icons/react'
import { useLocation, useNavigate } from '@remix-run/react'
import { motion } from 'framer-motion'
import { ClientOnly } from 'remix-utils/client-only'
import { useWindowSize } from 'usehooks-ts'

export default function ScrollIndicator() {
  const navigate = useNavigate()
  const location = useLocation()
  const { width } = useWindowSize()

  const noAnimate = location.state?.noAnimate === true

  return (
    <ClientOnly>{() => (
      <motion.button
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: noAnimate ? 0 : 3, duration: 1.5 }}
        className="scrollable absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center block z-10"
        onClick={() => navigate('/products')}
      >
        <div className="relative hidden md:block">
          <img src='/home/mouse.png' className='invert w-10' />
          <motion.div
            className='w-2 h-1 bg-white rounded-full absolute top-3.5 left-1/2 rotate-90'
           animate={{ y: 4 }}
           initial={{ rotate: 90, y: 0, x: '-50%' }}
           transition={{ repeatType: 'reverse', repeatDelay: 1, duration: 1, repeat: Infinity }}
          />
        </div>
        <ArrowDown className='md:hidden -translate-x-5' />
        <p className="text-xs mt-4 font-medium -translate-x-5 md:translate-x-0">{width > 768 ? 'scroll down' : 'enter'}</p>
      </motion.button>

    )}</ClientOnly>
  )
}

