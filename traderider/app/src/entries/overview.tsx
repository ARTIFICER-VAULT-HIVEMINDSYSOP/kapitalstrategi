import { boot } from '../demo/boot'
import { Overview } from '../demo/Overview'

boot((candles) => <Overview candles={candles} />)
