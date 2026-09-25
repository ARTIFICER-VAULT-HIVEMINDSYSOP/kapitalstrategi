import { boot } from '../demo/boot'
import { DemoShell } from '../demo/DemoFrame'
import { RiderDesk } from '../demo/RiderDesk'

boot((candles) => (
  <DemoShell mode="tag" candles={candles}>
    <RiderDesk candles={candles} />
  </DemoShell>
))
