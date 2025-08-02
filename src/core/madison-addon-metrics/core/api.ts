import { service } from '@/core/madison/utils'
import type { TopologyOptions, PodTopologyRes, NodeTopologyRes } from '../types'

export function getPodTopology(options: TopologyOptions) {
  return service<PodTopologyRes>({
    url: '/monitor/servicetopology',
    method: 'get',
    params: options
  })
}

export function getNodeTopology(options: TopologyOptions) {
  return service<NodeTopologyRes>({
    url: '/monitor/nodetopology',
    method: 'get',
    params: options
  })
}

export function getNodeList() {
  return service<string[]>({
    url: '/monitor/nodelist',
    method: 'get'
  })
}
