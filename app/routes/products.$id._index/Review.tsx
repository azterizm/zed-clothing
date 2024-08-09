import { Star, X } from "@phosphor-icons/react";
import { useFetcher } from "@remix-run/react";
import classNames from "classnames";
import { motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";

export default function Review(props: {
  show: boolean
  onClose: () => void
}) {
  const [rating, setRating] = useState(10)
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState('')
  const fetcher = useFetcher<{ error: null | string }>()

  useEffect(() => {
    if (fetcher.data && fetcher.data.error === null) {
      setName('')
      setMessage('')
      setFile(null)
      setFileUrl('')
      setRating(10)
      props.onClose()
    }
  }, [fetcher])

  function onSubmit(e: FormEvent) {
    e.preventDefault()

    const form = new FormData()
    form.append('name', name)
    form.append('action', 'add_review')
    form.append('message', message)
    form.append('rating', rating.toString())
    if (file) form.append('image', file)

    fetcher.submit(form, { method: 'post', encType: 'multipart/form-data' })
  }

  return (
    <motion.form onSubmit={onSubmit} initial={{ height: 0, opacity: 0 }} animate={{ height: props.show ? 'auto' : 0, opacity: props.show ? 1 : 0 }} className={classNames('overflow-hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white border-2 border-white min-w-[50vw]', props.show ? '' : 'pointer-events-none')}>
      <div className="flex items-center justify-between border-b-2 border-white">
        <motion.h1 key='review-heading' className='pl-4 text-3xl font-bold'>Post your review</motion.h1>
        <button type='button' onClick={props.onClose} className="flex items-center gap-2 bg-white text-black py-4 px-4">
          <span>Close</span>
          <X />
        </button>
      </div>
      <label htmlFor="image" className="relative py-8 cursor-pointer border-b-2 border-white">
        <button className="text-center py-8 w-full text-lg">{file ? 'change' : 'upload'} image</button>
        <input
          onChange={e => {
            const f = e.target.files?.item(0)
            if (f) {
              setFile(f)
              setFileUrl(URL.createObjectURL(f))
            }
          }}
          className="opacity-0 w-full bg-blue-600 h-full absolute top-0 left-0"
          type="file"
          name="image"
          id="image"
          accept="image/*"
        />
        {file ? (
          <img src={fileUrl} alt="uploaded image" className="absolute top-0 left-3 pointer-events-none w-full h-full aspect-square object-contain object-center max-w-24" />
        ) : null}
      </label>
      <div className="flex items-start gap-4 p-8 bg-bg-main text-white border-b-2 border-white w-full">
        <span>Name</span>
        <input value={name} onChange={e => setName(e.target.value)} required minLength={5} type="text" name="name" id="name" placeholder="Type your name here..." className="-translate-y-0.5 bg-bg-main text-white w-full px-4 text-lg" />
      </div>
      <div className="flex items-start gap-4 p-8 bg-bg-main text-white border-b-2 border-white w-full">
        <span>Message</span>
        <textarea value={message} onChange={e => setMessage(e.target.value)} required minLength={5} name="message" id="message" placeholder="Type your message here..." className="-translate-y-0.5 bg-bg-main text-white w-full px-4 text-lg" rows={3} />
      </div>
      <div className="flex items-center gap-4 p-8 bg-bg-main text-white border-b-2 border-white w-full">
        <span>Rating</span>
        <div className="flex items-center">
          {new Array(10).fill(null).map((_, i) => (
            <button type='button' key={i} onClick={() => setRating(i + 1)} className="hover:scale-[1.5] transition-transform duration-300 block">
              <Star weight={rating < (i + 1) ? 'regular' : 'fill'} />
            </button>
          ))}
        </div>
      </div>
      <button className="text-lg font-medium text-center py-8 w-full text-md">
        {fetcher.state !== 'idle' ? 'submitting...' : 'submit'}
        {' '}
        {fetcher.data ? (
          <span className={classNames(!fetcher.data.error ? 'text-green-400' : 'text-red-400')}>
            {fetcher.data?.error || 'posted!'}
          </span>
        ) : null}
      </button>
    </motion.form>
  )
}
