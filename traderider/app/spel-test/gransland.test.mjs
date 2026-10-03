import test from 'node:test'
import assert from 'node:assert/strict'
import { cases } from '../../spel/gransland/cases.js'

for (const [name, fn] of cases) {
  test(name, async () => {
    await fn(assert)
  })
}
