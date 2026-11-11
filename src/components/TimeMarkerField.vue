<script setup lang="ts">
/**
 * Edits an optional TimeMarker.
 *
 * v-model is `TimeMarker | undefined`:
 *  - undefined while the form is incomplete / inconsistent
 *  - a complete TimeMarker otherwise
 *
 * The parent decides whether the component is shown (e.g. with a "this answer is a date" checkbox).
 */
import { computed, ref, watch } from 'vue'

import {
  type Precision,
  sortKey,
  type TimeMarker,
  type TimePoint,
  toReadableTimeMarker
} from '../models/timeMarker'

/* ---------- Draft (form state) ---------- */

interface PointDraft {
  year: number | string | null // displayed year (or century number), >= 1
  month: number | null
  day: number | string | null
  bce: boolean
}

interface TimeDraft {
  precision: Precision
  isRange: boolean
  approximate: boolean
  start: PointDraft
  end: PointDraft
}

const MONTH_NAMES = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre'
]
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const emptyPoint = (): PointDraft => ({ year: null, month: null, day: null, bce: false })

const newDraft = (): TimeDraft => ({
  precision: 'year',
  isRange: false,
  approximate: false,
  start: emptyPoint(),
  end: emptyPoint()
})

/* ---------- Draft <-> TimeMarker ---------- */

/** Displayed year + era -> astronomical year (1 av. J.-C. = 0) */
const toAstro = (year: number, bce: boolean) => (bce ? 1 - year : year)

const buildPoint = (p: PointDraft, precision: Precision): TimePoint | null => {
  const year = Number(p.year)
  if (!Number.isInteger(year) || year < 1) return null
  const point: TimePoint = { year: toAstro(year, p.bce) }

  if (precision === 'month' || precision === 'day') {
    if (!p.month) return null
    point.month = p.month
  }
  if (precision === 'day') {
    const day = Number(p.day)
    if (!Number.isInteger(day) || day < 1 || day > DAYS_IN_MONTH[p.month! - 1]) return null
    point.day = day
  }
  return point
}

/** Returns null while the draft is incomplete or inconsistent */
const buildMarker = (d: TimeDraft): TimeMarker | null => {
  let start: TimePoint | null
  let end: TimePoint | null | undefined

  if (d.precision === 'century') {
    const n = Number(d.start.year)
    if (!Number.isInteger(n) || n < 1) return null
    const first = d.start.bce ? n * 100 : (n - 1) * 100 + 1
    const last = d.start.bce ? (n - 1) * 100 + 1 : n * 100
    start = { year: toAstro(first, d.start.bce) }
    end = { year: toAstro(last, d.start.bce) }
  } else {
    start = buildPoint(d.start, d.precision)
    end = d.isRange ? buildPoint(d.end, d.precision) : undefined
  }

  if (!start || end === null) return null
  if (end && sortKey(end) < sortKey(start)) return null

  const marker: TimeMarker = { start, precision: d.precision, sortKey: sortKey(start) }
  if (end) marker.end = end
  if (d.approximate) marker.approximate = true
  return marker
}

const pointToDraft = (p: TimePoint): PointDraft => {
  const bce = p.year <= 0
  return { year: bce ? 1 - p.year : p.year, month: p.month ?? null, day: p.day ?? null, bce }
}

const draftFromMarker = (m: TimeMarker): TimeDraft => {
  if (m.precision === 'century') {
    const bce = m.start.year <= 0
    const n = bce ? Math.ceil((1 - m.start.year) / 100) : Math.ceil(m.start.year / 100)
    return {
      precision: 'century',
      isRange: false,
      approximate: !!m.approximate,
      start: { ...emptyPoint(), year: n, bce },
      end: emptyPoint()
    }
  }
  return {
    precision: m.precision,
    isRange: !!m.end,
    approximate: !!m.approximate,
    start: pointToDraft(m.start),
    end: m.end ? pointToDraft(m.end) : emptyPoint()
  }
}

/* ---------- Component state ---------- */

const model = defineModel<TimeMarker | undefined>()

const draft = ref<TimeDraft>(model.value ? draftFromMarker(model.value) : newDraft())

/** The marker described by the current form state (null if incomplete) */
const marker = computed(() => buildMarker(draft.value))
const readable = computed(() => (marker.value ? toReadableTimeMarker(marker.value) : ''))

const pointKeys = (d: TimeDraft): ('start' | 'end')[] =>
  d.isRange && d.precision !== 'century' ? ['start', 'end'] : ['start']

