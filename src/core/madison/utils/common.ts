export function parseTimeToSeconds(input: string): number {
  const timeUnits: Record<string, number> = {
    y: 365 * 24 * 60 * 60,
    w: 7 * 24 * 60 * 60,
    d: 24 * 60 * 60,
    h: 60 * 60,
    m: 60,
    s: 1
  }

  const order = ['y', 'w', 'd', 'h', 'm', 's']
  let lastUnitIndex = -1
  const regex = /(\d+)([ywdhms])/g
  let match: RegExpExecArray | null
  let totalSeconds = 0
  const set = new Set<string>()

  while ((match = regex.exec(input)) !== null) {
    const number = match[1]
    const unit = match[2]
    const num = parseInt(number, 10)

    if (!(unit in timeUnits) || Number.isNaN(num)) {
      return -1
    }

    if (set.has(unit)) return -1
    set.add(unit)

    const currentUnitIndex = order.indexOf(unit)
    if (currentUnitIndex < lastUnitIndex) {
      return -1
    }
    lastUnitIndex = currentUnitIndex
    totalSeconds += num * timeUnits[unit]
  }

  if (input.replace(regex, '') !== '') {
    return -1
  }

  return totalSeconds
}

export function getDatesForNextSevenDays(startDate: Date): Date[] {
  const dates: Date[] = []
  let currentDate = new Date(startDate)

  for (let i = 0; i < 7; i++) {
    dates.push(new Date(currentDate))
    currentDate = new Date(currentDate.setDate(currentDate.getDate() + 1))
  }

  return dates
}

export abstract class MadisonMapItem<K> {
  abstract rGet(key: K): void
  abstract rSet(key: K): void
  abstract rDelete(key: K): void
}

export abstract class MadisonMap<K, V extends MadisonMapItem<K>> extends Map<K, V> {
  override get(key: K) {
    const v = super.get(key)
    if (v) v.rGet(key)
    return v
  }

  override set(key: K, value: V): this {
    value.rSet(key)
    return super.set(key, value)
  }

  override delete(key: K): boolean {
    const v = super.get(key)
    if (v) v.rDelete(key)
    return super.delete(key)
  }
}

export abstract class MadisonItemMap<K, V extends MadisonMapItem<K>> extends Map<K, V> {
  override get(key: K) {
    const v = super.get(key)
    if (v) v.rGet(key)
    return v
  }

  override set(key: K, value: V): this {
    value.rSet(key)
    return super.set(key, value)
  }

  override delete(key: K): boolean {
    const v = super.get(key)
    if (v) v.rDelete(key)
    return super.delete(key)
  }

  abstract rGet(key: K): void
  abstract rSet(key: K): void
  abstract rDelete(key: K): void
}
