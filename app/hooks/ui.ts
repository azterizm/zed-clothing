import { MouseEvent, useEffect, useState } from "react"

export function useMousePosition() {
  const [
    mousePosition,
    setMousePosition
  ] = useState({ x: 0, y: 0 })
  useEffect(() => {
    function updateMousePosition(ev: MouseEvent) {
      setMousePosition({ x: ev.clientX || 0, y: ev.clientY || 0 })
    }
    window.addEventListener('mousemove', updateMousePosition as any)
    return () => {
      window.removeEventListener('mousemove', updateMousePosition as any)
    }
  }, [])
  return mousePosition
}