const pointLabel = (d: TimeDraft, key: 'start' | 'end') =>
  d.precision === 'century' ? 'Siècle' : d.isRange ? (key === 'start' ? 'Début' : 'Fin') : 'Date'

/* ---------- Sync ---------- */

// form -> v-model
watch(marker, (m) => {
  const next = m ?? undefined
  if (JSON.stringify(next) !== JSON.stringify(model.value)) model.value = next
})

// v-model -> form (external change only; our own writes are recognised and skipped)
watch(model, (value) => {
  if (!value) return // the form keeps its draft while it is incomplete
  if (JSON.stringify(value) === JSON.stringify(marker.value)) return
  draft.value = draftFromMarker(value)
})
</script>

<template>
  <div class="time-editor">
    <div class="time-preview" aria-live="polite">
      <span v-if="readable" class="time-preview-value">{{ readable }}</span>
      <span v-else class="time-preview-empty">—</span>
    </div>
    <div class="time-fields">
      <div class="time-row">
        <select v-model="draft.precision" aria-label="Précision">
          <option value="day">Jour précis</option>
          <option value="month">Mois</option>
          <option value="year">Année</option>
          <option value="century">Siècle</option>
        </select>

        <label v-if="draft.precision !== 'century'" class="checkbox-label">
          <input v-model="draft.isRange" type="checkbox" /> Période
        </label>
        <label class="checkbox-label">
          <input v-model="draft.approximate" type="checkbox" /> Approximatif (« vers »)
        </label>
      </div>

      <div v-for="key in pointKeys(draft)" :key="key" class="time-row">
        <span class="time-label">{{ pointLabel(draft, key) }}</span>

        <input
          v-if="draft.precision === 'day'"
          v-model.number="draft[key].day"
          type="number"
          min="1"
          max="31"
          placeholder="Jour"
          aria-label="Jour"
        />
        <select
          v-if="draft.precision === 'day' || draft.precision === 'month'"
          v-model="draft[key].month"
          aria-label="Mois"
        >
          <option :value="null">Mois</option>
          <option v-for="(name, i) in MONTH_NAMES" :key="name" :value="i + 1">{{ name }}</option>
        </select>
        <input
          v-model.number="draft[key].year"
          class="year-input"
          type="number"
          min="1"
          :placeholder="draft.precision === 'century' ? 'Siècle (ex. 9)' : 'Année'"
          :aria-label="draft.precision === 'century' ? 'Siècle' : 'Année'"
        />
        <select v-model="draft[key].bce" aria-label="Ère">
          <option :value="false">ap. J.-C.</option>
          <option :value="true">av. J.-C.</option>
        </select>
      </div>

      <p v-if="!marker" class="time-hint">
        Complétez la date pour qu'elle soit enregistrée avec la carte.
      </p>
    </div>
  </div>
</template>

<style scoped>
.checkbox-label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #45413d;
  font-size: 14px;
  cursor: pointer;
}

input[type='checkbox'] {
  margin: 0;
  accent-color: #b05a36;
}

input[type='number'],
select {
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid #ded4c7;
  border-radius: 8px;
  background-color: #fffdf8;
  color: #2a2b2f;
  font-family: Georgia, 'Times New Roman', Times, serif;
  font-size: 15px;
  line-height: 1.5;
}

input[type='number'] {
  width: 96px;
}

input.year-input {
  width: 130px;
}

input[type='number']:focus,
select:focus {
  border-color: #b05a36;
  background-color: #ffffff;
  box-shadow: 0 0 0 3px rgb(176 90 54 / 12%);
  outline: none;
}

.time-editor {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px;
  border: 1px solid #eee5da;
  border-radius: 8px;
  background-color: #faf5ed;
}

.time-fields {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 12px;
}

.time-preview {
  display: flex;
  flex: 0 1 220px;
  flex-direction: column;
  gap: 4px;
  align-self: stretch;
  justify-content: center;
  padding-right: 16px;
  border-right: 1px solid #eee5da;
  text-align: left;
}

.time-preview-value {
  color: #2a2b2f;
  font-size: 16px;
  font-style: italic;
}

.time-preview-empty {
  color: #a79d90;
  font-size: 16px;
}
.time-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.time-label {
  min-width: 52px;
  color: #8f4a2e;
  font-size: 13px;
  font-weight: bold;
}

.time-hint {
  margin: 0;
  color: #a64d3c;
  font-size: 12px;
}
</style>
