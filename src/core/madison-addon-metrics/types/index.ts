export interface TopologyOptions {
  namespace: string
}

export interface PodTopologyResItem {
  calls: string[]
  instances: string[]
}

export interface PodTopologyRes {
  services: Record<string, PodTopologyResItem>
}

export type NodeTopologyRes = Record<string, string[]>
