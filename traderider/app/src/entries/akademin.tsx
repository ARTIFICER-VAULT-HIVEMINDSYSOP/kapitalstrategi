import { Academy } from '../modes/Academy'
import { boot } from '../demo/boot'
import { DemoShell } from '../demo/DemoFrame'

boot((candles) => (
  <DemoShell mode="akademin" candles={candles}>
    <Academy candles={candles} />
  </DemoShell>
))
