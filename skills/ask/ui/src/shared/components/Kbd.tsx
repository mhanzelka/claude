type KbdProps = { children: string }

export const Kbd = ({ children }: KbdProps) => (
  <kbd className="ml-1.5 rounded border border-line border-b-2 bg-panel px-1 py-px font-mono text-[10px] leading-4 text-dim">
    {children}
  </kbd>
)
