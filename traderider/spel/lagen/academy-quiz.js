/**
 * One lesson sequence for Trade Rider Academy.
 * Numeric n stays aligned with the practice tasks in akademin-logic.js.
 */
export const ACADEMY_LESSONS = [
  {
    id: 'risk-size',
    n: 1,
    quiz: [
      {
        id: 'l1-order',
        prompt: 'quiz.l1.order.q',
        answer: 'road',
        choices: [
          { id: 'road', label: 'quiz.l1.order.road' },
          { id: 'speed', label: 'quiz.l1.order.speed' },
          { id: 'gain', label: 'quiz.l1.order.gain' },
        ],
      },
      {
        id: 'l1-cap',
        prompt: 'quiz.l1.cap.q',
        answer: 'low',
        choices: [
          { id: 'low', label: 'quiz.l1.cap.low' },
          { id: 'half', label: 'quiz.l1.cap.half' },
          { id: 'all', label: 'quiz.l1.cap.all' },
        ],
      },
      {
        id: 'l1-share',
        prompt: 'quiz.l1.share.q',
        answer: 'dist',
        choices: [
          { id: 'dist', label: 'quiz.l1.share.dist' },
          { id: 'price', label: 'quiz.l1.share.price' },
          { id: 'feel', label: 'quiz.l1.share.feel' },
        ],
      },
      {
        id: 'l1-size',
        prompt: 'quiz.l1.size.q',
        answer: 'div',
        choices: [
          { id: 'div', label: 'quiz.l1.size.div' },
          { id: 'lessons', label: 'quiz.l1.size.lessons' },
          { id: 'mid', label: 'quiz.l1.size.mid' },
        ],
      },
    ],
  },
  {
    id: 'stop-target',
    n: 2,
    quiz: [
      {
        id: 'l2-when',
        prompt: 'quiz.l2.when.q',
        answer: 'before',
        choices: [
          { id: 'before', label: 'quiz.l2.when.before' },
          { id: 'feel', label: 'quiz.l2.when.feel' },
          { id: 'after', label: 'quiz.l2.when.after' },
        ],
      },
      {
        id: 'l2-stop',
        prompt: 'quiz.l2.stop.q',
        answer: 'close',
        choices: [
          { id: 'close', label: 'quiz.l2.stop.close' },
          { id: 'home', label: 'quiz.l2.stop.home' },
          { id: 'erase', label: 'quiz.l2.stop.erase' },
        ],
      },
      {
        id: 'l2-tp',
        prompt: 'quiz.l2.tp.q',
        answer: 'home',
        choices: [
          { id: 'home', label: 'quiz.l2.tp.home' },
          { id: 'band', label: 'quiz.l2.tp.band' },
          { id: 'same', label: 'quiz.l2.tp.same' },
        ],
      },
      {
        id: 'l2-r',
        prompt: 'quiz.l2.r.q',
        answer: 'twice',
        choices: [
          { id: 'twice', label: 'quiz.l2.r.twice' },
          { id: 'stop', label: 'quiz.l2.r.stop' },
          { id: 'same', label: 'quiz.l2.r.same' },
        ],
      },
    ],
  },
  {
    id: 'bollinger',
    n: 3,
    quiz: [
      {
        id: 'l3-build',
        prompt: 'quiz.l3.build.q',
        answer: 'std',
        choices: [
          { id: 'std', label: 'quiz.l3.build.std' },
          { id: 'rsi', label: 'quiz.l3.build.rsi' },
          { id: 'one', label: 'quiz.l3.build.one' },
        ],
      },
      {
        id: 'l3-mid',
        prompt: 'quiz.l3.mid.q',
        answer: 'ma',
        choices: [
          { id: 'ma', label: 'quiz.l3.mid.ma' },
          { id: 'rsi', label: 'quiz.l3.mid.rsi' },
          { id: 'stop', label: 'quiz.l3.mid.stop' },
        ],
      },
      {
        id: 'l3-far',
        prompt: 'quiz.l3.far.q',
        answer: 'far',
        choices: [
          { id: 'far', label: 'quiz.l3.far.far' },
          { id: 'way', label: 'quiz.l3.far.way' },
          { id: 'share', label: 'quiz.l3.far.share' },
        ],
      },
      {
        id: 'l3-squeeze',
        prompt: 'quiz.l3.squeeze.q',
        answer: 'calm',
        choices: [
          { id: 'calm', label: 'quiz.l3.squeeze.calm' },
          { id: 'up', label: 'quiz.l3.squeeze.up' },
          { id: 'down', label: 'quiz.l3.squeeze.down' },
        ],
      },
    ],
  },
  {
    id: 'rsi',
    n: 4,
    quiz: [
      {
        id: 'l4-scale',
        prompt: 'quiz.l4.scale.q',
        answer: 'strength',
        choices: [
          { id: 'strength', label: 'quiz.l4.scale.strength' },
          { id: 'width', label: 'quiz.l4.scale.width' },
          { id: 'dist', label: 'quiz.l4.scale.dist' },
        ],
      },
      {
        id: 'l4-zone',
        prompt: 'quiz.l4.zone.q',
        answer: 'names',
        choices: [
          { id: 'names', label: 'quiz.l4.zone.names' },
          { id: 'swap', label: 'quiz.l4.zone.swap' },
          { id: 'squeeze', label: 'quiz.l4.zone.squeeze' },
        ],
      },
      {
        id: 'l4-alone',
        prompt: 'quiz.l4.alone.q',
        answer: 'no',
        choices: [
          { id: 'no', label: 'quiz.l4.alone.no' },
          { id: 'yes', label: 'quiz.l4.alone.yes' },
          { id: 'mid', label: 'quiz.l4.alone.mid' },
        ],
      },
      {
        id: 'l4-stretch',
        prompt: 'quiz.l4.stretch.q',
        answer: 'rail',
        choices: [
          { id: 'rail', label: 'quiz.l4.stretch.rail' },
          { id: 'mid', label: 'quiz.l4.stretch.mid' },
          { id: 'stop', label: 'quiz.l4.stretch.stop' },
        ],
      },
    ],
  },
]

export function lessonQuiz(n) {
  return ACADEMY_LESSONS.find((lesson) => lesson.n === n) || null
}

export function quizComplete(picks, n) {
  const spec = lessonQuiz(n)
  if (!spec) return false
  return spec.quiz.every((q) => picks?.[q.id] === q.answer)
}

export function duplicateLessonIds(lessons = ACADEMY_LESSONS) {
  const ids = lessons.map((lesson) => lesson.id)
  return ids.filter((id, index) => ids.indexOf(id) !== index)
}
