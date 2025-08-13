
import { useEffect, useRef, useState } from 'react'

export function useInView<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null)
  const [isIntersecting, setIntersecting] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIntersecting(true)
        observer.unobserve(node)
      }
    }, { threshold: 0.15, ...options })

    observer.observe(node)
    return () => observer.disconnect()
  }, [options])

  return { ref, isIntersecting }
}
