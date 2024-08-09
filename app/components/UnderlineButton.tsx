import classNames from "classnames";
import { motion } from "framer-motion";
import { ButtonHTMLAttributes } from "react";
export default function UnderlineButton(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <motion.button whileHover="animate" initial="inital" animate="inital" {...props as any} className={classNames('relative bg-neutral-800 w-full text-left p-2 md:bg-transparent md:p-0 md:w-max', props.className)}>
      <span className="whitespace-nowrap">{props.children}</span>
      <motion.div variants={{ initial: { width: 0 }, animate: { width: '100%' } }} className="absolute bottom-0 left-0 w-0 bg-white" style={{ height: 1 }} />
    </motion.button>
  )
}
