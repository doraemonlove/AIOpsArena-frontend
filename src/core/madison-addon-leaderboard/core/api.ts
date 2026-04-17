import { service } from '@/core/madison/utils'
import type {
  CreateLeaderboardPayload,
  DeleteLeaderboardPayload,
  DeleteLeaderboardItemPayload,
  LeaderboardDetail,
  ListAvailableTrainRunsRes,
  ListLeaderboardParams,
  ListLeaderboardRes,
  RerunLeaderboardItemPayload,
  ToggleLeaderboardVisibilityPayload,
  ToggleLeaderboardVisibilityRes
} from '../types'

export function listLeaderboard(params?: ListLeaderboardParams) {
  return service<ListLeaderboardRes>({
    url: '/leaderboard/list',
    method: 'get',
    params
  })
}

export function getLeaderboardDetail(id: number) {
  return service<LeaderboardDetail>({
    url: '/leaderboard/get_detail',
    method: 'get',
    params: {
      id
    }
  })
}

export function createLeaderboard(payload: CreateLeaderboardPayload) {
  return service<null>({
    url: '/leaderboard/create',
    method: 'post',
    data: payload
  })
}

export function deleteLeaderboard(payload: DeleteLeaderboardPayload) {
  return service<null>({
    url: '/leaderboard/delete_leaderboard',
    method: 'post',
    data: payload
  })
}

export function deleteLeaderboardItem(payload: DeleteLeaderboardItemPayload) {
  return service<null>({
    url: '/leaderboard/delete_item',
    method: 'post',
    data: payload
  })
}

export function rerunLeaderboardItem(payload: RerunLeaderboardItemPayload) {
  return service<null>({
    url: '/leaderboard/rerun_item',
    method: 'post',
    data: payload
  })
}

export function toggleLeaderboardVisibility(payload: ToggleLeaderboardVisibilityPayload) {
  return service<ToggleLeaderboardVisibilityRes>({
    url: '/leaderboard/toggle_visibility',
    method: 'post',
    data: payload
  })
}

export function listAvailableTrainRuns() {
  return service<ListAvailableTrainRunsRes>({
    url: '/algorithm/list_available_train_runs',
    method: 'get'
  })
}
