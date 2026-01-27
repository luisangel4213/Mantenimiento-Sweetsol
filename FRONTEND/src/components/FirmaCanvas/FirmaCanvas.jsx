import { useRef, useState, useCallback, useEffect } from 'react'
import './FirmaCanvas.css'

export const FirmaCanvas = ({ onChange, width = 400, height = 180 }) => {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#111'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPoint = useCallback((e) => {
    const cv = canvasRef.current
    if (!cv) return { x: 0, y: 0 }
    const rect = cv.getBoundingClientRect()
    const scaleX = cv.width / rect.width
    const scaleY = cv.height / rect.height
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [])

  const start = useCallback(
    (e) => {
      e.preventDefault?.()
      setDrawing(true)
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) return
      const { x, y } = getPoint(e)
      ctx.beginPath()
      ctx.moveTo(x, y)
    },
    [getPoint]
  )

  const move = useCallback(
    (e) => {
      e.preventDefault?.()
      if (!drawing) return
      const ctx = canvasRef.current?.getContext('2d')
      if (!ctx) return
      const { x, y } = getPoint(e)
      ctx.lineTo(x, y)
      ctx.stroke()
    },
    [drawing, getPoint]
  )

  const end = useCallback(() => {
    setDrawing(false)
    const cv = canvasRef.current
    if (cv) onChange?.(cv.toDataURL('image/png'))
  }, [onChange])

  const limpiar = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    onChange?.(null)
  }, [onChange])

  return (
    <div className="firma-canvas">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="firma-canvas__el"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <button type="button" className="firma-canvas__btn" onClick={limpiar}>
        Limpiar firma
      </button>
    </div>
  )
}
