import { Constants } from '../../constants'

export type Point = { x: number; y: number }

export type Shape =
  | { kind: 'rect'; x: number; y: number; w: number; h: number }
  | { kind: 'line'; from: Point; to: Point }
  | { kind: 'free'; points: Point[] }
  | { kind: 'text'; at: Point; text: string }

export type SketchTool = 'rect' | 'line' | 'free' | 'text'

/** A shape while it is being dragged. Labels are placed on click, so they are never drafts. */
export type DraftShape = Extract<Shape, { kind: 'rect' | 'line' | 'free' }>

export type DrawParams = { ctx: CanvasRenderingContext2D; shapes: Shape[]; width: number; height: number }

const paint = (ctx: CanvasRenderingContext2D, shape: Shape) => {
  if (shape.kind === 'rect') {
    ctx.strokeRect(shape.x, shape.y, shape.w, shape.h)
  } else if (shape.kind === 'line') {
    ctx.beginPath()
    ctx.moveTo(shape.from.x, shape.from.y)
    ctx.lineTo(shape.to.x, shape.to.y)
    ctx.stroke()
  } else if (shape.kind === 'free') {
    ctx.beginPath()
    shape.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
    ctx.stroke()
  } else {
    ctx.font = '14px ui-monospace, Menlo, monospace'
    ctx.fillText(shape.text, shape.at.x, shape.at.y)
  }
}

/** Repaint the whole pad. The grid is there so a rough rectangle still reads as "about this big". */
export const drawShapes = ({ ctx, shapes, width, height }: DrawParams) => {
  ctx.clearRect(0, 0, width, height)
  ctx.strokeStyle = 'rgba(128,128,128,.18)'
  ctx.lineWidth = 1
  for (let x = Constants.SKETCH_GRID_PX; x < width; x += Constants.SKETCH_GRID_PX) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = Constants.SKETCH_GRID_PX; y < height; y += Constants.SKETCH_GRID_PX) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  ctx.strokeStyle = Constants.SKETCH_COLOR
  ctx.fillStyle = Constants.SKETCH_COLOR
  ctx.lineWidth = 2
  shapes.forEach((shape) => paint(ctx, shape))
}

/** Rectangles dragged up or left come out with negative extents; store them normalised. */
export const normaliseRect = (shape: Shape): Shape => {
  if (shape.kind !== 'rect') return shape
  const x = shape.w < 0 ? shape.x + shape.w : shape.x
  const y = shape.h < 0 ? shape.y + shape.h : shape.y
  return { kind: 'rect', x, y, w: Math.abs(shape.w), h: Math.abs(shape.h) }
}

export const isTooSmall = (shape: Shape): boolean =>
  shape.kind === 'rect' &&
  Math.abs(shape.w) < Constants.SKETCH_MIN_DRAG_PX &&
  Math.abs(shape.h) < Constants.SKETCH_MIN_DRAG_PX

const escapeXml = (text: string) => text.replace(/[<&>]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' })[c] ?? c)

export type ToSvgParams = { shapes: Shape[]; width: number; height: number }

/**
 * Export as SVG rather than a bitmap, so the assistant reads coordinates and labels as text
 * instead of guessing at pixels.
 */
export const shapesToSvg = ({ shapes, width, height }: ToSvgParams): string => {
  if (!shapes.length) return ''
  const stroke = `fill="none" stroke="${Constants.SKETCH_COLOR}" stroke-width="2"`
  const body = shapes
    .map((shape) => {
      if (shape.kind === 'rect') return `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" ${stroke}/>`
      if (shape.kind === 'line') return `<line x1="${shape.from.x}" y1="${shape.from.y}" x2="${shape.to.x}" y2="${shape.to.y}" ${stroke}/>`
      if (shape.kind === 'free') return `<polyline points="${shape.points.map((p) => `${p.x},${p.y}`).join(' ')}" ${stroke}/>`
      return `<text x="${shape.at.x}" y="${shape.at.y}" fill="${Constants.SKETCH_COLOR}" font-family="monospace" font-size="14">${escapeXml(shape.text)}</text>`
    })
    .join('\n  ')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n  ${body}\n</svg>`
}
