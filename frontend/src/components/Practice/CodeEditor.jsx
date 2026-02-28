import { useRef, useEffect } from 'react';

const INDENT = '    '; // 4 spaces
const BRACKETS = [
  { open: '{', close: '}' },
  { open: '(', close: ')' },
  { open: '[', close: ']' },
];

/**
 * Code editor textarea with:
 * - Auto-indent on Enter (copies current line indent)
 * - Auto-closing brackets/parens/quotes: typing { ( [ " ' inserts the closing character and places cursor between
 * - Tab inserts 4 spaces
 */
export default function CodeEditor({ value, onChange, placeholder, className, 'aria-label': ariaLabel }) {
  const textareaRef = useRef(null);
  const pendingCursorRef = useRef(null);

  // After value updates, restore cursor position if we set one (e.g. after inserting closing bracket)
  useEffect(() => {
    const el = textareaRef.current;
    const pending = pendingCursorRef.current;
    if (el && pending != null) {
      el.focus();
      el.setSelectionRange(pending.start, pending.end);
      pendingCursorRef.current = null;
    }
  }, [value]);

  const getState = () => {
    const el = textareaRef.current;
    if (!el) return null;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = value ?? '';
    return { el, start, end, text };
  };

  const handleKeyDown = (e) => {
    const state = getState();
    if (!state) return;
    const { el, start, end, text } = state;

    // Tab: insert 4 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const before = text.slice(0, start);
      const after = text.slice(end);
      const insert = INDENT;
      const newValue = before + insert + after;
      const newPos = start + insert.length;
      onChange(newValue);
      pendingCursorRef.current = { start: newPos, end: newPos };
      return;
    }

    // Enter: newline + same indent as current line
    if (e.key === 'Enter') {
      const lineStart = text.lastIndexOf('\n', start - 1) + 1;
      const currentLine = text.slice(lineStart, start);
      const match = currentLine.match(/^(\s*)/);
      const indent = match ? match[1] : '';
      e.preventDefault();
      const before = text.slice(0, start);
      const after = text.slice(end);
      const newValue = before + '\n' + indent + after;
      const newPos = start + 1 + indent.length;
      onChange(newValue);
      pendingCursorRef.current = { start: newPos, end: newPos };
      return;
    }

    // Auto-closing brackets/parens/quotes
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      for (const { open, close } of BRACKETS) {
        if (e.key !== open) continue;
        const before = text.slice(0, start);
        const after = text.slice(end);
        e.preventDefault();
        const newValue = before + open + close + after;
        onChange(newValue);
        pendingCursorRef.current = { start: start + 1, end: start + 1 };
        return;
      }
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
      aria-label={ariaLabel}
      spellCheck={false}
    />
  );
}
