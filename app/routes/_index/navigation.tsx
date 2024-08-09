import { useNavigate } from "@remix-run/react"
import { useEffect } from "react"
import { useWindowSize } from "usehooks-ts"
import { isTouchDevice } from "~/utils/device.client"

export default function handleNavigation(disableNavigation?: boolean) {
  const navigate = useNavigate()
  const { width } = useWindowSize()

  useEffect(() => {
    function handleWheel(e: WheelEvent) {
      if (isTouchDevice() || width < 768) return
      if (e.deltaY > 0 && !disableNavigation) {
        navigate('/products', { state: { noAnimate: true } })
      }
    }

    let touchStart = 0
    let touchEnd = 0
    function checkDirection() {
      if (touchEnd < touchStart && !disableNavigation)
        navigate(
          '/products',
          { state: { noAnimate: true } }
        )
    }
    function handleTouchStart(e: TouchEvent) {
      touchStart = e.changedTouches[0].screenY
    }
    function handleTouchEnd(e: TouchEvent) {
      touchEnd = e.changedTouches[0].screenY
      const allowed = [...document.getElementsByClassName('scrollable')]
      if (!e.target || !allowed.length) return
      if (allowed.some(r => e.target === r || r.contains(e.target as HTMLElement))) checkDirection()
    }

    if (isTouchDevice() || width < 768) {
      window.addEventListener('touchstart', handleTouchStart)
      window.addEventListener('touchend', handleTouchEnd)
      return
    }
    else window.addEventListener('wheel', handleWheel)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [width, disableNavigation])
}
