type ExplainNoteProps = { text: string }

export const ExplainNote = ({ text }: ExplainNoteProps) => (
  <div className="mb-2.5 rounded-r-lg border-l-[3px] border-accent bg-accent-soft px-3 py-2.5 text-sm whitespace-pre-wrap">
    <b className="mb-1.5 block text-xs font-semibold tracking-widest uppercase">explanation</b>
    {text}
  </div>
)
