import { service } from '@/core/madison/utils'
import type {
  BuildAlgorithmImageOptions,
  BuildAlgorithmImageStatusRes,
  CancelRunOptions,
  DeleteAlgorithmOptions,
  DeleteAlgorithmRunOptions,
  GetRunLogRes,
  ImportAlgorithmOptions,
  ImportAlgorithmRes,
  ImportAlgorithmStatusRes,
  ListAvailableTrainRunsRes,
  ListAlgorithmRes,
  ListAlgorithmTypeRes,
  ListTestRunsRes,
  RunDetail,
  RunTestOptions,
  ListTrainRunsRes,
  RunAlgorithmOptions,
  RunAlgorithmRes,
  ToggleAlgorithmVisibilityOptions,
  ToggleAlgorithmVisibilityRes
} from '../types'

export function listAlgorithmType() {
  return service<ListAlgorithmTypeRes>({
    url: '/algorithm/list_algorithm_type',
    method: 'get'
  })
}

export function listAlgorithm() {
  return service<ListAlgorithmRes>({
    url: '/algorithm/list_algorithm',
    method: 'get'
  })
}

export function importAlgorithm(options: ImportAlgorithmOptions) {
  const formData = new FormData()
  formData.append('algorithm_name', options.algorithm_name)
  formData.append('algorithm_type', options.algorithm_type)
  formData.append('dataset_type', options.dataset_type)
  formData.append('visibility', String(options.visibility))
  formData.append('uploaded_file', options.file)
  return service<ImportAlgorithmRes>({
    url: '/algorithm/import_algorithm',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getImportAlgorithmStatus(templateId: number) {
  return service<ImportAlgorithmStatusRes>({
    url: '/algorithm/get_import_algorithm_status',
    method: 'get',
    params: {
      template_id: templateId
    }
  })
}

export function buildAlgorithmImage(options: BuildAlgorithmImageOptions) {
  return service<null>({
    url: '/algorithm/build_algorithm_image',
    method: 'post',
    data: options
  })
}

export function getBuildAlgorithmImageStatus(templateId: number) {
  return service<BuildAlgorithmImageStatusRes>({
    url: '/algorithm/get_build_algorithm_image_status',
    method: 'get',
    params: {
      template_id: templateId
    }
  })
}

export function deleteAlgorithm(options: DeleteAlgorithmOptions) {
  return service<null>({
    url: '/algorithm/delete_algorithm',
    method: 'post',
    data: options
  })
}

export function toggleAlgorithmVisibility(options: ToggleAlgorithmVisibilityOptions) {
  return service<ToggleAlgorithmVisibilityRes>({
    url: '/algorithm/toggle_algorithm_visibility',
    method: 'post',
    data: options
  })
}

export function downloadAlgorithmTemplate() {
  return service<Blob>({
    url: '/algorithm/download_algorithm_template',
    method: 'get',
    responseType: 'blob'
  })
}

export function listTrainRuns() {
  return service<ListTrainRunsRes>({
    url: '/algorithm/list_train_runs',
    method: 'get'
  })
}

export function listTestRuns() {
  return service<ListTestRunsRes>({
    url: '/algorithm/list_test_runs',
    method: 'get'
  })
}

export function runAlgorithm(options: RunAlgorithmOptions) {
  return service<RunAlgorithmRes>({
    url: '/algorithm/run_algorithm',
    method: 'post',
    data: options
  })
}

export function runTest(options: RunTestOptions) {
  return service<RunAlgorithmRes>({
    url: '/algorithm/run_algorithm',
    method: 'post',
    data: options
  })
}

export function deleteAlgorithmRun(options: DeleteAlgorithmRunOptions) {
  return service<null>({
    url: '/algorithm/delete_algorithm_run',
    method: 'post',
    data: options
  })
}

export function cancelRun(options: CancelRunOptions) {
  return service<null>({
    url: '/algorithm/cancel_run',
    method: 'post',
    data: options
  })
}

export function getRunDetail(id: number) {
  return service<RunDetail>({
    url: '/algorithm/get_run_detail',
    method: 'get',
    params: {
      id
    }
  })
}

export function getRunLog(id: number) {
  return service<GetRunLogRes>({
    url: '/algorithm/get_run_log',
    method: 'get',
    params: {
      id
    }
  })
}

export function listAvailableTrainRuns() {
  return service<ListAvailableTrainRunsRes>({
    url: '/algorithm/list_available_train_runs',
    method: 'get'
  })
}
