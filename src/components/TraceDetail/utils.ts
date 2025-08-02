import { TraceDetail } from '@/core/madison-addon-trace/core/trace'

/**
 *
 * @param duration 微秒
 * @returns
 */
export function getDuration(duration: number) {
  const ms = duration / 1000
  if (ms < 1) return Number(duration.toFixed(2)) + 'μs'
  return Number(ms.toFixed(2)) + 'ms'
}

export function getDetails(span: TraceDetail): TraceDetail[] {
  const list: TraceDetail[] = [span]
  span.children.forEach((child) => {
    list.push(...getDetails(child))
  })
  return list
}

export function getDepth(span: TraceDetail): number {
  let depth = 0
  span.children.forEach((child) => {
    const childDepth = getDepth(child)
    if (childDepth > depth) {
      depth = childDepth
    }
  })
  return depth + 1
}

export function getServices(details: TraceDetail[]): Set<string> {
  const servicesSet: Set<string> = new Set()
  details.forEach((d) => {
    servicesSet.add(d.cmdbId)
  })
  return servicesSet
}

export function getColor(servicesSet: Set<string>, service: string) {
  const colors = [
    '#4fadff',
    '#f97316',
    '#84cc16',
    '#10b981',
    '#06b6d4',
    '#6366f1',
    '#a855f7',
    '#ec4899',
    '#f43f5e'
  ]
  const serviceIndex = Array.from(servicesSet).indexOf(service)
  return colors[serviceIndex % colors.length]
}
