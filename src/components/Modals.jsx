import { useState } from 'react'
import { CloseIcon } from './icons'

function Overlay({ children, onClose }) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

export function PromptModal({ title, label, initial = '', multiline = false, submitText = 'Save', onCancel, onSubmit }) {
  const [value, setValue] = useState(initial)
  const submit = () => onSubmit(value.trim())

  return (
    <Overlay onClose={onCancel}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <button type="button" onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
      <label className="label">{label}</label>
      {multiline ? (
        <textarea
          className="input min-h-[100px]"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write a note…"
        />
      ) : (
        <input
          className="input"
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
        />
      )}
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={onCancel} className="btn-outline flex-1">Cancel</button>
        <button type="button" onClick={submit} disabled={!value} className="btn-primary flex-1">{submitText}</button>
      </div>
    </Overlay>
  )
}

export function InfoModal({ title, onClose, children }) {
  return (
    <Overlay onClose={onClose}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>
      {children}
    </Overlay>
  )
}