type ToastProps = { message: string | null }

export const Toast = ({ message }: ToastProps) => {
  if (!message) return null
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-[13px] text-bg shadow-lg">
      {message}
    </div>
  )
}
