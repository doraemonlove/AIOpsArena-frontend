import { MadisonAddon } from '@/core/madison/core/addon-base'
import type { Madison } from '@/core/madison/core'
import { Pod } from './pod'
import { Node } from './node'

export class Machine extends MadisonAddon {
  readonly pod: Pod
  readonly node: Node

  constructor(madison: Madison) {
    super(madison)

    this.pod = new Pod(madison)
    this.node = new Node(madison)
  }

  logoutCallback(): void {}
}
