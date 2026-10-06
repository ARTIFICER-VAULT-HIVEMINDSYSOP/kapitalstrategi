/**
 * Trade Rider Academy shares the academy view in akademin.js.
 * #tra, #academy, #akademin and #trade-rider-academy open that view.
 */
export function createTradeRiderAcademy() {
  return {
    show() {},
    hide() {},
    step() {},
    state: () => ({ phase: 'merged', playing: false, clock: 0 }),
  }
}
