import EventEmitter from 'eventemitter3'

export class TraceDetailEE extends EventEmitter {
  static instance: TraceDetailEE | null = null
  static getInstance(): TraceDetailEE {
    if (!TraceDetailEE.instance) {
      TraceDetailEE.instance = new TraceDetailEE()
    }
    return TraceDetailEE.instance
  }

  destroyed() {
    this.removeAllListeners()
  }
}
