import { FacebookLogo, InstagramLogo, TiktokLogo } from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { RefObject, useEffect, useState } from 'react'
import { isTouchDevice } from '~/utils/device.client'

export default function CategoryHeading(props: {
  containerRef: RefObject<HTMLDivElement>
  category: string
  forceHide?: boolean
}) {
  const [showTop, setShowTop] = useState(true)

  useEffect(() => {
    let prevY = 0
    let max = 0
    function handleScroll(e: Event) {
      const el = e.currentTarget as HTMLDivElement
      if (!max) {
        max = el.scrollHeight - el.clientHeight
        max = max * 0.1
      }
      if (props.forceHide || isTouchDevice()) return setShowTop(false)
      if (el.scrollTop <= 0 && prevY <= 0) return
      if (el.scrollTop > max) return setShowTop(false)
      if (prevY > el.scrollTop) {
        setShowTop(true)
        prevY = el.scrollTop
      } else {
        setShowTop(false)
        prevY = el.scrollTop
      }
    }
    props.containerRef?.current?.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', () => {
      props.containerRef?.current?.removeEventListener('scroll', handleScroll)
      props.containerRef?.current?.addEventListener('scroll', handleScroll)
    })
    return () => {
      props.containerRef?.current?.removeEventListener('scroll', handleScroll)
    }
  }, [])
  useEffect(() => {
    props.containerRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [props.category]);

  return (
    <div className='overflow-hidden'>
      <motion.div initial={{ height: '30vh' }} animate={{ height: showTop && !props.forceHide ? '30vh' : 0 }} className='flex flex-col'>
        <motion.div initial={{ opacity: 0 }} transition={{ delay: 0.7 }} animate={{ opacity: 1 }} className="flex items-center md:items-start justify-between px-8 pt-[2vh] md:pt-8 flex-1">
          <div className="mx-auto category-bp:hidden block">
            <p className='text-xs font-semibold'>free shipping all over pakistan</p>
            <div className="flex items-center gap-4 justify-center mt-2">
              <a href="#"><TiktokLogo /></a>
              <a href="#"><FacebookLogo /></a>
              <a href="#"><InstagramLogo /></a>
            </div>
          </div>
        </motion.div>
        <div className="overflow-hidden w-max mx-auto pb-4">
          <motion.h1 transition={{ delay: 0.25 }} initial={{ x: '100%' }} exit={{ x: '100%' }} animate={{ x: 0 }} className="text-center text-xl font-bold">{props.category}</motion.h1>
        </div>
      </motion.div>

      <motion.div initial={{ width: 0 }} transition={{ delay: 0.5 }} animate={{ width: '100%' }} className='ml-auto w-full h-0.5 bg-white' />
    </div>
  )
}

