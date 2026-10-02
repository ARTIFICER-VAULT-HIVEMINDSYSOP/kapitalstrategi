import test from 'node:test'
import assert from 'node:assert/strict'
import { scan } from './hardkod-scan.mjs'

test('hårdkodsgranskningen har inga omotiverade träffar', () => {
  const { unjustified, justified } = scan()
  assert.ok(justified.length >= 8)
  assert.deepEqual(unjustified, [])
})
