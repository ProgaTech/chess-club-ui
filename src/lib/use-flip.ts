import { useCallback, useLayoutEffect, useRef } from 'react'
import type { RefObject } from 'react'

interface IFlipOptions {
  enabled: boolean
  moveMs: number
  landMs: number
}

const EASE_DRAW = 'cubic-bezier(0.22, 1, 0.36, 1)'

// FLIP for elements marked data-flip="<id>": call the returned snapshot() right before a change, and every
// marked element that moved glides from its old spot to its new one when `key` changes. The element may be a
// new node under a new parent, as long as it keeps its id. data-flip-delay staggers one element;
// data-flip-land makes it settle with a small bounce.
export function useFlip(rootRef: RefObject<HTMLElement | null>, key: unknown, options: IFlipOptions): () => void {
  const { enabled, moveMs, landMs } = options
  const before = useRef(new Map<string, DOMRect>())

  useLayoutEffect(() => {
    const root = rootRef.current
    const previous = before.current
    before.current = new Map()
    if (!root || !enabled || previous.size === 0) {
      return
    }
    for (const node of root.querySelectorAll<HTMLElement>('[data-flip]')) {
      const from = previous.get(node.dataset.flip ?? '')
      if (!from) {
        continue
      }
      const to = node.getBoundingClientRect()
      const dx = from.left + from.width / 2 - (to.left + to.width / 2)
      const dy = from.top + from.height / 2 - (to.top + to.height / 2)
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
        continue
      }
      const scale = to.width > 0 ? from.width / to.width : 1
      const land = node.dataset.flipLand !== undefined
      const start = `translate(${dx}px, ${dy}px) scale(${scale}, 1)`
      node.animate(
        land
          ? [{ transform: start }, { transform: 'translateY(-6px) scale(1.1)', offset: 0.8 }, { transform: 'none' }]
          : [{ transform: start }, { transform: 'none' }],
        {
          duration: land ? landMs : moveMs,
          delay: Number(node.dataset.flipDelay ?? 0),
          easing: EASE_DRAW,
          fill: 'backwards',
        },
      )
    }
  }, [rootRef, key, enabled, moveMs, landMs])

  return useCallback(() => {
    const root = rootRef.current
    if (!root) {
      return
    }
    const rects = new Map<string, DOMRect>()
    for (const node of root.querySelectorAll<HTMLElement>('[data-flip]')) {
      rects.set(node.dataset.flip ?? '', node.getBoundingClientRect())
    }
    before.current = rects
  }, [rootRef])
}
