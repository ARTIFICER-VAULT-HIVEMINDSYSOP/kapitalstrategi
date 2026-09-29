/** Tangentschema för Raket-lägena. Samma KÖP/SÄLJ/hävstång som övriga Raket/Traderider-utkast. */
export type RaketCmd =
  | 'buy'
  | 'sell'
  | 'flat'
  | 'pause'
  | 'lev_up'
  | 'lev_down'
  | 'lev_1'
  | 'lev_2'
  | 'lev_3'
  | 'lev_4'
  | 'gas_up'
  | 'gas_down'
  | 'tp_out'
  | 'tp_in'
  | 'sl_out'
  | 'sl_in'
  | 'restart'

export function raketCmdFromKey(key: string): RaketCmd | null {
  switch (key) {
    case 'ArrowRight':
    case 'd':
    case 'D':
      return 'buy'
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return 'sell'
    case 'f':
    case 'F':
      return 'flat'
    case ' ':
    case 'Spacebar':
      return 'pause'
    case 'ArrowUp':
    case 'w':
    case 'W':
    case ']':
      return 'lev_up'
    case 'ArrowDown':
    case 's':
    case 'S':
    case '[':
      return 'lev_down'
    case '1':
    case '2':
    case '3':
    case '4':
      return `lev_${key}` as RaketCmd
    case 'e':
    case 'E':
      return 'gas_up'
    case 'q':
    case 'Q':
      return 'gas_down'
    case 't':
    case 'T':
      return 'tp_out'
    case 'g':
    case 'G':
      return 'tp_in'
    case 'y':
    case 'Y':
      return 'sl_out'
    case 'h':
    case 'H':
      return 'sl_in'
    case 'r':
    case 'R':
      return 'restart'
    default:
      return null
  }
}
