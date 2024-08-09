import classNames from "classnames";
import { motion } from "framer-motion";
import { ReactNode } from "react";

export default function CategoryButton(props: {
  children: ReactNode,
  className?: string,
  onClick?: () => void
  selected?: boolean
}) {
  return (
    <motion.button
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onClick={props.onClick}
      exit={{ opacity: 0 }}
      layout
      initial="initial"
      animate='initial'
      whileHover="animate"
      variants={{
        initial: { backgroundColor: '#101010', color: '#ffffff', position: 'relative' },
        animate: { backgroundColor: '#ffffff', color: '#000000', position: 'relative' },
      }}
      className={classNames('relative whitespace-nowrap px-4 py-4 md:py-2 w-full text-left', props.className)}
    >
      <motion.span transition={{ delay: 0.5 }} animate={{ opacity: 1 }} initial={{ opacity: 0 }} className="flex items-center gap-2 normal-case">{props.children}</motion.span>
      <motion.div transition={{ delay: 0.6 }} animate={{ width: 100 + '%' }} initial={{ width: 0 }} className="absolute top-0 right-0 w-0 bg-white h-0.5" />
    </motion.button>
  )
}

