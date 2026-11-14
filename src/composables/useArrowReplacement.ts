const replacements: Record<string, string> = {
  '-->': '→',
  '<--': '←',
  '==>': '⇒'
}

function onInput(e: Event) {
  const el = e.target
  if (!(el instanceof HTMLTextAreaElement)) return

  const ev = e as InputEvent
  // Only react to typing, not to undo/redo, paste, IME composition, etc.
  if (ev.isComposing || ev.inputType !== 'insertText') return

  const pos = el.selectionStart
  const before = el.value.slice(0, pos)

  for (const [from, to] of Object.entries(replacements)) {
    if (!before.endsWith(from)) continue

    /**
     * execCommand is deprecated, but it’s still supported in every major browser (Firefox since v89) and it’s the only way to insert text while keeping the undo history.
     * There’s no replacement for this use case yet
     */
    // Select the typed sequence, then replace it as a native edit
    el.setSelectionRange(pos - from.length, pos)
    document.execCommand('insertText', false, to)

    break
  }
}

export function useArrowReplacement() {
  document.addEventListener('input', onInput)
  return () => document.removeEventListener('input', onInput)
}
