import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

interface DatePickerProps {
  value: string
  min?: string
  max: string
  onChange: (value: string) => void
  ariaLabel: string
}

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

function parseDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function dateValue(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function displayDate(value: string) {
  const date = parseDate(value)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

export function DatePicker({ value, min, max, onChange, ariaLabel }: DatePickerProps) {
  const selectedDate = parseDate(value)
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dialogId = useId()
  const todayValue = dateValue(new Date())
  const minMonth = min?.slice(0, 7)
  const maxMonth = max.slice(0, 7)
  const viewMonthValue = dateValue(viewMonth).slice(0, 7)

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1)
    const gridStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1 - firstDay.getDay())
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
      return { date, value: dateValue(date), outside: date.getMonth() !== viewMonth.getMonth() }
    })
  }, [viewMonth])

  useEffect(() => {
    if (!open) return
    function closeOnOutsideClick(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', closeOnOutsideClick)
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick)
  }, [open])

  function toggle() {
    if (!open) setViewMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1))
    setOpen((current) => !current)
  }

  function select(nextValue: string) {
    onChange(nextValue)
    setOpen(false)
    triggerRef.current?.focus()
  }

  function closeOnEscape(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Escape' || !open) return
    event.preventDefault()
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div
      ref={rootRef}
      className="date-picker"
      onKeyDown={closeOnEscape}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className="select-trigger date-trigger"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
        onClick={toggle}
      >
        <CalendarDays className="date-trigger-icon" size={18} />
        <span className="date-value">{displayDate(value)}</span>
        <ChevronDown className={open ? 'select-chevron open' : 'select-chevron'} size={17} />
      </button>
      {open && (
        <div id={dialogId} className="date-menu" role="dialog" aria-label={ariaLabel}>
          <div className="date-menu-header">
            <button type="button" aria-label="上一个月" disabled={minMonth !== undefined && viewMonthValue <= minMonth} onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))}><ChevronLeft size={18} /></button>
            <strong>{viewMonth.getFullYear()}年 {viewMonth.getMonth() + 1}月</strong>
            <button type="button" aria-label="下一个月" disabled={viewMonthValue >= maxMonth} onClick={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}><ChevronRight size={18} /></button>
          </div>
          <div className="date-weekdays" aria-hidden="true">
            {weekDays.map((day) => <span key={day}>{day}</span>)}
          </div>
          <div className="date-grid">
            {calendarDays.map((day) => (
              <button
                key={day.value}
                type="button"
                className={`${day.outside ? 'outside ' : ''}${day.value === todayValue ? 'today ' : ''}${day.value === value ? 'selected' : ''}`.trim()}
                disabled={day.value > max || (min !== undefined && day.value < min)}
                aria-label={displayDate(day.value)}
                aria-current={day.value === todayValue ? 'date' : undefined}
                onClick={() => select(day.value)}
              >
                {day.date.getDate()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
