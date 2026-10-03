/**
 * Robban Robotsson i Akademin. Röst och frågor är fasta (aldrig slump).
 * Synlig text ligger i i18n. Här finns bara nycklar, ordning och innehållsvakt.
 */
import { STRINGS } from './i18n.js'

/** Före loppet, alltid i den här ordningen. */
export const PRE_RACE = [
  {
    id: 'q1',
    prompt: 'rb.q1',
    choices: [
      { id: 'road', label: 'rb.q1a', reply: 'rb.q1aReply' },
      { id: 'speed', label: 'rb.q1b', reply: 'rb.q1bReply' },
    ],
  },
  {
    id: 'q2',
    prompt: 'rb.q2',
    choices: [
      { id: 'risk', label: 'rb.q2a', reply: 'rb.q2aReply' },
      { id: 'fun', label: 'rb.q2b', reply: 'rb.q2bReply' },
    ],
  },
  {
    id: 'q3',
    prompt: 'rb.q3',
    choices: [
      { id: 'limit', label: 'rb.q3a', reply: 'rb.q3aReply' },
      { id: 'erase', label: 'rb.q3b', reply: 'rb.q3bReply' },
    ],
  },
]

export const LINE_KEYS = [
  'rb.hud',
  'rb.close',
  'rb.name',
  'rb.greet',
  'rb.choice.prerace',
  'rb.choice.stopp',
  'rb.choice.min',
  'rb.preraceTitle',
  'rb.preraceNote',
  'rb.q1',
  'rb.q1a',
  'rb.q1b',
  'rb.q1aReply',
  'rb.q1bReply',
  'rb.q2',
  'rb.q2a',
  'rb.q2b',
  'rb.q2aReply',
  'rb.q2bReply',
  'rb.q3',
  'rb.q3a',
  'rb.q3b',
  'rb.q3aReply',
  'rb.q3bReply',
  'rb.done',
  'rb.stopp',
  'rb.figure',
]

const BANNED = [
  /\borders?\b/i,
  /\binstruments?\b/i,
  /nivå/i,
  /\bniva(?:er)?\b/i,
  /\blevels?\b/i,
  /\bkonton?\b/i,
  /\baccounts?\b/i,
  /\bköp(?:a|er|t)?\b/i,
  /\bsälj(?:a|er|t)?\b/i,
  /\bbuy\b/i,
  /\bsell\b/i,
  /ÖB/,
  /\bpaper\b/i,
  /investeringsrådgivning/i,
  /інструмент/i,
  /\bордер/i,
  /рівень/i,
  /рахунок/i,
  /купити/i,
  /продати/i,
  /Källor/i,
  /\bSources\b/,
]

const UPSIDE = /vinst|uppgång|gain|rise|прибуток|зростання/i
const RISK = /risk|ризик/i

export function tableFor(lang) {
  const table = STRINGS[lang] || STRINGS.sv
  return table
}

export function preRaceQuestions(lang) {
  const table = tableFor(lang)
  return PRE_RACE.map((q) => ({
    id: q.id,
    prompt: table[q.prompt],
    choices: q.choices.map((c) => ({
      id: c.id,
      label: table[c.label],
      reply: table[c.reply],
    })),
  }))
}

export function spokenLines(lang) {
  const table = tableFor(lang)
  return LINE_KEYS.map((key) => {
    const line = table[key]
    if (!line) throw new Error(`saknar ${lang} ${key}`)
    return line
  })
}

function sentences(text) {
  return String(text)
    .split(/(?<=[.!?…])\s+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

/** Innehållsvakt för Robbans egna rader. */
export function guardLines(lines) {
  const banned = []
  const upsideWithoutRisk = []
  for (const line of lines) {
    for (const re of BANNED) {
      if (re.test(line)) banned.push(`${re.source}: ${line}`)
    }
    for (const sentence of sentences(line)) {
      if (UPSIDE.test(sentence) && !RISK.test(sentence)) upsideWithoutRisk.push(sentence)
    }
  }
  return { banned, upsideWithoutRisk }
}

export function createGuideState() {
  const answers = {}
  let open = false
  let topic = 'greet'
  return {
    isOpen: () => open,
    fullBody: () => open,
    topic: () => topic,
    answers: () => ({ ...answers }),
    open() {
      open = true
    },
    close() {
      open = false
    },
    toggle() {
      open = !open
    },
    ask(next) {
      topic = next === 'stopp' ? 'stopp' : next === 'greet' ? 'greet' : 'prerace'
      open = true
    },
    answer(qid, choiceId) {
      const q = PRE_RACE.find((item) => item.id === qid)
      if (!q || !q.choices.some((c) => c.id === choiceId)) return false
      answers[qid] = choiceId
      topic = 'prerace'
      return true
    },
  }
}

function lastReplyKey(state) {
  const picked = state.answers()
  let key = ''
  for (const q of PRE_RACE) {
    const choiceId = picked[q.id]
    if (!choiceId) break
    key = q.choices.find((c) => c.id === choiceId).reply
  }
  return key
}

/** Talbubbla och svarsknappar för öppet läge. */
export function speechView(state, lang) {
  const table = tableFor(lang)
  const topic = state.topic()
  if (topic === 'stopp') {
    return {
      say: table['rb.stopp'],
      choices: [{ id: 'prerace', label: table['rb.choice.prerace'], act: 'prerace' }],
    }
  }
  if (topic === 'prerace') {
    const pending = PRE_RACE.find((q) => !state.answers()[q.id])
    const replyKey = lastReplyKey(state)
    if (!pending) {
      const say = replyKey ? `${table[replyKey]} ${table['rb.done']}` : table['rb.done']
      return { say, choices: [] }
    }
    const say = replyKey ? `${table[replyKey]} ${table[pending.prompt]}` : table[pending.prompt]
    return {
      say,
      choices: pending.choices.map((c) => ({
        id: c.id,
        label: table[c.label],
        act: 'answer',
        qid: pending.id,
      })),
    }
  }
  return {
    say: table['rb.greet'],
    choices: [
      { id: 'prerace', label: table['rb.choice.prerace'], act: 'prerace' },
      { id: 'stopp', label: table['rb.choice.stopp'], act: 'stopp' },
    ],
  }
}
