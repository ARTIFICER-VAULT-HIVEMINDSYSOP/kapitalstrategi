import { boot } from '../demo/boot'
import { DemoShell } from '../demo/DemoFrame'
import { RaketSpel } from '../modes/RaketSpel'

boot((candles) => (
  <DemoShell mode="raket" candles={candles} intro={false}>
    <RaketSpel candles={candles} />
  </DemoShell>
))
