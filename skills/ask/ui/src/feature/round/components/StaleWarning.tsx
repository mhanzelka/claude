type StaleWarningProps = { documentId: string }

export const StaleWarning = ({ documentId }: StaleWarningProps) => (
  <p className="mb-2.5 rounded-lg border border-warn px-3 py-2 text-[13px] text-warn">
    This answer is already written into <b>{documentId}</b>. Changing it means that gets rewritten.
  </p>
)
