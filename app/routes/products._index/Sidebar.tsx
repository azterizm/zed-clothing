import { ArrowLeft, MagnifyingGlass } from "@phosphor-icons/react"
import { SerializeFrom } from "@remix-run/node"
import { Link } from "@remix-run/react"
import classNames from "classnames"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { loader } from "."
import CategoryButton from "./CategoryButton"
import { useOnClickOutside } from "usehooks-ts"

export default function Sidebar(props: {
  categories: SerializeFrom<typeof loader>['categories']
  selectedCategory?: string
  onChangeCategory: (arg: string) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  useOnClickOutside(containerRef, () => setOpen(false))
  useEffect(() => {
    function handleMenu() { setOpen(false) }
    window.addEventListener('resize', handleMenu)
    return () => { window.removeEventListener('resize', handleMenu) }
  }, [])
  return (
    <>
      <div ref={containerRef} className={classNames('z-20 bg-bg-main transition-transform duration-300 absolute top-0 left-0 flex flex-col items-start justify-start border-r-2 border-white max-h-screen font-medium text-sm md:relative', open ? 'translate-x-0' : '-translate-x-full md:translate-x-0')}>
        <div className="min-h-[30vh] w-full flex flex-col">
          <button onClick={() => setOpen(false)} className="md:hidden flex items-center gap-2 p-2"><ArrowLeft /><span>Close</span></button>
          <div className="flex-1 flex items-end" id='props.selectedCategory_view'>
            <Link to='/search' className="group px-4 py-2 border-t-2 border-white w-full text-left bg-black text-white absolute whitespace-nowrap -translate-y-9 flex items-center gap-2" >
              <MagnifyingGlass className='group-hover:rotate-90 transition-transform duration-300 group-hover:scale-[1.75] group-hover:translate-x-[4rem]' />{' '}
              <span className='group-hover:opacity-0 opacity-100 transition-opacity duration-300'>Search</span>
            </Link>
            <AnimatePresence>
              <motion.button transition={{ duration: 0.5 }} key={props.selectedCategory} exit={{ opacity: 0, x: -24 }} initial={{ width: 0 }} animate={{ width: '100%' }} className="px-4 py-2 border-t-2 border-white w-full text-left bg-white text-black absolute whitespace-nowrap origin-right" >
                {props.selectedCategory || 'new_arrivals'}
              </motion.button>
            </AnimatePresence>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-12 pt-12 ">
          {Object.keys(props.categories || {}).map((_, ci) => (
            <motion.div layout key={ci} className="flex flex-col items-start w-full min-w-[12rem]">
              {props.categories?.[ci]?.map((r, i) => r.name === props.selectedCategory ? null : (
                <CategoryButton selected={false} onClick={() => props.onChangeCategory(r.name)} key={i}>{r.displayName}</CategoryButton>
              ))}
              <motion.div transition={{ delay: 0.6 }} animate={{ width: '100%' }} initial={{ width: 0 }} className="ml-auto w-1/2 bg-white h-0.5" />
            </motion.div>
          ))}
        </div>
        <button className='px-4 py-2 bg-black w-full text-left flex items-center gap-2 border-t-2 border-white group relative'>
          <img src='/home/pkr.png' className='w-6' />
          <span>PKR</span>
          <p className="text-md font-semibold left-0 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-full bg-white rounded-lg text-black px-2 py-1 absolute top-0" style={{ transform: 'translateY(calc(-100% - 0.5rem))' }}>Pakistan Zindabad!</p>
        </button>
      </div>
      <button onClick={() => setOpen(e => !e)} className="absolute top-0 left-0 backdrop-blur-lg p-8 bg-black/30 font-bold text-sm underline z-10">menu</button>
    </>
  )
}
