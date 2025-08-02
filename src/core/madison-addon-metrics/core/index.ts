import type { Madison } from '@/core/madison/core'
import { MadisonAddon } from '@/core/madison/core/addon-base'
import { Machine } from './machine'

export class Metrics extends MadisonAddon {
  machine: Machine

  constructor(madison: Madison) {
    super(madison)

    this.machine = new Machine(madison)
  }
  logoutCallback(): void {}
}
