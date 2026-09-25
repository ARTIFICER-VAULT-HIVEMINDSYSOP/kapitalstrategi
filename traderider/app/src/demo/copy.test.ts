import { describe, expect, it } from 'vitest'
import { DISCLAIMER_SV, collectCopyStrings } from './copy'
import { statusStrings } from './statusText'

const BANNED = /\b(push|paper|rådgivare)\b/i

describe('demo copy', () => {
  it('keeps the Swedish practice line exact', () => {
    expect(DISCLAIMER_SV).toBe('Övningsläge med historiska kurser. Inga riktiga pengar. Ingen rådgivning.')
  })

  it('avoids banned words in visitor copy', () => {
    const text = [...collectCopyStrings(), ...statusStrings()]
    for (const line of text) {
      expect(line, line).not.toMatch(BANNED)
      expect(line).not.toMatch(/\bkr\b/i)
    }
  })
})
