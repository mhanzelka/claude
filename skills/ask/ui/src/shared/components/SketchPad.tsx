import { useEffect, useRef, useState } from 'react'
import { Eraser, Minus, PenLine, Square, Tag, Undo2 } from 'lucide-react'
import clsx from 'clsx'
import {
  drawShapes,
  isTooSmall,
  normaliseRect,
  shapesToSvg,
  type DraftShape,
  type Point,
  type Shape,
  type SketchTool,
} from '../lib/sketch'

export type SketchPadProps = {
  /** Changing this clears the pad, so a drawing never bleeds between questions. */
  scopeKey: string
  onChange: (svg: string) => void
  onAskLabel: () => Promise<string | null>
}

const TOOLS: { tool: SketchTool; label: string; Icon: typeof Square }[] = [
  { tool: 'rect', label: 'box', Icon: Square },
  { tool: 'line', label: 'line', Icon: Minus },
  { tool: 'free', label: 'free', Icon: PenLine },
  { tool: 'text', label: 'label', Icon: Tag },
]

export const SketchPad = ({ scopeKey, onChange, onAskLabel }: SketchPadProps) => {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<SketchTool>('rect')
  const [shapes, setShapes] = useState<Shape[]>([])
  const [draft, setDraft] = useState<DraftShape | null>(null)

  useEffect(() => {
    setShapes([])
    setDraft(null)
  }, [scopeKey])

  useEffect(() => {
    const element = canvas.current
    const ctx = element?.getContext('2d')
    if (!element || !ctx) return
    const box = element.getBoundingClientRect()
    element.width = Math.max(320, Math.round(box.width))
    element.height = Math.max(200, Math.round(box.height))
    drawShapes({
      ctx,
      shapes: draft ? [...shapes, draft] : shapes,
      width: element.width,
      height: element.height,
    })
  }, [shapes, draft])

  const commit = (next: Shape[]) => {
    setShapes(next)
    const element = canvas.current
    if (element) onChange(shapesToSvg({ shapes: next, width: element.width, height: element.height }))
  }

  const at = (event: React.PointerEvent<HTMLCanvasElement>): Point => {
    const box = event.currentTarget.getBoundingClientRect()
    return { x: Math.round(event.clientX - box.left), y: Math.round(event.clientY - box.top) }
  }

  const onDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = at(event)
    if (tool === 'text') {
      void onAskLabel().then((text) => {
        if (text) commit([...shapes, { kind: 'text', at: point, text }])
      })
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDraft(
      tool === 'rect'
        ? { kind: 'rect', x: point.x, y: point.y, w: 0, h: 0 }
        : tool === 'line'
          ? { kind: 'line', from: point, to: point }
          : { kind: 'free', points: [point] },
    )
  }

  const onMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draft) return
    const point = at(event)
    setDraft(
      draft.kind === 'rect'
        ? { ...draft, w: point.x - draft.x, h: point.y - draft.y }
        : draft.kind === 'line'
          ? { ...draft, to: point }
          : { kind: 'free', points: [...draft.points, point] },
    )
  }

  const onUp = () => {
    if (!draft) return
    const finished = draft
    setDraft(null)
    if (isTooSmall(finished)) return
    commit([...shapes, normaliseRect(finished)])
  }

  return (
    <div className="rounded-lg border border-line bg-bg p-2">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {TOOLS.map(({ tool: value, label, Icon }) => (
          <button
            key={value}
            data-selected={tool === value}
            onClick={() => setTool(value)}
            className={clsx(
              'flex items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1 text-[13px]',
              'hover:border-accent selected:border-accent selected:bg-accent-soft',
            )}
          >
            <Icon size={13} aria-hidden />
            {label}
          </button>
        ))}
        <span className="flex-1" />
        <button
          onClick={() => commit(shapes.slice(0, -1))}
          className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-[13px] text-dim hover:border-accent"
        >
          <Undo2 size={13} aria-hidden />
          undo
        </button>
        <button
          onClick={() => commit([])}
          className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1 text-[13px] text-dim hover:border-accent"
        >
          <Eraser size={13} aria-hidden />
          clear
        </button>
      </div>
      <canvas
        ref={canvas}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        className="block h-[250px] w-full touch-none cursor-crosshair rounded-md border border-line bg-panel"
      />
    </div>
  )
}
