import type { RouteLocationNormalizedLoaded, RouteLocationRaw } from 'vue-router'

export class NodeOrPod {
  readonly name: string
  readonly type: 'node' | 'pod'

  constructor(name: string, type: 'node' | 'pod') {
    this.name = name
    this.type = type
  }

  getRoute(route: RouteLocationNormalizedLoaded): RouteLocationRaw {
    return {
      name: route.name,
      query: this.type === 'node' ? { ...route.query,  node: this.name } : { ...route.query, pod: this.name }
    }
  }
}
