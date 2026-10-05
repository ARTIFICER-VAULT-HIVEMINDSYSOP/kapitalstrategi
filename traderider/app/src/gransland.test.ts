import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { cases } from '../../spel/gransland/cases.js'

describe('granslandet', () => {
  for (const [name, fn] of cases) {
    it(name, async () => {
      await fn(assert)
    })
  }
})
