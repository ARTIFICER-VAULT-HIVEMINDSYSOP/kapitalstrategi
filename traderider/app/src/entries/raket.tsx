import { boot } from '../demo/boot'
import { DemoShell } from '../demo/DemoFrame'
import { RocketDesk } from '../modes/RocketDesk'

boot((candles) => (
  <DemoShell mode="raket" candles={candles}>
    <RocketDesk candles={candles} label="" />
  </DemoShell>
))